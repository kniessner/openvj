# OpenVJ + p5.js Integration Proposal

> **Creative Coding meets Professional VJ Performance**

## Executive Summary

This document proposes a comprehensive integration of **p5.js** into OpenVJ, transforming it from a projection mapping tool into a complete creative coding platform for live visual artists. The integration would allow artists to write p5.js sketches that render as real-time, audio-reactive layers within OpenVJ's projection mapping pipeline.

---

## What is p5.js?

**p5.js** is a JavaScript library that makes coding accessible for artists, designers, educators, and beginners. It's the successor to Processing (Java) and brings the creative coding paradigm to the web.

### Core Capabilities

| Feature | Description | VJ Relevance |
|---------|-------------|--------------|
| **Canvas 2D API** | High-level drawing primitives | Quick generative patterns, typography, 2D motion graphics |
| **WebGL Mode** | Full 3D rendering with WEBGL renderer | 3D particle systems, meshes, camera effects |
| **p5.sound** | Audio analysis, synthesis, effects | Real-time audio reactivity, beat detection |
| **Instance Mode** | Multiple independent sketches | Layer multiple p5.js sources simultaneously |
| **Shader Support** | GLSL fragment/vertex shaders | Custom GPU effects, transitions |

### Why Artists Love p5.js

```javascript
// Example: Simple audio-reactive circle
function setup() {
  createCanvas(800, 600, WEBGL);
  fft = new p5.FFT();
  mic = new p5.AudioIn();
  mic.start();
  fft.setInput(mic);
}

function draw() {
  background(0);
  let spectrum = fft.analyze();
  let bass = fft.getEnergy("bass");
  
  // Circle reacts to bass frequency
  let size = map(bass, 0, 255, 50, 400);
  fill(100, 200, 255);
  noStroke();
  sphere(size);
}
```

**Key Appeal:**
- **Immediate visual feedback** — change code, see result instantly
- **Minimal boilerplate** — focus on creativity, not setup
- **Massive learning ecosystem** — thousands of tutorials, examples, community sketches
- **Educational bridge** — lowers barrier for new visual artists

---

## Integration Strategies

### Option 1: p5.js as Texture Source (Recommended)

**Concept:** Each p5.js sketch renders to an off-screen canvas/framebuffer that OpenVJ's Three.js pipeline can use as a texture source.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   p5.js Sketch  │────▶│   HTMLCanvas     │────▶│  THREE.Texture  │
│   (Instance)    │     │   (offscreen)    │     │  (VideoTexture) │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                         │
                              ┌──────────────────────────┘
                              ▼
                    ┌─────────────────────┐
                    │   OpenVJ Surface    │
                    │   (Projection Map)  │
                    └─────────────────────┘
```

**Implementation Approach:**

```typescript
// src/lib/p5jsEngine.ts
import p5 from 'p5';

export class P5JsSource {
  private p5Instance: p5;
  private canvas: HTMLCanvasElement;
  private texture: THREE.CanvasTexture;
  
  constructor(
    private sketchCode: string,
    private width: number,
    private height: number
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Create p5 instance in instance mode
    this.p5Instance = new p5(this.createSketch(), this.canvas);
    
    // Create Three.js texture from canvas
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
  }
  
  private createSketch(): (p: p5) => void {
    // Wrap user code with OpenVJ-specific uniforms
    return (p: p5) => {
      // Inject OpenVJ uniforms into sketch scope
      p.setup = () => {
        p.createCanvas(this.width, this.height, p.WEBGL);
        // ... rest of setup
      };
      
      p.draw = () => {
        // Inject audio uniforms before draw
        const uniforms = this.getOpenVJUniforms();
        p._renderer.uAudioLow = uniforms.low;
        p._renderer.uAudioMid = uniforms.mid;
        p._renderer.uAudioHigh = uniforms.high;
        
        // User's draw code executes here
      };
    };
  }
  
  update(): void {
    // p5 runs its own animation loop
    // Update texture from canvas
    this.texture.needsUpdate = true;
  }
  
  getTexture(): THREE.Texture {
    return this.texture;
  }
}
```

**Pros:**
- ✅ Full p5.js compatibility (all features work)
- ✅ Easy to implement with existing OpenVJ architecture
- ✅ Multiple sketches can run simultaneously
- ✅ Sketches can be hot-swapped/reloaded

**Cons:**
- ⚠️ Double canvas overhead (p5 + Three.js)
- ⚠️ Synchronization between render loops

---

### Option 2: p5.js Shader Bridge

**Concept:** Use p5.js as a shader authoring environment, exporting GLSL code that runs directly in Three.js.

```typescript
// Extract GLSL from p5 shader
const p5Shader = p5Instance.createShader(vertex, fragment);
const fragmentCode = p5Shader._fragSrc;

