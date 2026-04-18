# OpenVJ Architecture

## Overview

OpenVJ uses a component-based architecture with Three.js at its core for rendering, React for UI, and Zustand for state management.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          UI Layer                            │
│         (React + Tailwind CSS + Custom Components)            │
├─────────────────────────────────────────────────────────────┤
│                       State Layer                             │
│            (Zustand Stores - Modular Design)                │
├─────────────────────────────────────────────────────────────┤
│                     Application Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Video   │  │  Audio   │  │  MIDI    │  │ Mapping  │  │
│  │  Engine  │  │  Engine  │  │  OSC     │  │  Engine  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
├─────────────────────────────────────────────────────────────┤
│                     Rendering Layer                           │
│              (Three.js + React Three Fiber)                 │
│                   ┌──────────────────┐                     │
│                   │   Render Graph     │                     │
│                   │  (FBOs, Passes)   │                     │
│                   └──────────────────┘                     │
├─────────────────────────────────────────────────────────────┤
│                     WebGL/WebGPU Layer                        │
│              (WebGL 2.0 / WebGPU Backend)                   │
├─────────────────────────────────────────────────────────────┤
│                     Browser APIs                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│  │ Canvas  │ │ WebGL   │ │ WebAudio│ │ WebMIDI │ │  OSC    ││
│  │ API     │ │ Context │ │ API     │ │ API     │ │  WS     ││
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. UI Layer

**Layout Components:**
- `App` - Root component, layout container
- `Panel` - Resizable panels (media, preview, controls)
- `Toolbar` - Quick actions, playback controls
- `Timeline` - Scrubber, markers, zoom

**Interactive Components:**
- `SurfaceEditor` - Visual manipulation of mapping surfaces
- `EffectChain` - Drag-drop effect ordering
- `LayerList` - Layer management
- `MediaBrowser` - File management with drag-drop

**State Flow:**
```
User Interaction → Zustand Store → Component Re-render
```

### 2. State Layer (Zustand Stores)

**Modular Store Design:**

#### `useSceneStore`
Stores the complete scene configuration
```typescript
interface SceneState {
  surfaces: Surface[];
  layers: Layer[];
  effects: Effect[];
  outputConfig: OutputConfig;
}
```

#### `useVideoStore`
Manages video playback state
```typescript
interface VideoState {
  sources: VideoSource[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
}
```

#### `useMappingStore`
Handles projection mapping state
```typescript
interface MappingState {
  activeSurface: string | null;
  isDragging: boolean;
  editingMode: 'warp' | 'mask' | 'position';
}
```

#### `useAudioStore`
Audio analysis and reactivity
```typescript
interface AudioState {
  analyserNode: AnalyserNode | null;
  frequencyData: Uint8Array;
  beat: boolean;
}
```

#### `useHardwareStore`
MIDI/OSC input states
```typescript
interface HardwareState {
  midiMappings: MidiMapping[];
  oscEnabled: boolean;
}
```

### 3. Application Layer

#### Video Engine
```typescript
class VideoEngine {
  private videoElement: HTMLVideoElement;
  private texture: THREE.VideoTexture;
  
  load(url: string): Promise<void>;
  play(): void;
  pause(): void;
  seek(time: number): void;
  getTexture(): THREE.VideoTexture;
}
```

#### Audio Engine
```typescript
class AudioEngine {
  private ctx: AudioContext;
  private analyser: AnalyserNode;
  
  init(): Promise<void>;
  getFrequencyData(): Uint8Array;
  getVolume(): number;
  detectBeat(): boolean;
}
```

#### Mapping Engine
```typescript
class MappingEngine {
  private surfaces: Map<string, Surface>;
  
  createSurface(type: 'quad' | 'mesh' | 'bezier'): Surface;
  updateUVs(surfaceId: string, corners: Point[]): void;
  renderToSurface(surfaceId: string, texture: THREE.Texture): void;
}
```

#### Effects Engine
```typescript
class EffectsEngine {
  private passes: EffectPass[];
  private composer: EffectComposer;
  
  addPass(effect: Effect, order: number): void;
  removePass(effectId: string): void;
  render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera): void;
}
```

### 4. Rendering Layer (Three.js)

#### Scene Graph
```
Scene
├── OutputCamera (renders to main display)
├── Surface_[0]
│   ├── Mesh (PlaneGeometry with custom UVs)
│   └── Material (ShaderMaterial with uniforms)
├── Surface_[1]
│   ├── Mesh
│   └── Material
└── ...
```

#### Render Pipeline
```
┌─────────────────────────────────────────────────┐
│ Frame Start                                     │
├─────────────────────────────────────────────────┤
│ 1. Render Layer 0 to FBO                        │
│    → Apply effects chain                        │
├─────────────────────────────────────────────────┤
│ 2. Render Layer 1 to FBO                        │
│    → Apply effects chain                        │
├─────────────────────────────────────────────────┤
│ 3. Composite Layers                              │
│    → Blend with blend modes                      │
├─────────────────────────────────────────────────┤
│ 4. Map to Surfaces                               │
│    → Project texture onto surface geometry       │
│    → Apply mask if enabled                       │
├─────────────────────────────────────────────────┤
│ 5. Render to Output                              │
│    → Each surface to its output                │
└─────────────────────────────────────────────────┘
```

