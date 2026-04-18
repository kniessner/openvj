/**
 * Uji — iterative geometric line art renderer + animator.
 * Port of the algorithm from https://github.com/doersino/uji
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type UjiBlendMode =
  | 'source-over' | 'screen'   | 'multiply'   | 'overlay'
  | 'lighter'     | 'darken'   | 'lighten'     | 'difference'
  | 'exclusion'   | 'color-dodge' | 'color-burn' | 'hard-light'

export interface UjiAudioMod {
  rotByLow: number        // deg/iter added per unit of bass (–4 to 4)
  rotByBeat: number       // deg/iter added per beat pulse (–6 to 6)
  jitterByHigh: number    // px jitter added per treble unit (0 to 10)
  jitterByBeat: number    // px jitter added per beat unit (0 to 10)
  expansionByLow: number  // expansion added per bass unit (–0.006 to 0.006)
  hueshiftByMid: number   // hue shift added per mid unit (–12 to 12)
  clearOnBeat: boolean    // partially flush canvas on each beat peak
}

export const DEFAULT_AUDIO_MOD: UjiAudioMod = {
  rotByLow: 0, rotByBeat: 0, jitterByHigh: 0, jitterByBeat: 0,
  expansionByLow: 0, hueshiftByMid: 0, clearOnBeat: false,
}

export interface UjiParams {
  // Geometry
  shape: 1 | 2 | 3 | 4   // circle / square / triangle / line
  segments: number
  radius: number
  iterations: number

  // Rotation
  rotationSpeed: number
  rotationSpeedup: number
  rotationPeriod: number    // –1 = off
  rotationUntil?: number    // –1 = always; ≥0 = freeze rotation after N iters
  rotationOriginH?: number  // 0–1, default 0.5 (canvas center)
  rotationOriginV?: number  // 0–1, default 0.5 (canvas center)

  // Motion
  expansionH: number
  expansionV: number
  translationH: number
  translationV: number

  // Texture
  jitter: number
  wavinessPH: number        // –1 = off
  wavinessAH: number
  wavinessPV: number        // –1 = off
  wavinessAV: number

  // Visibility
  skipChance: number
  segmentRotation: number
  revealSpeed?: number      // –1 = instant (all segs); >0 = segs added per iter

  // Appearance
  thickness: number
  lineR: number; lineG: number; lineB: number
  lineOpacity: number
  hueshiftSpeed: number
  bgR: number; bgG: number; bgB: number
  blendMode?: UjiBlendMode
  shadowBlur?: number       // 0 = off; >0 = glow radius at 512px canvas
  lineCap?: 'auto' | 'butt' | 'round' | 'square'

  // Animation
  animate: boolean          // incremental frame-by-frame mode
  itersPerFrame: number     // iterations processed per animation frame (1–10)

  // Audio modulation (used when animate = true)
  audioMod: UjiAudioMod
}

// ─── Defaults & presets ───────────────────────────────────────────────────────

export const DEFAULT_UJI_PARAMS: UjiParams = {
  shape: 1, segments: 600, radius: 190, iterations: 250,
  rotationSpeed: 1.5, rotationSpeedup: 0, rotationPeriod: -1,
  rotationUntil: -1, rotationOriginH: 0.5, rotationOriginV: 0.5,
  expansionH: 1.0005, expansionV: 1.0005,
  translationH: 0, translationV: 0,
  jitter: 2, wavinessPH: -1, wavinessAH: 0, wavinessPV: -1, wavinessAV: 0,
  skipChance: 0, segmentRotation: 0, revealSpeed: -1,
  thickness: 0.8, lineR: 80, lineG: 140, lineB: 255, lineOpacity: 0.25,
  hueshiftSpeed: 0.8, bgR: 5, bgG: 0, bgB: 15,
  blendMode: 'source-over', shadowBlur: 0, lineCap: 'auto',
  animate: false, itersPerFrame: 3, audioMod: { ...DEFAULT_AUDIO_MOD },
}

const STATIC: Pick<UjiParams, 'animate' | 'itersPerFrame' | 'audioMod'> = {
  animate: false, itersPerFrame: 3, audioMod: { ...DEFAULT_AUDIO_MOD },
}

export const UJI_PRESETS: Record<string, UjiParams> = {
  Galaxy: { ...DEFAULT_UJI_PARAMS },

  Helix: {
    shape: 4, segments: 800, radius: 200, iterations: 200,
    rotationSpeed: 2.5, rotationSpeedup: 0, rotationPeriod: 80,
    expansionH: 1.0, expansionV: 1.0, translationH: 0, translationV: 0,
    jitter: 1, wavinessPH: 300, wavinessAH: 6, wavinessPV: 150, wavinessAV: 4,
    skipChance: 0, segmentRotation: 0,
    thickness: 0.7, lineR: 0, lineG: 220, lineB: 140, lineOpacity: 0.4,
    hueshiftSpeed: 1.2, bgR: 0, bgG: 0, bgB: 5, ...STATIC,
  },

  Vortex: {
    shape: 1, segments: 1200, radius: 200, iterations: 350,
    rotationSpeed: 2.0, rotationSpeedup: 0.003, rotationPeriod: -1,
    expansionH: 0.9985, expansionV: 0.9985, translationH: 0, translationV: 0,
    jitter: 3, wavinessPH: -1, wavinessAH: 0, wavinessPV: -1, wavinessAV: 0,
    skipChance: 0.04, segmentRotation: 0,
    thickness: 0.6, lineR: 255, lineG: 50, lineB: 200, lineOpacity: 0.2,
    hueshiftSpeed: 2, bgR: 0, bgG: 0, bgB: 0, ...STATIC,
  },

  Geometric: {
    shape: 2, segments: 800, radius: 160, iterations: 150,
    rotationSpeed: 1.0, rotationSpeedup: 0, rotationPeriod: -1,
    expansionH: 1.002, expansionV: 1.002, translationH: 0, translationV: 0,
    jitter: 0, wavinessPH: -1, wavinessAH: 0, wavinessPV: -1, wavinessAV: 0,
    skipChance: 0, segmentRotation: 0,
    thickness: 1, lineR: 255, lineG: 200, lineB: 0, lineOpacity: 0.5,
    hueshiftSpeed: 0, bgR: 0, bgG: 0, bgB: 0, ...STATIC,
  },

  Storm: {
    shape: 4, segments: 1500, radius: 220, iterations: 180,
    rotationSpeed: 5.0, rotationSpeedup: 0, rotationPeriod: 50,
    expansionH: 1.0, expansionV: 1.0, translationH: 0, translationV: 0,
    jitter: 5, wavinessPH: -1, wavinessAH: 0, wavinessPV: -1, wavinessAV: 0,
    skipChance: 0.08, segmentRotation: 0,
    thickness: 0.5, lineR: 200, lineG: 0, lineB: 255, lineOpacity: 0.28,
    hueshiftSpeed: 3, bgR: 0, bgG: 0, bgB: 8, ...STATIC,
  },

  Triangle: {
    shape: 3, segments: 600, radius: 180, iterations: 200,
    rotationSpeed: 0.8, rotationSpeedup: 0, rotationPeriod: 200,
    expansionH: 1.001, expansionV: 1.001, translationH: 0, translationV: 0,
    jitter: 1.5, wavinessPH: 200, wavinessAH: 4, wavinessPV: -1, wavinessAV: 0,
    skipChance: 0, segmentRotation: 0,
    thickness: 0.8, lineR: 100, lineG: 255, lineB: 180, lineOpacity: 0.35,
    hueshiftSpeed: 1.5, bgR: 0, bgG: 5, bgB: 0, ...STATIC,
  },

  // ── New feature showcase presets ───────────────────────────────────────────

  'Neon Bloom': {
    shape: 1, segments: 1000, radius: 175, iterations: 300,
    rotationSpeed: 1.2, rotationSpeedup: 0, rotationPeriod: 150,
    expansionH: 1.0003, expansionV: 1.0003, translationH: 0, translationV: 0,
    jitter: 1.5, wavinessPH: -1, wavinessAH: 0, wavinessPV: -1, wavinessAV: 0,
    skipChance: 0, segmentRotation: 0,
    thickness: 0.9, lineR: 0, lineG: 180, lineB: 255, lineOpacity: 0.28,
    hueshiftSpeed: 1.2, bgR: 0, bgG: 0, bgB: 0,
    blendMode: 'screen', shadowBlur: 8, lineCap: 'round', ...STATIC,
  },

  'Off-Center': {
    shape: 1, segments: 800, radius: 150, iterations: 250,
    rotationSpeed: 2.5, rotationSpeedup: 0, rotationPeriod: -1,
    expansionH: 1.0, expansionV: 1.0, translationH: 0, translationV: 0,
    rotationOriginH: 0.28, rotationOriginV: 0.38,
    jitter: 1.5, wavinessPH: -1, wavinessAH: 0, wavinessPV: -1, wavinessAV: 0,
    skipChance: 0, segmentRotation: 0,
    thickness: 0.7, lineR: 255, lineG: 120, lineB: 20, lineOpacity: 0.32,
    hueshiftSpeed: 1.5, bgR: 0, bgG: 0, bgB: 4, ...STATIC,
  },

  'Spiral Reveal': {
    shape: 4, segments: 1000, radius: 200, iterations: 400,
    rotationSpeed: 1.8, rotationSpeedup: 0.0008, rotationPeriod: -1,
    expansionH: 1.0, expansionV: 1.0, translationH: 0, translationV: 0,
    jitter: 0.5, wavinessPH: -1, wavinessAH: 0, wavinessPV: -1, wavinessAV: 0,
    skipChance: 0, segmentRotation: 0, revealSpeed: 3,
    thickness: 0.65, lineR: 80, lineG: 210, lineB: 255, lineOpacity: 0.42,
    hueshiftSpeed: 0.6, bgR: 0, bgG: 2, bgB: 8,
    blendMode: 'screen', ...STATIC,
  },

  // ── Audio-reactive animated presets ────────────────────────────────────────

  'Beat Pulse': {
    shape: 1, segments: 800, radius: 190, iterations: 200,
    rotationSpeed: 1.0, rotationSpeedup: 0, rotationPeriod: -1,
    expansionH: 1.0, expansionV: 1.0, translationH: 0, translationV: 0,
    jitter: 1.5, wavinessPH: -1, wavinessAH: 0, wavinessPV: -1, wavinessAV: 0,
    skipChance: 0.04, segmentRotation: 0,
    thickness: 0.8, lineR: 255, lineG: 100, lineB: 50, lineOpacity: 0.3,
    hueshiftSpeed: 1, bgR: 0, bgG: 0, bgB: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 1.5, rotByBeat: 5.0, jitterByHigh: 1.0, jitterByBeat: 4.0, expansionByLow: 0.001, hueshiftByMid: 4.0, clearOnBeat: true },
  },

  'Bass Bloom': {
    shape: 1, segments: 1000, radius: 160, iterations: 300,
    rotationSpeed: 0.8, rotationSpeedup: 0, rotationPeriod: 120,
    expansionH: 0.999, expansionV: 0.999, translationH: 0, translationV: 0,
    jitter: 1, wavinessPH: 500, wavinessAH: 3, wavinessPV: -1, wavinessAV: 0,
    skipChance: 0.02, segmentRotation: 0,
    thickness: 0.7, lineR: 50, lineG: 200, lineB: 255, lineOpacity: 0.25,
    hueshiftSpeed: 0.5, bgR: 0, bgG: 0, bgB: 5,
    animate: true, itersPerFrame: 2,
    audioMod: { rotByLow: 2.5, rotByBeat: 2.0, jitterByHigh: 0, jitterByBeat: 1.0, expansionByLow: 0.003, hueshiftByMid: 6.0, clearOnBeat: false },
  },

  'Freq Web': {
    shape: 4, segments: 1200, radius: 210, iterations: 200,
    rotationSpeed: 3.0, rotationSpeedup: 0, rotationPeriod: 60,
    expansionH: 1.0, expansionV: 1.0, translationH: 0, translationV: 0,
    jitter: 2, wavinessPH: 250, wavinessAH: 5, wavinessPV: 150, wavinessAV: 3,
    skipChance: 0.06, segmentRotation: 0,
    thickness: 0.6, lineR: 180, lineG: 0, lineB: 255, lineOpacity: 0.28,
    hueshiftSpeed: 2, bgR: 2, bgG: 0, bgB: 8,
    animate: true, itersPerFrame: 4,
    audioMod: { rotByLow: 0, rotByBeat: 3.0, jitterByHigh: 5.0, jitterByBeat: 2.0, expansionByLow: 0, hueshiftByMid: 5.0, clearOnBeat: false },
  },

  'Glow Storm': {
    shape: 1, segments: 900, radius: 185, iterations: 250,
    rotationSpeed: 2.5, rotationSpeedup: 0, rotationPeriod: 80,
    expansionH: 0.9992, expansionV: 0.9992, translationH: 0, translationV: 0,
    jitter: 2, wavinessPH: -1, wavinessAH: 0, wavinessPV: -1, wavinessAV: 0,
    skipChance: 0.03, segmentRotation: 0,
    thickness: 0.8, lineR: 255, lineG: 80, lineB: 200, lineOpacity: 0.25,
    hueshiftSpeed: 2, bgR: 0, bgG: 0, bgB: 0,
    blendMode: 'screen', shadowBlur: 6, lineCap: 'round',
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 2.0, rotByBeat: 4.0, jitterByHigh: 2.0, jitterByBeat: 3.0, expansionByLow: 0.002, hueshiftByMid: 5.0, clearOnBeat: true },
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Shift RGB hue by `deg` degrees. Returns [r, g, b] 0–255. */
export function hueShiftRgb(r: number, g: number, b: number, deg: number): [number, number, number] {
  if (deg === 0) return [r, g, b]
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [r, g, b]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0)
        : max === gn ? (bn - rn) / d + 2
        :               (rn - gn) / d + 4
  h = ((h / 6 + deg / 360) % 1 + 1) % 1
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return [
    Math.round(hue2rgb(h + 1/3) * 255),
    Math.round(hue2rgb(h)       * 255),
    Math.round(hue2rgb(h - 1/3) * 255),
  ]
}