// Use in OpenVJ's existing shader pipeline
surface.material.fragmentShader = fragmentCode;
```

**When to Use:**
- When you only need p5 for its easy shader syntax
- Performance-critical scenarios
- Advanced users who understand shaders

---

### Option 3: Native WebGL Context Sharing (Advanced)

**Concept:** Share the same WebGL context between p5.js and Three.js.

```typescript
// Pass Three.js renderer's context to p5
const p5Instance = new p5((p) => {
  p.setup = () => {
    const gl = renderer.getContext();
    p.createCanvas(width, height, p.WEBGL, true, gl);
  };
}, container);
```

**Note:** Complex, potentially brittle. Not recommended for initial implementation.

---

## Proposed Feature Set

### 1. Live p5.js Editor

Integrated code editor (Monaco/CodeMirror) with live preview:

```typescript
interface P5JsLayer {
  id: string;
  name: string;
  code: string;           // Full p5.js sketch
  mode: '2D' | 'WEBGL';
  audioReactive: boolean;
  uniforms: {
    uAudioLow: number;    // Injected from OpenVJ
    uAudioMid: number;
    uAudioHigh: number;
    uBeat: number;
    uBpm: number;
    uTime: number;
    uResolution: [number, number];
  };
}
```

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Surface List]  │          [p5.js Editor]          │ [FX]  │
│                  │                                    │       │
│  ● Layer 1       │  ┌────────────────────────────┐   │ Bright│
│  ● Layer 2       │  │ function setup() {         │   │ Contr │
│  ○ Layer 3       │  │   createCanvas(800, 600);  │   │ Hue   │
│                  │  │ }                          │   │       │
│  + Add p5 Layer  │  │                            │   │       │
│                  │  │ function draw() {          │   │       │
│                  │  │   background(0);           │   │       │
│                  │  │   fill(fft.getEnergy());   │   │       │
│                  │  │   circle(400, 300, 200);   │   │       │
│                  │  │ }                          │   │       │
│                  │  └────────────────────────────┘   │       │
│                  │                                    │       │
│                  │  [Run] [Save] [Load Template]     │       │
└─────────────────────────────────────────────────────────────┘
```

### 2. Template Library

Pre-built templates for common VJ patterns:

| Template | Description |
|----------|-------------|
| **Audio Waveform** | Oscilloscope-style visualization |
| **Particle System** | Audio-reactive particles |
| **Kaleidoscope** | Symmetric geometric patterns |
| **Neon Grid** | Retrowave aesthetic |
| **Fluid Simulation** | Real-time fluid dynamics |
| **Text Typography** | Animated kinetic text |

### 3. OpenVJ API Bridge

Special functions available in p5.js sketches:

```javascript
// Access OpenVJ's audio engine (no need for p5.sound)
const lowEnergy = openvj.audio.getLow();
const beat = openvj.audio.getBeat();
const bpm = openvj.audio.getBpm();

// Access MIDI values
const knob1 = openvj.midi.getCC(1);

// Trigger scene changes
openvj.scene.transition('Scene 2', 1000);

// Access video textures from other layers
const prevLayer = openvj.getLayerTexture('Layer 1');
image(prevLayer, 0, 0);
```

### 4. Shader Export

Convert p5.js sketches to GLSL shaders for GPU optimization:

```typescript
// Auto-convert p5 graphics to shader
const shaderCode = p5ToGLSL(p5Sketch);
surface.material = new CustomShaderMaterial(shaderCode);
```

---

## Technical Architecture

### New Components

```
openvj/
├── src/
│   ├── lib/
│   │   ├── p5jsEngine.ts          # Core p5.js integration
│   │   ├── p5jsTemplateLibrary.ts # Built-in templates
│   │   └── p5jsExporter.ts        # Shader/code export
│   │
│   ├── components/
│   │   ├── P5JsEditor.tsx         # Code editor component
│   │   ├── P5JsPlayer.tsx         # p5 instance wrapper
│   │   └── TemplateBrowser.tsx    # Template gallery
│   │
│   ├── stores/
│   │   └── p5jsStore.ts           # Zustand store for p5 layers
│   │
│   └── shaders/
│       └── p5jsBridge.glsl        # Uniform bridge shader
│
└── templates/                      # Built-in p5.js templates
    ├── audio-waveform.js
    ├── particle-system.js
    ├── kaleidoscope.js
    └── ...
```

### Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User Code   │────▶│  p5.js       │────▶│  Canvas      │
│  (Editor)    │     │  Instance    │     │  (Texture)   │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
┌──────────────┐     ┌──────────────┐     ┌──────┴───────┐
│  Preview     │◀────│  OpenVJ       │◀────│  Three.js    │
│  (Thumbnail) │     │  Surface      │     │  Texture     │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## Implementation Phases

### Phase 1: Core Integration (2 weeks)