#### Key Classes

**ProjectedMaterial**
```glsl
// Vertex Shader
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment Shader
uniform sampler2D projectedTexture;
uniform sampler2D maskTexture;
uniform mat4 projectionMatrix;

varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  // Project world position to texture UVs
  vec4 projected = projectionMatrix * vec4(vWorldPosition, 1.0);
  vec2 projectedUv = projected.xy / projected.w;
  projectedUv = projectedUv * 0.5 + 0.5;
  
  vec4 color = texture2D(projectedTexture, projectedUv);
  float mask = texture2D(maskTexture, vUv).r;
  
  gl_FragColor = color * mask;
}
```

### 5. Hardware Integration

#### MIDI Controller
```typescript
class MidiController {
  private inputs: MIDIInput[];
  private mappings: Map<string, MidiMapping>;
  
  async init(): Promise<void>;
  learnMapping(control: string, callback: (value: number) => void): void;
  handleMidiMessage(message: MIDIMessageEvent): void;
}
```

#### OSC Server
```typescript
class OscServer {
  private port: number;
  private handlers: Map<string, OscHandler>;
  
  start(): void;
  on(address: string, handler: OscHandler): void;
  send(address: string, values: OscValue[]): void;
}
```

## Data Flow

### Video Example
```
User: Load Video → VideoEngine.load()
       ↓
Video Texture Created
       ↓
Applied to Layer 0
       ↓
Layer 0 → Effect Chain (if any)
       ↓
Composite with other layers
       ↓
Mapped to Surface UVs
       ↓
Rendered to Output Display
```

### Mapping Example
```
User: Drag Corner → useMappingStore.updateCorner()
       ↓
Surface Geometry Updated
       ↓
UV Coordinates Recalculated
       ↓
ProjectedMaterial Updated
       ↓
Render Output Updated
       ↓
Canvas Redrawn
```

### Audio Reactivity Example
```
AudioEngine.analyser → getFrequencyData()
       ↓
Process into store (RMS, FFT)
       ↓
AudioUniforms updated
       ↓
Shaders receive new values
       ↓
Visual output changed
       ↓
RequestAnimationFrame
       ↓
Repeat
```

## Performance Considerations

### Frame Budget (16.67ms @ 60fps)

| Task | Budget | Strategy |
|------|--------|----------|
| Three.js Render | ~8ms | Efficient scene graph |
| Effect Processing | ~4ms | FBO caching |
| Audio Analysis | ~1ms | Throttle to 30fps |
| JavaScript Logic | ~2ms | Minimize in RAF |
| Browser Overhead | ~1.67ms | — |

### Optimization Strategies

1. **FBO Caching**
   - Cache rendered layers
   - Invalidate only on change

2. **Texture Pooling**
   - Reuse texture objects
   - Pre-allocate common sizes

3. **LOD (Level of Detail)**
   - Reduce quality when zoomed out
   - Preview at 1/2 resolution

4. **OffscreenCanvas (Future)**
   - Move heavy compute to worker

## Project Structure

```
openvj/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Panel.tsx
│   │   │   ├── Timeline.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   └── Slider.tsx
│   │   ├── mapping/
│   │   │   ├── SurfaceEditor.tsx
│   │   │   ├── CornerHandle.tsx
│   │   │   └── MaskEditor.tsx
│   │   ├── effects/
│   │   │   ├── EffectChain.tsx
│   │   │   └── EffectCard.tsx
│   │   └── layers/
│   │       ├── LayerList.tsx
│   │       └── LayerControls.tsx
│   ├── engine/
│   │   ├── VideoEngine.ts
│   │   ├── AudioEngine.ts
│   │   ├── MappingEngine.ts
│   │   └── EffectsEngine.ts
│   ├── rendering/
│   │   ├── SceneManager.ts
│   │   ├── ProjectedMaterial.ts
│   │   ├── EffectComposer.ts
│   │   └── shaders/
│   │       ├── common.glsl
│   │       ├── distort.frag
│   │       ├── kaleidoscope.frag
│   │       └── blendModes.glsl
│   ├── stores/
│   │   ├── useSceneStore.ts
│   │   ├── useVideoStore.ts
│   │   ├── useMappingStore.ts
│   │   ├── useAudioStore.ts
│   │   └── useHardwareStore.ts
│   ├── hooks/
│   │   ├── useVideoTexture.ts
│   │   ├── useAudioAnalyser.ts
│   │   └── useMidiController.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── math.ts
│   │   └── file.ts
│   ├── App.tsx
│   └── main.tsx
├── docs/
├── examples/
├── tests/
└── package.json
```

## Reference Implementations

### three-projection-mapper
Key features to learn from:
- Mesh coordinate transformation
- Projective texture mapping
- Edge blend implementation

### three-projected-material
Key patterns:
- ShaderMaterial subclass
- Projection matrix calculation
- UV transform in vertex shader

## Next Steps for Implementation

1. **Set up base Three.js scene** with R3F
2. **Create first ProjectedMaterial**
3. **Build simple SurfaceEditor**
4. **Add video playback**
5. **Implement state stores**

See [TODO.md](../TODO.md) for implementation order.
