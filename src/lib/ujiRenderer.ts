/**
 * Uji Generator - Kaleidoscope pattern generator with canvas 2D rendering
 */

export interface UjiParams {
  segments: number
  zoom: number
  rotation: number
  colorShift: number
  speed: number
  complexity: number
  animate: boolean
  itersPerFrame: number
  iterations: number
  hueshiftSpeed: number
  audioMod: UjiAudioMod | number
  bgR: number
  bgG: number
  bgB: number
  expansionH: number
  expansionV: number
  jitter: number
  lineR: number
  lineG: number
  lineB: number
  lineOpacity: number
  radius: number
  rotationPeriod: number
  rotationSpeed: number
  rotationSpeedup: number
  segmentRotation: number
  shape: number | string
  skipChance: number
  thickness: number
  translationH: number
  translationV: number
  wavinessAH: number
  wavinessAV: number
  wavinessPH: number
  wavinessPV: number
}

export interface UjiAudioMod {
  rotByLow: number
  rotByBeat: number
  jitterByHigh: number
  jitterByBeat: number
  expansionByLow: number
  hueshiftByMid: number
  clearOnBeat: boolean
}

export const DEFAULT_UJI_PARAMS: UjiParams = {
  segments: 8,
  zoom: 1.5,
  rotation: 0,
  colorShift: 0,
  speed: 0.5,
  complexity: 1,
  animate: true,
  itersPerFrame: 1,
  iterations: 0,
  hueshiftSpeed: 0.1,
  audioMod: 0,
  bgR: 0,
  bgG: 0,
  bgB: 0,
  expansionH: 0,
  expansionV: 0,
  jitter: 0,
  lineR: 255,
  lineG: 255,
  lineB: 255,
  lineOpacity: 1,
  radius: 0.5,
  rotationPeriod: 1,
  rotationSpeed: 1,
  rotationSpeedup: 0,
  segmentRotation: 0,
  shape: 1,
  skipChance: 0,
  thickness: 1,
  translationH: 0,
  translationV: 0,
  wavinessAH: 0,
  wavinessAV: 0,
  wavinessPH: 0,
  wavinessPV: 0,
}

export const DEFAULT_AUDIO_MOD: UjiAudioMod = {
  rotByLow: 0,
  rotByBeat: 0,
  jitterByHigh: 0,
  jitterByBeat: 0,
  expansionByLow: 0,
  hueshiftByMid: 0,
  clearOnBeat: false,
}

export const defaultUjiParams = DEFAULT_UJI_PARAMS

// Preset collection
export const UJI_PRESETS: Record<string, UjiParams> = {
  Galaxy: {
    ...DEFAULT_UJI_PARAMS,
    segments: 12,
    zoom: 2.0,
    rotationSpeed: 0.3,
    complexity: 1.5,
    lineR: 100,
    lineG: 150,
    lineB: 255,
  },
  Helix: {
    ...DEFAULT_UJI_PARAMS,
    segments: 6,
    zoom: 1.8,
    rotationSpeed: 0.5,
    expansionV: 0.2,
    lineR: 255,
    lineG: 100,
    lineB: 200,
  },
  Vortex: {
    ...DEFAULT_UJI_PARAMS,
    segments: 16,
    zoom: 1.2,
    rotationSpeed: 1.0,
    jitter: 0.3,
    lineR: 255,
    lineG: 200,
    lineB: 50,
  },
  Geometric: {
    ...DEFAULT_UJI_PARAMS,
    segments: 8,
    zoom: 1.5,
    shape: 2, // Square
    lineR: 150,
    lineG: 255,
    lineB: 150,
  },
  Storm: {
    ...DEFAULT_UJI_PARAMS,
    segments: 20,
    zoom: 2.5,
    rotationSpeed: 0.8,
    jitter: 0.5,
    lineR: 200,
    lineG: 200,
    lineB: 255,
  },
  Triangle: {
    ...DEFAULT_UJI_PARAMS,
    segments: 3,
    zoom: 1.5,
    shape: 3, // Triangle
    lineR: 255,
    lineG: 150,
    lineB: 150,
  },
  'Beat Pulse': {
    ...DEFAULT_UJI_PARAMS,
    segments: 8,
    zoom: 1.5,
    audioMod: {
      ...DEFAULT_AUDIO_MOD,
      rotByBeat: 45,
      expansionByLow: 0.5,
    },
  },
  'Bass Bloom': {
    ...DEFAULT_UJI_PARAMS,
    segments: 12,
    zoom: 2.0,
    audioMod: {
      ...DEFAULT_AUDIO_MOD,
      expansionByLow: 1.0,
      jitterByBeat: 0.3,
    },
  },
  'Freq Web': {
    ...DEFAULT_UJI_PARAMS,
    segments: 16,
    zoom: 1.8,
    audioMod: {
      ...DEFAULT_AUDIO_MOD,
      rotByLow: 0.5,
      jitterByHigh: 0.4,
      hueshiftByMid: 30,
    },
  },
}