- [ ] Add p5.js dependency
- [ ] Create `P5JsSource` class (offscreen canvas → texture)
- [ ] Integrate with existing asset store
- [ ] Basic p5.js player component

### Phase 2: Editor (2 weeks)

- [ ] Integrate Monaco/CodeMirror editor
- [ ] Live preview thumbnail
- [ ] Error display and debugging
- [ ] Save/load sketches to project

### Phase 3: Templates & Library (1 week)

- [ ] Create 10 starter templates
- [ ] Template browser UI
- [ ] Import/export sketch files

### Phase 4: Advanced Features (2 weeks)

- [ ] OpenVJ API bridge (audio, MIDI access)
- [ ] Shader export optimization
- [ ] Parameter binding (MIDI → sketch variables)

### Phase 5: Polish (1 week)

- [ ] Performance optimization
- [ ] Documentation
- [ ] Example performances

**Total: ~8 weeks for full feature set**

---

## Performance Considerations

| Concern | Mitigation |
|---------|------------|
| **Double render** | Use `requestVideoFrameCallback` for sync |
| **Memory** | Limit concurrent sketches (suggest max 4) |
| **CPU overhead** | p5.js in WEBGL mode offloads to GPU |
| **Context switching** | Reuse p5 instances; don't recreate |

### Recommended Limits

- **Max p5.js layers:** 4 simultaneous
- **Canvas resolution:** 1920×1080 max per sketch
- **Frame rate:** Target 30fps minimum
- **Complexity:** Warn on particle count >1000

---

## Use Cases

### 1. Generative Visual Artist
> "I want to code my visuals live during the performance"

**Workflow:**
1. Create p5.js layer
2. Code in the editor while visuals project
3. Adjust parameters with MIDI knobs
4. Save successful sketches as presets

### 2. Educational Workshops
> "Teaching creative coding with immediate projection mapping results"

**Benefits:**
- Familiar p5.js syntax for students
- Immediate visual impact
- Professional output quality

### 3. Hybrid VJ Setup
> "Combining video clips with generative elements"

**Workflow:**
- Layer 1: Pre-rendered video
- Layer 2: p5.js audio-reactive particles
- Layer 3: p5.js shader effects
- All mapped to different surfaces

---

## Competitive Advantage

| Tool | p5.js Support | Projection Mapping | Audio-Reactive | Open Source |
|------|---------------|-------------------|----------------|-------------|
| **OpenVJ** | ✅ Proposed | ✅ Yes | ✅ Yes | ✅ MIT |
| **Processing** | ✅ Native | ❌ No | ⚠️ Limited | ✅ Yes |
| **TouchDesigner** | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| **Resolume** | ❌ No | ✅ Yes | ⚠️ Plugins | ❌ No |
| **Hydra** | ⚠️ Similar | ❌ No | ✅ Yes | ✅ Yes |

**OpenVJ's Unique Position:**
- Only open-source tool combining p5.js creative coding with professional projection mapping
- Lower barrier to entry than TouchDesigner
- More capable than pure web solutions

---

## Conclusion

Integrating p5.js would transform OpenVJ from a projection mapping tool into a **complete creative coding platform**, attracting:

1. **Creative coders** familiar with p5.js/Processing
2. **Educators** teaching generative art
3. **Live coders** who want to perform with code
4. **Visual artists** seeking procedural generation

The texture-source approach provides immediate value with manageable implementation complexity, while laying groundwork for future shader optimization.

---

## Appendix: Example p5.js Sketches

### Audio-Reactive Particles

```javascript
let particles = [];

function setup() {
  createCanvas(800, 600, WEBGL);
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: random(-400, 400),
      y: random(-300, 300),
      z: random(-200, 200),
      size: random(5, 20)
    });
  }
}

function draw() {
  background(0);
  
  // Get audio from OpenVJ
  const bass = openvj.audio.getLow() / 255;
  const mid = openvj.audio.getMid() / 255;
  
  rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.01 + bass);
  
  noStroke();
  
  particles.forEach((p, i) => {
    push();
    translate(p.x, p.y, p.z);
    
    // Size reacts to audio
    let s = p.size * (1 + bass * 2);
    fill(100 + mid * 155, 200, 255);
    sphere(s);
    pop();
  });
}
```

### MIDI-Controlled Kaleidoscope

```javascript
let segments = 8;

function draw() {
  background(0);
  translate(width/2, height/2);
  
  // Get MIDI control
  segments = floor(map(openvj.midi.getCC(1), 0, 127, 3, 24));
  
  const angle = TWO_PI / segments;
  
  for (let i = 0; i < segments; i++) {
    push();
    rotate(angle * i);
    
    // Draw pattern
    fill(255, 100, 150);
    noStroke();
    ellipse(100, 0, 50 + openvj.audio.getHigh() / 2);
    
    pop();
  }
}
```

---

*Proposal v1.0 — April 2026*
