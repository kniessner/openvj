# OpenVJ Improvements Roadmap

> **Making the Perfect Tool for Visual Artists and Live Sessions**

## Executive Summary

This document outlines a comprehensive roadmap for evolving OpenVJ into the ultimate creative tool for visual artists, VJs, and live performers. Based on current architecture analysis and research into creative coding platforms (particularly p5.js), this roadmap focuses on four key pillars:

1. **Creative Coding Integration** — p5.js support, live coding, generative art
2. **Performance & Scalability** — WebGPU, FBO caching, multi-GPU support
3. **Hardware & External Control** — OSC, DMX, NDI, Syphon/Spout
4. **Artist Experience** — Better UI/UX, preset library, learning resources

---

## Current State (v0.1.0 Beta)

### ✅ What's Working

| Feature | Status | Notes |
|---------|--------|-------|
| Projection Mapping | ✅ Complete | Quad warping, UV transformation |
| Video Playback | ✅ Complete | MP4/WebM, timeline, transport |
| Audio Reactivity | ✅ Complete | 3-band FFT, beat detection, BPM |
| MIDI Control | ✅ Complete | CC mapping, learn mode |
| Shader System | ✅ Complete | GLSL editing, uniforms, presets |
| Multi-Layers | ✅ Complete | 8 layers, groups, masks |
| Global FX | ✅ Complete | Post-process chain |
| Multi-Output | ✅ Complete | Pop-up window, broadcast channel |

### 🔧 Architecture Highlights

```
┌─────────────────────────────────────────────────────────────────┐
│                         OPENVJ v0.1.0                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   React UI   │  │  Zustand     │  │   Three.js   │          │
│  │  Components  │  │   Stores     │  │   Renderer   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                 │
│                            ▼                                     │
│              ┌─────────────────────────┐                        │
│              │    VideoTexture /       │                        │
│              │    ShaderMaterial       │                        │
│              └───────────┬─────────────┘                        │
│                          ▼                                       │
│              ┌─────────────────────────┐                        │
│              │    Projection Mesh      │                        │
│              │    (UV Warped Quad)     │                        │
│              └───────────┬─────────────┘                        │
│                          ▼                                       │
│              ┌─────────────────────────┐                        │
│              │    EffectComposer       │                        │
│              │    (Global Post-FX)     │                        │
│              └───────────┬─────────────┘                        │
│                          ▼                                       │
│                   [Output Canvas]                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Creative Coding Foundation (Weeks 1-4)

### 🎯 Goal: Integrate p5.js as first-class citizen

| Week | Deliverable | Complexity |
|------|-------------|------------|
| 1 | Core p5.js engine integration | Medium |
| 2 | Live code editor component | Medium |
| 3 | Template library + preset system | Low |
| 4 | Performance optimization + polish | Medium |

#### 1.1 p5.js Engine Integration ✅ PROTOTYPE CREATED

**Files Created:**
- `/src/lib/p5jsEngine.ts` — Core engine (105 lines)
- `/src/stores/p5jsStore.ts` — Zustand store (139 lines)
- `/src/components/P5JsEditor.tsx` — Editor UI (90 lines)

**Key Features:**
- Instance mode p5.js rendering to offscreen canvas
- Automatic texture creation for Three.js
- Audio bridge: `openvj.audio.getLow()`, `getMid()`, `getHigh()`, `getBeat()`, `getBpm()`
- MIDI bridge: `openvj.midi.getCC(n)`
- 5 starter templates (waveform, particles, kaleidoscope, neon grid, liquid flow)

**Usage Example:**

```javascript
// Artist writes this in OpenVJ editor:
function setup() {
  createCanvas(1920, 1080, WEBGL);
}

