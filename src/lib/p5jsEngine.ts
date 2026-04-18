/**
 * OpenVJ - p5.js Integration Engine
 *
 * Runs p5.js sketches written in global mode (function setup / function draw)
 * inside instance mode by using `with`-scope injection via new Function.
 * Each source renders into an offscreen canvas that feeds a Three.js texture.
 */

import p5 from 'p5'
import * as THREE from 'three'
import { audioEngine } from './audioEngine'

export interface P5JsSketch {
  id: string
  name: string
  code: string
  mode: '2D' | 'WEBGL'
  width: number
  height: number
}

export interface P5JsSource {
  getTexture(): THREE.CanvasTexture
  getCanvas(): HTMLCanvasElement
  pause(): void
  resume(): void
  dispose(): void
  updateMidi(cc: number, value: number): void
  onError(handler: (error: Error) => void): void
}

// ─── P5JsSourceImpl ──────────────────────────────────────────────────────────

class P5JsSourceImpl implements P5JsSource {
  private p5Instance: p5 | null = null
  private container: HTMLDivElement
  private canvas: HTMLCanvasElement       // our texture canvas (copied from p5 each frame)
  private texture: THREE.CanvasTexture
  private isRunning = false
  private audioRafId: number | null = null
  private errorHandler: ((e: Error) => void) | null = null

  private audio = { low: 0, mid: 0, high: 0, avg: 0, beat: 0, bpm: 120 }
  private midi = { knobs: new Array(128).fill(0) as number[] }

  constructor(private sketch: P5JsSketch, private onTextureUpdate?: () => void) {
    // Hidden div for p5 to append its canvas into
    this.container = document.createElement('div')
    this.container.style.cssText =
      'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;pointer-events:none;'
    document.body.appendChild(this.container)

    // Our stable texture canvas (p5 frame is copied here each draw)
    this.canvas = document.createElement('canvas')
    this.canvas.width = sketch.width
    this.canvas.height = sketch.height

    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.minFilter = THREE.LinearFilter
    this.texture.magFilter = THREE.LinearFilter
    this.texture.colorSpace = THREE.SRGBColorSpace
    this.texture.generateMipmaps = false

    this.initP5()
  }

  private initP5(): void {
    const self = this
    const { sketch, audio, midi } = this

    // OpenVJ bridge exposed as `openvj` in sketch code
    const bridge = {
      audio: {
        getLow:  () => audio.low,
        getMid:  () => audio.mid,
        getHigh: () => audio.high,
        getAvg:  () => audio.avg,
        getBeat: () => audio.beat,
        getBpm:  () => audio.bpm,
      },
      midi: { getCC: (cc: number) => midi.knobs[cc] ?? 0 },
    }

    const sketchFn = (p: p5) => {
      // Proxy routes any identifier lookup to the p5 instance (global-mode compat)
      const scope = new Proxy({ openvj: bridge } as Record<string, unknown>, {
        has() { return true },
        get(target, prop: string) {
          if (prop === 'openvj') return target.openvj
          const v = (p as any)[prop]
          return typeof v === 'function' ? v.bind(p) : v
        },
      })

      // Compile user code once. new Function runs in sloppy mode → `with` is legal.
      // Functions defined inside `with` close over the scope, so p5 globals remain
      // reachable when setup()/draw() are called later.
      let userSetup: (() => void) | null = null
      let userDraw: (() => void) | null = null

      try {
        // eslint-disable-next-line no-new-func
        const compile = new Function(
          '_s',
          `with(_s){${sketch.code}\nreturn{` +
          `setup:typeof setup!="undefined"?setup:null,` +
          `draw:typeof draw!="undefined"?draw:null}}`
        )
        const fns = compile(scope) as { setup: (() => void) | null; draw: (() => void) | null }
        userSetup = fns.setup
        userDraw = fns.draw
      } catch (e) {
        self.handleError(e as Error)
        return
      }

      p.setup = () => {
        try {
          if (userSetup) {
            userSetup()
          } else {
            sketch.mode === 'WEBGL'
              ? p.createCanvas(sketch.width, sketch.height, p.WEBGL)
              : p.createCanvas(sketch.width, sketch.height)
          }
          self.isRunning = true
          self.startAudioUpdate()
        } catch (e) {
          self.handleError(e as Error)
        }
      }

      p.draw = () => {
        if (!self.isRunning) return
        try {
          if (userDraw) userDraw()

          // Copy p5's rendered canvas → our stable texture canvas
          const src = (p as any).canvas as HTMLCanvasElement | null
          if (src && src !== self.canvas) {
            if (self.canvas.width !== src.width || self.canvas.height !== src.height) {
              self.canvas.width = src.width
              self.canvas.height = src.height
            }
            self.canvas.getContext('2d')?.drawImage(src, 0, 0)
          }

          self.texture.needsUpdate = true
          self.onTextureUpdate?.()
        } catch (e) {
          self.handleError(e as Error)
        }
      }
    }

    try {
      this.p5Instance = new p5(sketchFn, this.container)
    } catch (e) {
      this.handleError(e as Error)
    }
  }

