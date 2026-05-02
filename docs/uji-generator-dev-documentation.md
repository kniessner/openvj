# Uji Generator & Controller — Developer Documentation

## Overview

The **Uji Generator** is a real-time generative line-art visual system integrated into OpenVJ. It renders iterative geometric patterns using HTML5 Canvas, with full support for animation, audio reactivity, and live parameter control.

**Port source:** [github.com/doersino/uji](https://github.com/doersino/uji)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Uji System                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────┐   │
│  │  UjiControls    │────▶│   assetStore    │────▶│assetTextureManager  │   │
│  │  (React Component)    │   (Zustand)     │     │  (Texture lifecycle) │   │
│  └─────────────────┘     └─────────────────┘     └─────────────────────┘   │
│           │                                               │                 │
│           │                                               ▼                 │
│           │                                        ┌─────────────────┐      │
│           │                                        │  renderUji()    │      │
│           │                                        │  UjiAnimator    │      │
│           │                                        │   (Canvas API)   │      │
│           │                                        └─────────────────┘      │
│           │                                               │                 │
│           └───────────────────────────────────────────────┘                 │
│                          (Live preview updates)                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Files

| File | Purpose |
|------|---------|
| `src/lib/ujiRenderer.ts` | Core rendering engine — static & animated modes |
| `src/lib/ujiPresets.ts` | 39 original Tifinagh symbol presets |
| `src/components/UjiControls.tsx` | React UI for parameter manipulation |
| `src/stores/assetStore.ts` | Asset state management (Zustand) |
| `src/lib/assetTextureManager.ts` | Texture loading/caching lifecycle |

---

## Core Types

### UjiParams (Complete Parameter Interface)

```typescript
interface UjiParams {
  // ─── Geometry ─────────────────────────────────────────
  shape: 1 | 2 | 3 | 4           // circle | square | triangle | line
  segments: number                // Line segments (10–20,000)
  radius: number                  // Base radius in pixels
  iterations: number              // Iteration count (10–2,000)

  // ─── Rotation ─────────────────────────────────────────
  rotationSpeed: number           // Degrees per iteration (-10 to 10)
  rotationSpeedup: number         // Acceleration factor
  rotationPeriod: number         // Oscillation period (-1 = off)
  rotationUntil?: number         // Freeze after N iterations
  rotationOriginH?: number       // Pivot X (0–1, default 0.5)
  rotationOriginV?: number       // Pivot Y (0–1, default 0.5)
  initialRotation?: number       // Starting angle (0–359°)

  // ─── Motion ───────────────────────────────────────────
  expansionH: number             // Horizontal expansion (0.95–1.05)
  expansionV: number             // Vertical expansion (0.95–1.05)
  expansionHExp?: number         // Exponential H factor
  expansionVExp?: number         // Exponential V factor
  translationH: number           // Horizontal shift
  translationV: number           // Vertical shift

  // ─── Texture ──────────────────────────────────────────
  jitter: number                 // Position randomness (0–20)
  wavinessPH: number            // Horizontal wave period (-1 = off)
  wavinessAH: number            // Horizontal wave amplitude
  wavinessPV: number            // Vertical wave period (-1 = off)
  wavinessAV: number            // Vertical wave amplitude

  // ─── Visibility ───────────────────────────────────────
  skipChance: number            // Segment skip probability (0–1)
  segmentRotation: number       // Per-segment rotation (0–179°)
  segmentLengthening?: number  // Length multiplier % (10–500)
  lineSwappiness?: number      // Segment shuffle degree (0–100)
  revealSpeed?: number        // Progressive reveal (-1 = instant)

  // ─── Fade Effects ─────────────────────────────────────
  fadeInSpeed?: number        // Progressive appearance
  fadeOutSpeed?: number       // Progressive disappearance
  fadeOutStart?: number       // When fade begins
  sawtoothFadeOutSize?: number    // Sawtooth wave size
  sawtoothFadeOutStart?: number   // Sawtooth start iteration

  // ─── Appearance ───────────────────────────────────────
  thickness: number           // Line thickness (0.1–10)
  lineR, lineG, lineB: number   // Line color (0–255)
  lineOpacity: number         // Alpha (0.01–1)
  hueshiftSpeed: number       // Color cycling speed
  bgR, bgG, bgB: number       // Background color
  bgOpacity?: number          // Background alpha
  blendMode?: UjiBlendMode    // Canvas composite operation
  shadowBlur?: number         // Glow radius
  lineCap?: 'auto' | 'butt' | 'round' | 'square'
  canvasNoise?: number        // Noise intensity (0–1)

  // ─── Animation ────────────────────────────────────────
  animate: boolean            // Enable frame-by-frame mode
  itersPerFrame: number       // Iterations per frame (1–10)
  loopMode: 'infinite' | 'pingpong' | 'once' | 'cycle'
  loopDuration?: number       // Frames before loop
  clearOnLoop?: boolean       // Clear canvas on reset

  // ─── Audio Modulation ────────────────────────────────
  audioMod: UjiAudioMod       // Audio reactivity params
}
```

### UjiAudioMod (Audio Reactivity)

```typescript
interface UjiAudioMod {
  rotByLow: number        // Rotation boost per bass unit
  rotByBeat: number       // Rotation boost on beat
  jitterByHigh: number    // Jitter from treble
  jitterByBeat: number    // Jitter on beat
  expansionByLow: number  // Expansion from bass
  hueshiftByMid: number   // Hue shift from mids
  clearOnBeat: boolean    // Flash clear on beat
}
```

---

## Rendering Engine

### Static Mode (`renderUji`)

One-shot synchronous rendering — used for:
- Initial texture generation
- Non-animated assets
- Preview generation (with `quality: 'preview'`)

```typescript
export function renderUji(
  canvas: HTMLCanvasElement,
  params: UjiParams,
  seed?: number,                    // Optional RNG seed
  quality: 'preview' | 'full' = 'full'
): void
```

**Algorithm:**
1. Initialize Float32Arrays for segment positions (`px`, `py`)
2. `initShape()` — populate arrays based on shape type
3. For each iteration:
   - Apply jitter, waviness, expansion, translation
   - Rotate around custom pivot
   - `drawIteration()` — render segments with per-point transforms
4. Apply canvas noise (if enabled)

### Animated Mode (`UjiAnimator`)

Stateful incremental renderer for real-time animation:

```typescript
class UjiAnimator {
  constructor(canvas: HTMLCanvasElement, params: UjiParams)
  
  step(low = 0, mid = 0, high = 0, beat = 0): void
  softFade(alpha = 0.08): void
  reset(): void
}
```

**Loop Modes:**
- `cycle` — Reset to start after `loopDuration` or `iterations`
- `once` — Freeze on final frame
- `infinite` — Continue indefinitely (no reset)
- `pingpong` — Cycle back and forth (TODO: full implementation)

**Audio Integration:**
```typescript
animator.step(
  audioAnalysis.low,   // bass intensity (0–1)
  audioAnalysis.mid,   // mid frequency (0–1)
  audioAnalysis.high,  // treble intensity (0–1)
  audioAnalysis.beat   // beat pulse (0–1)
)
```

---

## Rendering Pipeline Details

### Shape Generation (`initShape`)

| Shape | ID | Description |
|-------|----|-------------|
| Circle | 1 | Radial point distribution |
| Square | 2 | Perimeter interpolation |
| Triangle | 3 | Equilateral vertices |
| Line | 4 | Horizontal segment array |

All shapes support `initialRotation` — applied once at generation.

### Per-Iteration Transform Pipeline

```
Raw Position (px[i], py[i])
        ↓
[Jitter] — Random offset ±jitter/2
        ↓
[Waviness] — Sine wave modulation
        ↓
[Expansion] — Scale from canvas center
        ↓
[Translation] — Global offset
        ↓
[Rotation] — Rotate around pivot (ox, oy)
        ↓
Final Position
```

### Drawing Phases (`drawIteration`)

1. **HSL Color Shift** — Apply hue rotation to base RGB
2. **Context Setup** — strokeStyle, lineWidth, shadow, blendMode
3. **Line Swappiness** — Shuffle segment order (iter === 0 only)
4. **Path Construction** — MoveTo/LineTo with visibility checks:
   - Skip random segments (skipChance)
   - Fade in/out based on iteration
   - Sawtooth visibility masking
   - Segment lengthening (scale from midpoint)
5. **Stroke** — Single path stroke for performance

---

## Animation System Lifecycle

```
Asset Created
     ↓
[UjiAnimator instantiated]
     ↓
animator.init() ──▶ Clear canvas, init shape arrays
     ↓
Render Loop:
    ┌─────────────────────────────────────┐
    │ 1. Get audio analysis (FFT data)   │
    │ 2. animator.step(low, mid, high,   │
    │                  beat)             │
    │ 3. Apply loopMode logic            │
    └─────────────────────────────────────┘
     ↓
[Params Changed] ──▶ animator.init() (hard reset)
     ↓
[Asset Removed] ──▶ Dispose animator instance
```

---

## UI Architecture (UjiControls)

### Component Structure

```typescript
function UjiControls({ asset, disabled }: UjiControlsProps) {
  // Local state for immediate feedback
  const [localParams, setLocalParams] = useState<UjiParams>(...)
  const [activeTab, setActiveTab] = useState<...>(...)
  const updateTimeoutRef = useRef<...>(null)
}
```

### Tab Organization

| Tab | Parameters |
|-----|-----------|
| **Geometry** | shape, segments, iterations, radius, skipChance, revealSpeed |
| **Rotation** | rotationSpeed, speedup, period, until, initialRotation, segmentRotation, origin |
| **Motion** | expansionH/V, exp factors, translation, waviness, jitter |
| **Appearance** | thickness, opacity, hue speed, colors, blendMode, shadow, line options |
| **Animation** | animate toggle, itersPerFrame, loopMode, audio modulation |

### Debounced Updates

```typescript
// Immediate local update
setLocalParams(newParams)

// Debounced (50ms) → Store + Texture reload
setTimeout(() => {
  updateAsset(asset.id, { ujiParams: newParams })
  assetTextureManager.reload({ ...asset, ujiParams: newParams })
}, 50)
```

This prevents texture thrashing during rapid slider movements.

---

## Preset System

### Built-in Presets (`UJI_PRESETS`)

| Preset | Features |
|--------|----------|
| Galaxy | Default balanced parameters |
| Helix | Wavy line shape, period rotation |
| Vortex | High segment count, speedup, skip |
| Geometric | Square shape, no jitter, solid lines |
| Storm | Fast rotation, high jitter, skip |
| Triangle | Triangle shape, waviness |
| Neon Bloom | Screen blend, shadow blur, round caps |
| Off-Center | Custom rotation origin showcase |
| Spiral Reveal | Progressive reveal speed demo |
| Beat Pulse | Audio-reactive: beat rotation + clear |
| Bass Bloom | Audio-reactive: bass expansion |
| Freq Web | Audio-reactive: treble jitter |
| Glow Storm | Audio-reactive: screen blend + glow |

### Original Presets (`UJI_PRESETS_FROM_ORIGINAL`)

39 presets named after Tifinagh script characters (ⵉ, ⵣ, ⵒ, etc.)
- Exact port from original Uji project
- All include audio modulation parameters
- Some use exotic features: `sawtoothFadeOut`, `lineSwappiness`, extreme values

---

## Integration with Asset System

### Asset Store Interface

```typescript
// Creating a Uji asset
useAssetStore.getState().addAsset({
  id: generateId(),
  type: 'uji',
  name: 'Uji Pattern',
  ujiParams: DEFAULT_UJI_PARAMS,
  // ... other fields
})

// Updating parameters
updateAsset(assetId, { ujiParams: newParams })
```

### Texture Manager Integration

```typescript
// assetTextureManager.ts
async loadUji(asset: Asset): Promise<Texture> {
  if (asset.ujiParams?.animate) {
    // Animated: Create animator, store ref, return initial frame
    const animator = new UjiAnimator(canvas, asset.ujiParams)
    this.animatedUji.set(asset.id, animator)
    return createTextureFromCanvas(canvas)
  } else {
    // Static: renderUji() once
    renderUji(canvas, asset.ujiParams)
    return createTextureFromCanvas(canvas)
  }
}

// Per-frame animation tick
updateAnimatedUji(assetId: string, audioData: AudioData) {
  const animator = this.animatedUji.get(assetId)
  if (animator) {
    animator.step(audioData.low, audioData.mid, audioData.high, audioData.beat)
    updateTextureFromCanvas(texture, animator.canvas)
  }
}
```

---

## Performance Considerations

### Rendering Optimizations

1. **Float32Array** for position data — cache-friendly, fast math
2. **Single path stroke** per iteration — minimize draw calls
3. **Preview mode** — renders at ~50% detail during parameter changes
4. **Debounced updates** — wait 50ms after last change before texture regen
5. **ClampToEdgeWrapping** — prevents seam artifacts when UV > 1

### Limits

| Parameter | Min | Max | Performance Impact |
|-----------|-----|-----|-------------------|
| segments | 10 | 20,000 | O(n) per iteration |
| iterations | 10 | 2,000 | O(n) total |
| itersPerFrame | 1 | 10 | Frame time multiplier |

**Recommended max for 60fps:** 800 segments × 300 iterations

---

## Audio Reactivity Implementation

### Audio Analysis Pipeline

```
[Web Audio API]
      ↓
[AnalyserNode] ──▶ FFT data (Uint8Array)
      ↓
[audioAnalysis.ts]
  - getByteFrequencyData()
  - Bin to low/mid/high bands
  - Beat detection (threshold + hysteresis)
      ↓
[UjiAnimator.step(low, mid, high, beat)]
```

### Audio Modulation Formula

```typescript
// Per-frame modulation
effectiveRotationSpeed = params.rotationSpeed 
  + audioMod.rotByLow * low 
  + audioMod.rotByBeat * beat

effectiveJitter = params.jitter 
  + audioMod.jitterByHigh * high 
  + audioMod.jitterByBeat * beat

effectiveExpansion = params.expansionH 
  + audioMod.expansionByLow * low

effectiveHueShift = params.hueshiftSpeed 
  + audioMod.hueshiftByMid * mid

// Beat-triggered effects
if (audioMod.clearOnBeat && beat > 0.85 && prevBeat <= 0.85) {
  ctx.fillRect(/* partial clear */)
}
```

---

## Common Patterns

### Creating a Custom Preset

```typescript
const myPreset: UjiParams = {
  ...DEFAULT_UJI_PARAMS,
  shape: 2,
  segments: 1000,
  rotationSpeed: 1.5,
  blendMode: 'screen',
  shadowBlur: 4,
  animate: true,
  itersPerFrame: 3,
  audioMod: {
    rotByLow: 2.0,
    rotByBeat: 3.0,
    jitterByHigh: 0,
    jitterByBeat: 0,
    expansionByLow: 0.002,
    hueshiftByMid: 4.0,
    clearOnBeat: false
  }
}

// Register in UJI_PRESETS or use locally
```

### Programmatic Parameter Animation

```typescript
// Smooth parameter transitions
function animateParam(
  assetId: string,
  param: keyof UjiParams,
  target: number,
  duration: number
) {
  const start = getCurrentValue(param)
  const startTime = performance.now()
  
  function tick() {
    const elapsed = performance.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = easeInOutCubic(progress)
    
    const value = start + (target - start) * eased
    updateAsset(assetId, { ujiParams: { [param]: value } })
    
    if (progress < 1) requestAnimationFrame(tick)
  }
  
  tick()
}
```

### Extracting Uji as Texture Source

```typescript
// Use Uji output as input to other visual systems
const canvas = document.createElement('canvas')
canvas.width = 1024
canvas.height = 1024

renderUji(canvas, params, undefined, 'full')
const texture = new THREE.CanvasTexture(canvas)
// Apply to meshes, particles, post-processing...
```

---

## Debugging & Development

### Debug Rendering

```typescript
// Log parameter changes in UjiControls
useEffect(() => {
  console.log('Uji params updated:', localParams)
}, [localParams])
```

### Performance Profiling

```typescript
// Wrap renderUji for timing
const start = performance.now()
renderUji(canvas, params)
console.log(`Render: ${performance.now() - start}ms`)
```

### Visual Debugging

Enable in `DEFAULT_UJI_PARAMS`:
- `canvasNoise: 0.1` — Add film grain
- `shadowBlur: 10` — Exaggerate glow
- `iterations: 50` — Fast preview renders

---

## API Reference Summary

| Function/Class | Location | Purpose |
|----------------|----------|---------|
| `renderUji()` | `ujiRenderer.ts` | One-shot static render |
| `UjiAnimator` | `ujiRenderer.ts` | Stateful animation |
| `hueShiftRgb()` | `ujiRenderer.ts` | Color manipulation |
| `DEFAULT_UJI_PARAMS` | `ujiRenderer.ts` | Parameter defaults |
| `UJI_PRESETS` | `ujiRenderer.ts` | Built-in presets |
| `UJI_PRESETS_FROM_ORIGINAL` | `ujiPresets.ts` | Tifinagh presets |
| `UjiControls` | `UjiControls.tsx` | React UI component |

---

## Roadmap / TODO

- [ ] Full pingpong implementation with direction tracking
- [ ] WebGL renderer for >10k segments at 60fps
- [ ] Export to video/GIF from animator
- [ ] MIDI CC mapping for live control
- [ ] Parameter morphing between presets
- [ ] Multi-layer Uji compositing