/** Populate px/py arrays with the initial shape. */
function initShape(
  px: Float32Array, py: Float32Array,
  cx: number, cy: number, r: number,
  shape: 1 | 2 | 3 | 4, N: number,
) {
  const s3 = Math.sqrt(3)
  for (let i = 0; i < N; i++) {
    const t = i / N
    switch (shape) {
      case 1:
        px[i] = cx + r * Math.cos(2 * Math.PI * t)
        py[i] = cy + r * Math.sin(2 * Math.PI * t)
        break
      case 2: {
        const side = Math.floor(4 * t), st = (4 * t) % 1
        if      (side === 0) { px[i] = cx - r + 2*r*st; py[i] = cy - r }
        else if (side === 1) { px[i] = cx + r;           py[i] = cy - r + 2*r*st }
        else if (side === 2) { px[i] = cx + r - 2*r*st; py[i] = cy + r }
        else                 { px[i] = cx - r;           py[i] = cy + r - 2*r*st }
        break
      }
      case 3: {
        const V: [number, number][] = [
          [cx, cy - r],
          [cx + r*s3/2, cy + r/2],
          [cx - r*s3/2, cy + r/2],
        ]
        const side = Math.floor(3 * t), st = (3 * t) % 1
        const [x0, y0] = V[side], [x1, y1] = V[(side + 1) % 3]
        px[i] = x0 + (x1 - x0) * st
        py[i] = y0 + (y1 - y0) * st
        break
      }
      case 4:
        px[i] = cx - r + 2 * r * t
        py[i] = cy
        break
    }
  }
}