/**
 * UjiAnimator - Handles iterative animation of Uji patterns
 */
export class UjiAnimator {
  private iteration = 0
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  params: UjiParams

  constructor(canvas: HTMLCanvasElement, params: UjiParams) {
    this.canvas = canvas
    this.params = params
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get 2D context')
    this.ctx = ctx
    
    // Draw initial background
    this.ctx.fillStyle = `rgb(${params.bgR}, ${params.bgG}, ${params.bgB})`
    this.ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  reset(): void {
    this.iteration = 0
    this.ctx.fillStyle = `rgb(${this.params.bgR}, ${this.params.bgG}, ${this.params.bgB})`
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  step(audioLow: number, audioMid: number, audioHigh: number, audioBeat: number): void {
    const params = this.params
    const audioData = { low: audioLow, mid: audioMid, high: audioHigh, beat: audioBeat }
    
    // Perform itersPerFrame iterations
    for (let i = 0; i < params.itersPerFrame; i++) {
      this.renderFrame(params, audioData)
      this.iteration++
    }
  }

  private renderFrame(params: UjiParams, audioData: { low: number; mid: number; high: number; beat: number }): void {
    const { width, height } = this.canvas
    const ctx = this.ctx
    const centerX = width / 2
    const centerY = height / 2

    // Apply audio modulation if enabled
    const audioMod = typeof params.audioMod === 'number' ? DEFAULT_AUDIO_MOD : params.audioMod
    let rotationOffset = 0
    let jitterAmount = params.jitter
    let expansionAmount = 0
    let hueShift = 0

    if (typeof params.audioMod !== 'number') {
      rotationOffset += audioMod.rotByLow * audioData.low * 180 + audioMod.rotByBeat * audioData.beat * 90
      jitterAmount += audioMod.jitterByHigh * audioData.high + audioMod.jitterByBeat * audioData.beat
      expansionAmount = audioMod.expansionByLow * audioData.low
      hueShift = audioMod.hueshiftByMid * audioData.mid

      if (audioMod.clearOnBeat && audioData.beat > 0.8) {
        ctx.fillStyle = `rgb(${params.bgR}, ${params.bgG}, ${params.bgB})`
        ctx.fillRect(0, 0, width, height)
      }
    }

    // Calculate rotation for this frame
    const time = this.iteration * 0.016
    const rotation = params.rotation + 
      (params.rotationSpeed * time * params.rotationPeriod * 60) + 
      (params.rotationSpeedup * time * time) +
      rotationOffset

    // Line style with hue shift
    const r = Math.max(0, Math.min(255, params.lineR + hueShift))
    const g = Math.max(0, Math.min(255, params.lineG + hueShift * 0.5))
    const b = Math.max(0, Math.min(255, params.lineB - hueShift * 0.3))
    
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${params.lineOpacity})`
    ctx.lineWidth = params.thickness
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Draw kaleidoscope pattern
    const segmentAngle = (Math.PI * 2) / params.segments

    for (let seg = 0; seg < params.segments; seg++) {
      if (Math.random() < params.skipChance) continue

      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(rotation * (Math.PI / 180) + seg * segmentAngle + params.segmentRotation * (Math.PI / 180))

      // Apply expansion and translation
      const expansion = 1 + expansionAmount + params.expansionH
      const scale = params.zoom * expansion
      ctx.scale(scale, scale * (1 + params.expansionV))
      
      const transH = params.translationH * 50 + Math.sin(time * params.wavinessPH) * params.wavinessAH * 20
      const transV = params.translationV * 50 + Math.cos(time * params.wavinessPV) * params.wavinessAV * 20
      ctx.translate(transH, transV)

      // Draw shape with jitter
      const shapeType = typeof params.shape === 'number' ? params.shape : 1
      const radius = params.radius * 100
      const jitterX = (Math.random() - 0.5) * jitterAmount * 50
      const jitterY = (Math.random() - 0.5) * jitterAmount * 50

      ctx.beginPath()
      
      switch (shapeType) {
        case 1: // Circle
          ctx.arc(jitterX, jitterY, radius, 0, Math.PI * 2)
          break
        case 2: // Square
          ctx.rect(-radius + jitterX, -radius + jitterY, radius * 2, radius * 2)
          break
        case 3: // Triangle
          ctx.moveTo(jitterX, -radius + jitterY)
          ctx.lineTo(radius + jitterX, radius + jitterY)
          ctx.lineTo(-radius + jitterX, radius + jitterY)
          ctx.closePath()
          break
        case 4: // Line
          ctx.moveTo(-radius + jitterX, jitterY)
          ctx.lineTo(radius + jitterX, jitterY)
          break
      }

      ctx.stroke()
      ctx.restore()
    }
  }

  getIteration(): number {
    return this.iteration
  }
}

/**
 * Render Uji pattern to canvas (static or preview render)
 * @param canvas - HTML canvas element or 2D context
 * @param params - Uji parameters
 * @param seed - Random seed
 * @param mode - 'preview' for static render, 'export' for high quality
 */
export function renderUji(
  canvas: HTMLCanvasElement | CanvasRenderingContext2D,
  params: UjiParams,
  seed: number = 0,
  mode: 'preview' | 'export' = 'preview'
): void {
  const ctx = canvas instanceof HTMLCanvasElement ? canvas.getContext('2d') : canvas
  if (!ctx) throw new Error('Failed to get 2D context')
  
  const actualCanvas = canvas instanceof HTMLCanvasElement ? canvas : canvas.canvas
  const { width, height } = actualCanvas
  
  // Seed random for reproducibility
  const random = seededRandom(seed)
  
  // Clear with background
  ctx.fillStyle = `rgb(${params.bgR}, ${params.bgG}, ${params.bgB})`
  ctx.fillRect(0, 0, width, height)

  // Draw iterations
  const iterations = mode === 'preview' ? Math.min(params.iterations || 300, 300) : params.iterations || 1000
  
  for (let iter = 0; iter < iterations; iter++) {
    renderUjiFrame(ctx, params, iter, width, height, random)
  }
}

function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 9301 + 49297) % 233280
    return state / 233280
  }
}

function renderUjiFrame(
  ctx: CanvasRenderingContext2D,
  params: UjiParams,
  iteration: number,
  width: number,
  height: number,
  random: () => number
): void {
  const centerX = width / 2
  const centerY = height / 2

  const time = iteration * 0.016
  const rotation = params.rotation + 
    (params.rotationSpeed * time * params.rotationPeriod * 60) + 
    (params.rotationSpeedup * time * time)

  ctx.strokeStyle = `rgba(${params.lineR}, ${params.lineG}, ${params.lineB}, ${params.lineOpacity})`
  ctx.lineWidth = params.thickness
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const segmentAngle = (Math.PI * 2) / params.segments

  for (let seg = 0; seg < params.segments; seg++) {
    if (random() < params.skipChance) continue

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(rotation * (Math.PI / 180) + seg * segmentAngle + params.segmentRotation * (Math.PI / 180))

    const expansion = 1 + params.expansionH
    const scale = params.zoom * expansion
    ctx.scale(scale, scale * (1 + params.expansionV))
    
    const transH = params.translationH * 50 + Math.sin(time * params.wavinessPH) * params.wavinessAH * 20
    const transV = params.translationV * 50 + Math.cos(time * params.wavinessPV) * params.wavinessAV * 20
    ctx.translate(transH, transV)

    const shapeType = typeof params.shape === 'number' ? params.shape : 1
    const radius = params.radius * 100
    const jitterX = (random() - 0.5) * params.jitter * 50
    const jitterY = (random() - 0.5) * params.jitter * 50

    ctx.beginPath()
    
    switch (shapeType) {
      case 1: // Circle
        ctx.arc(jitterX, jitterY, radius, 0, Math.PI * 2)
        break
      case 2: // Square
        ctx.rect(-radius + jitterX, -radius + jitterY, radius * 2, radius * 2)
        break
      case 3: // Triangle
        ctx.moveTo(jitterX, -radius + jitterY)
        ctx.lineTo(radius + jitterX, radius + jitterY)
        ctx.lineTo(-radius + jitterX, radius + jitterY)
        ctx.closePath()
        break
      case 4: // Line
        ctx.moveTo(-radius + jitterX, jitterY)
        ctx.lineTo(radius + jitterX, jitterY)
        break
    }

    ctx.stroke()
    ctx.restore()
  }
}

/**
 * Generate GLSL shader code for Uji pattern with given parameters
 */
export function generateUjiShader(params: UjiParams): string {
  return `
// Uji Kaleidoscope Generator
void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);
  
  float a = atan(uv.y, uv.x);
  float r = length(uv);
  
  // Kaleidoscope segmentation
  float seg = 6.28318 / ${params.segments.toFixed(1)};
  a = mod(a + ${params.rotation.toFixed(2)}, seg);
  a = abs(a - seg * 0.5);
  
  vec2 p = vec2(cos(a), sin(a)) * r * ${params.zoom.toFixed(2)};
  
  float t = uTime * ${params.speed.toFixed(2)};
  
  // Layered patterns
  vec3 col = 0.5 + 0.5 * cos(
    p.x * ${params.complexity.toFixed(1)} * 3.0 + t * vec3(1.0, 0.7, 0.4) + ${params.colorShift.toFixed(2)} +
    p.y * ${params.complexity.toFixed(1)} * 3.0 + vec3(0.0, 2.0, 4.0)
  );
  
  // Vignette
  col *= smoothstep(2.5, 0.5, r);
  
  gl_FragColor = vec4(col, 1.0);
}
`
}