function draw() {
  background(0);
  rotateX(frameCount * 0.01);
  
  const bass = openvj.audio.getLow() / 255;
  fill(255, 100, 150);
  sphere(100 + bass * 200);
}
```

#### 1.2 Live Code Editor

**Features:**
- Monaco Editor or CodeMirror integration
- Syntax highlighting (JavaScript + p5.js keywords)
- Auto-completion for p5.js functions
- Real-time error reporting
- Format button (Prettier integration)
- Import/Export (.JSON sketch files)

#### 1.3 Template Gallery

**Starter Templates:**

| Template | Description | Audio Features |
|----------|-------------|----------------|
| **Waveform** | Oscilloscope-style visualization | Bass drives amplitude |
| **Particles** | 3D particle field | Particles react to frequencies |
| **Kaleidoscope** | Symmetric geometric patterns | Rotation speed linked to beat |
| **Neon Grid** | Retro-futuristic landscape | Terrain height from audio |
| **Liquid Flow** | Fluid particle simulation | Velocity modulated by bass |
| **Fractal Tree** | Recursive branching structure | Branch angles from mid-range |
| **Text Kinetic** | Animated typography | Scale/position reactive |
| **MIDI Blocks** | Color grid controlled by knobs | Direct CC value mapping |

---

## Phase 2: Performance & Modern Rendering (Weeks 5-8)

### 🎯 Goal: Support massive scenes and modern GPUs

#### 2.1 WebGPU Backend

**Why WebGPU?**
- 2-3x better performance than WebGL for compute shaders
- Native support for compute passes (GPU particle systems)
- Better memory management
- Future-proof (WebGL 2 will be deprecated eventually)

**Implementation:**

```typescript
// Three.js WebGPU Renderer
import { WebGPURenderer } from 'three/renderers/webgpu/WebGPURenderer';

const renderer = new WebGPURenderer({
  antialias: true,
  powerPreference: 'high-performance'
});
```

**Migration Path:**
1. Detect WebGPU support (graceful fallback to WebGL2)
2. Update shader materials to WGSL (or use Three.js auto-conversion)
3. Implement compute shaders for particle systems
4. Benchmark and optimize

#### 2.2 FBO Caching System

**Problem:** Every frame re-renders all layers, even static ones.

**Solution:** Framebuffer Object caching with dirty-checking.

```typescript
interface FBOLayer {
  texture: THREE.WebGLRenderTarget;
  lastHash: string;      // Content hash for change detection
  needsUpdate: boolean;  // Dirty flag
  staticDuration: number; // Frames without change before "freeze"
}

class FBOCache {
  render(layer: Layer): THREE.Texture {
    const currentHash = this.computeHash(layer);
    const fbo = this.getFBO(layer.id);
    
    if (fbo.lastHash !== currentHash) {
      // Re-render to FBO
      this.renderer.setRenderTarget(fbo.texture);
      this.renderLayer(layer);
      fbo.lastHash = currentHash;
    }
    
    return fbo.texture.texture;
  }
}
```

**Performance Gains:**
- Static layers: 90% GPU time reduction
- Video layers: No benefit (always changing)
- p5.js layers: 50-70% reduction if mostly static

#### 2.3 Texture Pooling

**Problem:** Constant allocation/deallocation of GPU textures causes stutter.

**Solution:** Pre-allocate texture pool, reuse on demand.

```typescript
class TexturePool {
  private pool: Map<string, THREE.WebGLRenderTarget[]> = new Map();

  acquire(width: number, height: number): THREE.WebGLRenderTarget {
    const key = `${width}x${height}`;
    const available = this.pool.get(key) || [];
    
    if (available.length > 0) {
      return available.pop()!;
    }
    
    // Create new
    return new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType
    });
  }

  release(texture: THREE.WebGLRenderTarget): void {
    const key = `${texture.width}x${texture.height}`;
    const list = this.pool.get(key) || [];
    list.push(texture);
    this.pool.set(key, list);
  }
}
```

---

## Phase 3: Hardware Integration (Weeks 9-12)

### 🎯 Goal: Professional venue connectivity

#### 3.1 OSC (Open Sound Control)

**Use Cases:**
- TouchOSC tablet control
- Resolume Avenue sync
- QLab theater control
- Custom hardware controllers

**Implementation:**

```typescript
// src/lib/oscEngine.ts
import { Client, Server } from 'node-osc';