/**
 * Pixel scale factor relative to the reference 512px canvas.
 * Scales all pixel-space params proportionally when rendering larger textures.
 */
function getPixelScale(canvas: HTMLCanvasElement): number {
  return canvas.width / 512
}

/** Draw one iteration onto a canvas. N controls how many segments are drawn. */
function drawIteration(
  ctx: CanvasRenderingContext2D,
  px: Float32Array, py: Float32Array,
  N: number, hue: number, params: UjiParams, rng: () => number,
  scale = 1,
) {
  const [lr, lg, lb] = hueShiftRgb(params.lineR, params.lineG, params.lineB, hue)
  const blendMode  = params.blendMode  ?? 'source-over'
  const shadowBlur = params.shadowBlur ?? 0
  const capMode    = params.lineCap    ?? 'auto'

  ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation
  ctx.strokeStyle = `rgba(${lr},${lg},${lb},${params.lineOpacity})`
  ctx.lineWidth   = params.thickness * scale
  ctx.lineCap     = capMode === 'auto'
    ? (params.thickness * scale >= 1 ? 'round' : 'butt')
    : capMode

  if (shadowBlur > 0) {
    ctx.shadowBlur  = shadowBlur * scale
    ctx.shadowColor = `rgba(${lr},${lg},${lb},0.9)`
  }

  ctx.beginPath()
  if (params.segmentRotation !== 0) {
    const sr = params.segmentRotation * (Math.PI / 180)
    const cosSR = Math.cos(sr), sinSR = Math.sin(sr)
    for (let i = 1; i < N; i++) {
      if (params.skipChance > 0 && rng() < params.skipChance) continue
      const mx = (px[i] + px[i-1]) / 2, my = (py[i] + py[i-1]) / 2
      const dx1 = px[i-1]-mx, dy1 = py[i-1]-my, dx2 = px[i]-mx, dy2 = py[i]-my
      ctx.moveTo(mx + dx1*cosSR - dy1*sinSR, my + dx1*sinSR + dy1*cosSR)
      ctx.lineTo(mx + dx2*cosSR - dy2*sinSR, my + dx2*sinSR + dy2*cosSR)
    }
  } else {
    ctx.moveTo(px[0], py[0])
    for (let i = 1; i < N; i++) {
      if (params.skipChance > 0 && rng() < params.skipChance) {
        ctx.moveTo(px[i], py[i])
      } else {
        ctx.lineTo(px[i], py[i])
      }
    }
  }
  ctx.stroke()

  if (shadowBlur > 0) ctx.shadowBlur = 0
  ctx.globalCompositeOperation = 'source-over'
}

