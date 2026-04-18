# 🎨 OpenVJ v0.2.0: Creative Coding Release

**Release Date:** April 18, 2026  
**Codename:** "Generative"  
**Focus:** p5.js creative coding integration for live generative art

---

## 🚀 What's New

### p5.js Creative Coding Integration

OpenVJ now includes **full p5.js support**, bringing the power ofProcessing's creative coding library to your VJ performances. Create generative art, audio-reactive visuals, and algorithmic patterns—all live-coded and projected in real-time.

#### ✨ Key Features

- **5 Built-in Templates** to get you started instantly:
  - 🎵 **Audio Waveform** – Real-time frequency visualization
  - ✨ **Particle System** – Audio-reactive particle effects  
  - 🪞 **Kaleidoscope** – Mirror symmetry patterns
  - 🔲 **Neon Grid** – Cyberpunk-style grid animations
  - 🌊 **Liquid Flow** – Perlin noise fluid simulations

- **Live Code Editor** with real-time preview and error handling
- **Layer-based Management** – Stack sketches with opacity and blend modes
- **Three.js Bridge** – Seamlessly integrate p5.js into your projection mapping

#### 🔌 OpenVJ Bridge API

Access OpenVJ's audio and MIDI data directly in your sketches:

```javascript
// Audio analysis
const bass = openvj.audio.getLow() / 255;   // 0-1 bass energy
const mid = openvj.audio.getMid() / 255;    // 0-1 mid energy
const high = openvj.audio.getHigh() / 255;  // 0-1 treble energy
const beat = openvj.audio.getBeat();        // Beat trigger (0-1)
const bpm = openvj.audio.getBPM();          // Detected tempo

// MIDI controllers
const knob1 = openvj.midi.getCC(1);  // CC value 0-1
```

#### Example Sketch

```javascript
function setup() {
  createCanvas(512, 512);
}

function draw() {
  // React to beat
  if (openvj.audio.getBeat() > 0.5) {
    background(255);
  } else {
    background(0);
  }
  
  // Scale with bass
  const bass = openvj.audio.getLow() / 255;
  fill(255, 0, 128);
  circle(width/2, height/2, 100 + bass * 200);
}
```

---

## 📦 Technical Details

### Dependencies
- p5.js 1.9.0
- @types/p5 (TypeScript support)

### New Components
- `P5JsPanel` – Sidebar panel for layer management
- `P5JsEditor` – Live code editor
- `p5jsStore` – Zustand store for sketch state
- `P5JsEngine` – Three.js texture bridge

### Architecture
- Instance mode rendering for independent sketches
- Real-time texture updates to Three.js materials
- Persistent storage of sketch code

---

## 🎯 Use Cases

- **Live Performances** – Code visuals on-the-fly during sets
- **Audio-Reactives** – Create visualizers that respond to music
- **Generative Installations** – Autonomous art that evolves over time
- **Educational** – Teach creative coding with immediate visual feedback
- **Prototyping** – Rapidly test visual ideas before committing to shaders

---

## 📈 Performance Tips

- **Particle Count:** Keep under 500 for 60fps on most GPUs
- **Blend Modes:** Use `ADD` for glow effects, `SCREEN` for overlays
- **Audio Reactivity:** Cache frequency values between frames
- **WEBGL Mode:** Use for 3D, prefer 2D for simpler effects

---

## 🛠️ Getting Started

1. Open OpenVJ in your browser
2. Look for the **p5.js panel** in the sidebar
3. Click **"Templates"** → select a starter sketch
4. Edit the code live
5. Enable microphone input (🎤 icon) for audio reactivity

---

## 🐛 Known Issues

- Large particle counts (>1000) may impact framerate
- MIDI access requires browser permission
- Safari has limited WebMIDI support (use Chrome/Edge for best experience)

---

## 🔮 What's Next

Phase 3 features coming soon:
- Effect chains and post-processing pipeline
- Multi-output support (multiple projectors)
- DMX lighting control
- Network sync between instances

---

## 📝 Full Changelog

See [CHANGELOG.md](./CHANGELOG.md) for complete version history.

---

**Happy Creative Coding!** 🎨✨  
*- The OpenVJ Team*