export class OSCEngine {
  private server: Server;
  private clients: Map<string, Client> = new Map();

  constructor() {
    // Listen for incoming OSC
    this.server = new Server(3333, '0.0.0.0');
    this.server.on('message', ([address, ...args]) => {
      this.handleMessage(address, args);
    });
  }

  private handleMessage(address: string, args: any[]): void {
    // Map OSC to OpenVJ actions
    switch (address) {
      case '/openvj/scene/load':
        useSceneStore.getState().loadScene(args[0] as string);
        break;
      case '/openvj/layer/opacity':
        useSurfaceStore.getState().setLayerOpacity(args[0], args[1]);
        break;
      case '/openvj/audio/smoothing':
        useAudioStore.getState().setSmoothing(args[0]);
        break;
    }
  }

  // Send state updates to external controllers
  send(address: string, ...args: any[]): void {
    this.clients.forEach(client => {
      client.send(address, ...args);
    });
  }
}
```

**TouchOSC Layout:**

```
┌─────────────────────────┐
│  ○ ○ ○ ○  (Scene Select) │
├─────────────────────────┤
│  ◀────▶   Layer Opacity  │
├─────────────────────────┤
│  ◀────▶   FX Amount      │
├─────────────────────────┤
│  [BEAT]   Tap Tempo      │
└─────────────────────────┘
```

#### 3.2 DMX Lighting Control

**Use Cases:**
- Sync lights with audio beat
- Projector shutter control
- LED strip mapping
- Fog machine triggers

**Implementation via USB DMX Interface:**

```typescript
// src/lib/dmxEngine.ts
export class DMXEngine {
  private device: SerialPort | null = null;
  private universe: Uint8Array = new Uint8Array(512);

  async connect(port: string): Promise<void> {
    this.device = new SerialPort({ path: port, baudRate: 250000 });
  }

  setChannel(channel: number, value: number): void {
    this.universe[channel] = Math.min(255, Math.max(0, value));
  }

  // Audio-reactive DMX
  updateFromAudio(low: number, mid: number, high: number, beat: boolean): void {
    // Channel 1: Overall brightness linked to bass
    this.setChannel(1, low * 255);
    
    // Channel 2: Strobe on beat
    this.setChannel(2, beat ? 255 : 0);
    
    // Channel 3: Color temperature from mid
    this.setChannel(3, mid * 255);
  }

  send(): void {
    // DMX512 packet format
    const packet = Buffer.concat([
      Buffer.from([0x00]), // Start code
      Buffer.from(this.universe)
    ]);
    this.device?.write(packet);
  }
}
```

#### 3.3 NDI / Syphon / Spout

**For professional video pipelines:**

| Protocol | Platform | Status |
|----------|----------|--------|
| **NDI** | Cross-platform | Research needed (WASM or native bridge) |
| **Syphon** | macOS | Possible via native plugin |
| **Spout** | Windows | Possible via native plugin |

**Interim Solution:**
- OBS Virtual Camera input/output
- FFmpeg WebRTC streaming
- SRT (Secure Reliable Transport) for low-latency

---

## Phase 4: Artist Experience Revolution (Weeks 13-16)

### 🎯 Goal: Most intuitive VJ software ever made

#### 4.1 Visual Browser

**Current:** List view with thumbnails
**Proposed:** Mosaic browser with smart categories

```
┌──────────────────────────────────────────────────────────────┐
│  🔍 Search...    [All] [Video] [Shaders] [p5.js] [Scenes]    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│  │▶       │ │▶       │ │▶       │ │▶       │ │▶       │    │
│  │   01   │ │   02   │ │   03   │ │   04   │ │   05   │    │
│  │Video   │ │Shader  │ │p5.js   │ │Image   │ │Scene   │    │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    │
│                                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│  │▶       │ │▶       │ │▶       │ │▶       │ │  +     │    │
│  │   06   │ │   07   │ │   08   │ │   09   │ │ Import │    │
│  │        │ │        │ │        │ │        │ │        │    │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Smart Tags:**
- Auto-tagging: "bass-heavy", "minimal", "fast", "slow", "colorful"
- BPM detection for video content
- Color palette extraction
- Audio preview generation