// ─── Static one-shot renderer ────────────────────────────────────────────────

/**
 * Render uji art onto a canvas in one synchronous call.
 * @param quality 'preview' uses ~50% of segments/iterations for faster debounced preview
 */
export function renderUji(
  canvas: HTMLCanvasElement,
  params: UjiParams,
  seed?: number,
  quality: 'preview' | 'full' = 'full',
): void {
  const W = canvas.width, H = canvas.height
  const S = getPixelScale(canvas)
  const cx = W / 2, cy = H / 2
  const ox = W * (params.rotationOriginH ?? 0.5)
  const oy = H * (params.rotationOriginV ?? 0.5)
  const rotationUntil = params.rotationUntil ?? -1
  const revealSpeed   = params.revealSpeed   ?? -1

  const N = quality === 'preview'
    ? Math.max(80,  Math.round(params.segments   * 0.5))
    : params.segments
  const iters = quality === 'preview'
    ? Math.max(25,  Math.round(params.iterations * 0.55))
    : params.iterations

  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = `rgb(${params.bgR},${params.bgG},${params.bgB})`
  ctx.fillRect(0, 0, W, H)

  const px = new Float32Array(N)
  const py = new Float32Array(N)
  initShape(px, py, cx, cy, params.radius * S, params.shape, N)

  let rngState = ((seed ?? Math.random() * 1e9) | 0) >>> 0
  const rng = (): number => {
    rngState = ((rngState * 1664525 + 1013904223) >>> 0)
    return rngState / 0x100000000
  }

  let hue = 0
  let revealedCount = revealSpeed <= 0 ? N : 0

  for (let n = 0; n < iters; n++) {
    // Rotation angle — frozen after rotationUntil iters
    let angle = 0
    if (rotationUntil < 0 || n < rotationUntil) {
      angle = params.rotationSpeed * (Math.PI / 180)
      if (params.rotationSpeedup !== 0) angle *= (1 + params.rotationSpeedup * n)
      if (params.rotationPeriod  >  0) angle *= Math.sin(2 * Math.PI * n / params.rotationPeriod)
    }
    const cosA = Math.cos(angle), sinA = Math.sin(angle)

    for (let i = 0; i < N; i++) {
      let x = px[i], y = py[i]
      if (params.jitter > 0) { x += (rng() - 0.5) * params.jitter * S; y += (rng() - 0.5) * params.jitter * S }
      if (params.wavinessPH > 0) x += params.wavinessAH * S * Math.sin(2 * Math.PI * i / params.wavinessPH)
      if (params.wavinessPV > 0) y += params.wavinessAV * S * Math.sin(2 * Math.PI * i / params.wavinessPV)
      // Expansion always relative to canvas centre
      x = cx + (x - cx) * params.expansionH
      y = cy + (y - cy) * params.expansionV
      x += params.translationH * S
      y += params.translationV * S
      // Rotation around custom pivot (defaults to canvas centre)
      const dx = x - ox, dy = y - oy
      px[i] = ox + dx*cosA - dy*sinA
      py[i] = oy + dx*sinA + dy*cosA
    }

    if (revealSpeed > 0) revealedCount = Math.min(N, revealedCount + revealSpeed)
    const drawN = revealSpeed <= 0 ? N : Math.floor(revealedCount)

    hue += params.hueshiftSpeed
    if (drawN > 1) drawIteration(ctx, px, py, drawN, hue, params, rng, S)
  }
}