  // Pull audio values from the global audio engine each frame
  private startAudioUpdate(): void {
    const tick = () => {
      if (!this.isRunning) return
      this.audio.low  = audioEngine.low  * 255
      this.audio.mid  = audioEngine.mid  * 255
      this.audio.high = audioEngine.high * 255
      this.audio.avg  = ((audioEngine.low + audioEngine.mid + audioEngine.high) / 3) * 255
      this.audio.beat = audioEngine.beat
      this.audio.bpm  = audioEngine.bpm
      this.audioRafId = requestAnimationFrame(tick)
    }
    this.audioRafId = requestAnimationFrame(tick)
  }

  private handleError(error: Error): void {
    console.error('[P5JsSource]', error)
    this.isRunning = false
    if (this.audioRafId) cancelAnimationFrame(this.audioRafId)
    this.errorHandler?.(error)
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  onError(handler: (e: Error) => void): void { this.errorHandler = handler }
  getTexture(): THREE.CanvasTexture { return this.texture }
  getCanvas(): HTMLCanvasElement { return this.canvas }

  updateMidi(cc: number, value: number): void {
    if (cc >= 0 && cc < 128) this.midi.knobs[cc] = value
  }

  pause(): void {
    this.isRunning = false
    if (this.audioRafId) cancelAnimationFrame(this.audioRafId)
    this.p5Instance?.noLoop()
  }

  resume(): void {
    this.isRunning = true
    this.p5Instance?.loop()
    this.startAudioUpdate()
  }

  resize(width: number, height: number): void {
    this.canvas.width = width
    this.canvas.height = height
    this.p5Instance?.resizeCanvas(width, height)
  }

  dispose(): void {
    this.isRunning = false
    if (this.audioRafId) cancelAnimationFrame(this.audioRafId)
    this.p5Instance?.remove()
    this.p5Instance = null
    this.texture.dispose()
    if (this.container.parentNode) document.body.removeChild(this.container)
  }
}

// ─── P5JsEngine ──────────────────────────────────────────────────────────────

export class P5JsEngine {
  private sources = new Map<string, P5JsSourceImpl>()

  createSource(sketch: P5JsSketch, onTextureUpdate?: () => void): P5JsSource {
    const existing = this.sources.get(sketch.id)
    if (existing) { existing.dispose(); this.sources.delete(sketch.id) }
    const source = new P5JsSourceImpl(sketch, onTextureUpdate)
    this.sources.set(sketch.id, source)
    return source
  }

  getSource(id: string): P5JsSource | undefined {
    return this.sources.get(id)
  }

  removeSource(id: string): void {
    const s = this.sources.get(id)
    if (s) { s.dispose(); this.sources.delete(id) }
  }

  updateMidiAll(cc: number, value: number): void {
    this.sources.forEach((s) => s.updateMidi(cc, value))
  }

  dispose(): void {
    this.sources.forEach((s) => s.dispose())
    this.sources.clear()
  }
}

export const p5jsEngine = new P5JsEngine()