#### 4.2 Timeline & Cues

**Non-linear timeline for structured performances:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 00:00      01:00      02:00      03:00      04:00      05:00    │
│   │          │          │          │          │          │      │
│ ──┼──────────┼──────────┼──────────┼──────────┼──────────┼──    │
│   │          │          │          │          │          │      │
│   ▼          ▼          ▼          ▼          ▼          ▼      │
│  [Intro]   [Build]   [Drop]    [Break]   [Build2]  [Outro]     │
│  Scene 1   Scene 3   Scene 5   Scene 2   Scene 5   Scene 1      │
│                                                              │
│  Cues:                                                       │
│  • 01:30 - Flash white on beat                               │
│  • 02:45 - Transition to Scene 7                             │
│  • 04:00 - DMX strobe trigger                                │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.3 Collaborative Cloud Features

**For teams and education:**

- Scene sharing via cloud
- Real-time collaboration (multi-user editing)
- Version control (Git-based project history)
- Community preset marketplace

---

## Feature Comparison Matrix

| Feature | OpenVJ Now | OpenVJ + This Roadmap | TouchDesigner | Resolume Arena |
|---------|-----------|----------------------|---------------|----------------|
| **Creative Coding** | Basic shaders | ✅ Full p5.js | Python | FFI plugins |
| **Learning Curve** | Medium | ✅ Easy | Steep | Medium |
| **Open Source** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Web-based** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **MIDI** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **OSC** | ❌ No | ✅ Planned | ✅ Yes | ✅ Yes |
| **DMX** | ❌ No | ✅ Planned | ✅ Yes | Via plugin |
| **NDI** | ❌ No | ✅ Research | ✅ Yes | ✅ Yes |
| **Price** | ✅ Free | ✅ Free | $$$ Commercial | $$$ Commercial |
| **p5.js Integration** | ❌ No | ✅ Native | ❌ No | ❌ No |

**OpenVJ's Unique Advantage:** The only open-source VJ tool with native creative coding support through the widely-used p5.js library.

---

## Implementation Priority

### Immediate (Next 2 Weeks)
1. ✅ p5.js engine integration (already prototyped)
2. ✅ p5.js store and editor components (already prototyped)
3. Integrate p5.js editor into main UI
4. Add 5 starter templates
5. Test audio/MIDI bridging

### Short-term (1-2 Months)
1. WebGPU renderer (Three.js upgrade)
2. FBO caching system
3. OSC integration
4. Performance profiling + optimization

### Medium-term (2-4 Months)
1. DMX lighting control
2. NDI research and implementation
3. Visual browser redesign
4. Timeline and cues

### Long-term (4-6 Months)
1. Electron desktop wrapper
2. Cloud collaboration features
3. Native mobile control app
4. Professional documentation

---

## Conclusion

OpenVJ is uniquely positioned to become the **Processing/p5.js of VJ software** — combining:

- **Accessibility** of creative coding platforms
- **Professional features** of commercial VJ tools
- **Openness** of the open-source community
- **Web-native** architecture for easy deployment

The p5.js integration is the cornerstone that differentiates OpenVJ from every other tool in the market. Artists already familiar with creative coding can immediately use their skills for professional VJ performances.

**Next Steps:**
1. Review and approve p5.js integration prototype
2. Integrate editor component into main App.tsx
3. Test with real artists for feedback
4. Iterate on performance with WebGPU

---

*Document Version: 1.0*
*Created: April 2026*
*OpenVJ Project*