// ─── Incremental animator (audio-reactive) ───────────────────────────────────

/**
 * Maintains state between frames and renders one "step" per call.
 * Designed for use in requestAnimationFrame / tickAll loops.
 */
export class UjiAnimator {
  params: UjiParams
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private px!: Float32Array
  private py!: Float32Array
  private hue = 0
  private iteration = 0
  private revealedCount = 0
  private rngState: number
  private _prevBeat = 0
  private _S = 1

  constructor(canvas: HTMLCanvasElement, params: UjiParams) {
    this.canvas = canvas
    this.ctx    = canvas.getContext('2d')!
    this.params = params
    this.rngState = (Math.random() * 1e9 | 0) >>> 0
    this.init()
  }

  private rng(): number {
    this.rngState = ((this.rngState * 1664525 + 1013904223) >>> 0)
    return this.rngState / 0x100000000
  }

  init() {
    const { canvas, ctx, params } = this
    this._S = getPixelScale(canvas)
    const N = params.segments
    this.px = new Float32Array(N)
    this.py = new Float32Array(N)
    this.hue = 0
    this.iteration = 0
    this.revealedCount = (params.revealSpeed ?? -1) <= 0 ? N : 0
    initShape(this.px, this.py, canvas.width/2, canvas.height/2, params.radius * this._S, params.shape, N)
    ctx.fillStyle = `rgb(${params.bgR},${params.bgG},${params.bgB})`
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  step(low = 0, mid = 0, high = 0, beat = 0): void {
    const { ctx, canvas, params } = this
    const N  = params.segments
    const cx = canvas.width  / 2
    const cy = canvas.height / 2
    const ox = canvas.width  * (params.rotationOriginH ?? 0.5)
    const oy = canvas.height * (params.rotationOriginV ?? 0.5)
    const am = params.audioMod ?? DEFAULT_AUDIO_MOD
    const itersPerFrame = params.itersPerFrame ?? 3
    const rotationUntil = params.rotationUntil ?? -1
    const revealSpeed   = params.revealSpeed   ?? -1

    if (this.px.length !== N) {
      this.px = new Float32Array(N)
      this.py = new Float32Array(N)
      initShape(this.px, this.py, cx, cy, params.radius * this._S, params.shape, N)
      this.hue = 0
      this.iteration = 0
      this.revealedCount = revealSpeed <= 0 ? N : 0
    }

    if (am.clearOnBeat && beat > 0.85 && this._prevBeat <= 0.85) {
      ctx.fillStyle = `rgba(${params.bgR},${params.bgG},${params.bgB},0.55)`
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    this._prevBeat = beat

    for (let fi = 0; fi < itersPerFrame; fi++) {
      const n = this.iteration

      const rotSpeed = params.rotationSpeed + am.rotByLow * low + am.rotByBeat * beat
      const jitter   = Math.max(0, params.jitter + am.jitterByHigh * high + am.jitterByBeat * beat)
      const expH     = params.expansionH + am.expansionByLow * low
      const expV     = params.expansionV + am.expansionByLow * low

      let angle = 0
      if (rotationUntil < 0 || n < rotationUntil) {
        angle = rotSpeed * (Math.PI / 180)
        if (params.rotationSpeedup !== 0) angle *= (1 + params.rotationSpeedup * n)
        if (params.rotationPeriod  >  0) angle *= Math.sin(2 * Math.PI * n / params.rotationPeriod)
      }
      const cosA = Math.cos(angle), sinA = Math.sin(angle)

      const S = this._S
      for (let i = 0; i < N; i++) {
        let x = this.px[i], y = this.py[i]
        if (jitter > 0) { x += (this.rng() - 0.5) * jitter * S; y += (this.rng() - 0.5) * jitter * S }
        if (params.wavinessPH > 0) x += params.wavinessAH * S * Math.sin(2 * Math.PI * i / params.wavinessPH)
        if (params.wavinessPV > 0) y += params.wavinessAV * S * Math.sin(2 * Math.PI * i / params.wavinessPV)
        x = cx + (x - cx) * expH
        y = cy + (y - cy) * expV
        x += params.translationH * S
        y += params.translationV * S
        const dx = x - ox, dy = y - oy
        this.px[i] = ox + dx*cosA - dy*sinA
        this.py[i] = oy + dx*sinA + dy*cosA
      }

      if (revealSpeed > 0) this.revealedCount = Math.min(N, this.revealedCount + revealSpeed)
      const drawN = revealSpeed <= 0 ? N : Math.floor(this.revealedCount)

      this.hue += params.hueshiftSpeed + am.hueshiftByMid * mid
      if (drawN > 1) drawIteration(ctx, this.px, this.py, drawN, this.hue, params, () => this.rng(), S)

      this.iteration++

      if (this.iteration >= params.iterations) {
        ctx.fillStyle = `rgba(${params.bgR},${params.bgG},${params.bgB},0.65)`
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        initShape(this.px, this.py, cx, cy, params.radius * this._S, params.shape, N)
        this.hue = 0
        this.iteration = 0
        this.revealedCount = revealSpeed <= 0 ? N : 0
      }
    }
  }
}
