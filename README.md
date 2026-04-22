# 🎛️ OpenVJ

> **Real-time visual performance and projection mapping in your browser**

OpenVJ is an open-source VJ (Video Jockey) and projection mapping system built with modern web technologies. Transform any surface into a dynamic canvas for live visuals, performances, and installations—with **full MIDI control**, **real-time audio reactivity**, **Uji generative art**, and **AI-powered shader generation**. No expensive hardware or proprietary software required.

![Beta Release](https://img.shields.io/badge/status-beta-yellow)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/react-18.2-61dafb)
![Three.js](https://img.shields.io/badge/three.js-0.160-black)
![p5.js](https://img.shields.io/badge/p5.js-1.9-orange)

---

## ✨ What is OpenVJ?

**OpenVJ** brings professional VJ capabilities to the web. Whether you're mapping visuals onto buildings, creating stage backdrops, or experimenting with live generative art, OpenVJ provides the tools you need—entirely in your browser.

### 🎯 Perfect For

- **Live Performers** – VJs, musicians, stage designers
- **Installation Artists** – Projection mapping for galleries, events, public spaces
- **Creative Coders** – Experiment with shaders, generative art, real-time graphics
- **Educators** – Teach projection mapping and real-time graphics
- **Hobbyists** – Explore visual art without expensive equipment

---

## 🌟 Features

### Current (v0.2.0 - Generative)

✅ **Projection Mapping**
- Quad-based surface warping with corner pin distortion
- Drag-and-drop corner manipulation in 3D space
- Multiple independent surfaces per project
- Real-time UV coordinate transformation
- Surface visibility toggle and lock
- Mask shapes: Circle, Ellipse, Diamond, Star, Polygon

✅ **Video Playback**
- Support for MP4, WebM, and browser-native formats
- Drag-and-drop video loading
- Play/pause/stop/seek controls
- Variable playback rate (0.5×, 1×, 2×, 4×)
- Loop mode and volume control
- Timeline scrubbing with waveform visualization

✅ **Uji Generative System** [NEW in v0.2.0]
- **39 built-in presets** from the original Uji by Noah Doersing
- Real-time kaleidoscopic generative patterns
- Canvas 2D rendering with seamless looping
- Full parameter control: Shape, Rotation, Expansion, Waviness, Jitter
- Audio-reactive modulation: Rotation, Jitter, Expansion, Hue shift
- Fade effects: Fade-in, Fade-out, Sawtooth fade patterns
- Customizable appearance: Colors, Opacity, Shadows, Noise
- Visual presets: ⵋ, ⴼ, ⵛ, ⵍ, ⵟ, ⵥ, ⵣ, ⵠ, ⵒ, and more!

✅ **Audio-Reactive**
- **Real-time microphone input** with frequency analysis
- Three-band EQ: Low (20-300Hz), Mid (300-4kHz), High (4k-20kHz)
- Beat detection with adjustable threshold
- BPM tap tempo
- Visual level meters
- Shaders can respond to `uAudioLow`, `uAudioMid`, `uAudioHigh`, `uBeat` uniforms
- Uji patterns react to audio in real-time
- Adjustable sensitivity and smoothing

✅ **MIDI Controller Support**
- **Full MIDI CC mapping** via WebMIDI API
- MIDI learn mode for easy binding
- Control surface parameters: opacity, brightness, contrast, hue, saturation, zoom, warp, chromatic aberration, pixelate, vignette, rotation
- Default 8-knob mapping with persistent storage
- Works with any MIDI controller (tested with generic USB controllers)

✅ **Shader System**
- Custom GLSL shaders per surface
- AI-assisted shader generation (bring your own Anthropic API key)
- Live shader editing with syntax highlighting
- Built-in shader library: Plasma Wave, Tunnel, Kaleidoscope, Lava Lamp, Voronoi, and more
- Audio-reactive uniforms built-in

✅ **Creative Coding & Generative Art:**
- **p5.js integration** for live generative art coding
- 5 built-in templates: Audio Waveform, Particles, Kaleidoscope, Neon Grid, Liquid Flow
- Live code editor with real-time preview
- OpenVJ Bridge API for audio/MIDI access in sketches
- Layer-based sketch management with blend modes
- Instance mode rendering for independent execution

✅ **Media Sources:**
- Video files (MP4, WebM)
- Image files (JPG, PNG, GIF, WebP, SVG, BMP)
- Webcam input
- Screen capture
- Custom GLSL shaders
- **Uji generators** (39 generative kaleidoscope patterns)
- p5.js sketches (code-based generative art)

✅ **Scene Management**
- Save and load complete scenes
- Scene thumbnails for quick preview
- Smooth scene transitions
- Multiple scene presets

✅ **Project Management**
- Save/load project configurations
- Export/import as JSON
- LocalStorage persistence
- Full state restoration
- JSON validation with Zod schemas

✅ **User Interface**
- Clean, dark-themed interface
- Media browser with type filters
- Surface list with thumbnails
- Real-time parameter sliders
- Fullscreen mode (F11)
- **Help overlay** (? key) with shortcuts
- Surface Inspector with tabs (Color, Transform, FX, Mask, Corners)
- Transport controls with audio waveform

✅ **Surface Inspector** [NEW in v0.2.0]
- **Color tab**: Brightness, Contrast, Saturation, Hue, Colorize, Invert
- **Transform tab**: Scale, Translate, Rotation, FlipX/Y
- **FX tab**: Zoom, Warp, Chromatic Aberration, Pixelate, Vignette, Scanlines, Noise
- **Mask tab**: Circle, Ellipse, Diamond, Star, Polygon masks with feather/invert
- **Corners tab**: Corner adjustment with nudge controls and presets

✅ **Uji Controller Panel** [NEW in v0.2.0]
- Live parameter adjustment for all Uji settings
- 7 tabs: Geometry, Rotation, Motion, Texture, Visibility, Appearance, Animation
- **Geometry**: Shape, Segments, Radius, Iterations
- **Rotation**: Speed, Speedup, Period, Until, Origin, Initial rotation
- **Motion**: Expansion H/V (linear + exponential), Translation
- **Texture**: Jitter, Waviness (phase & amplitude H/V)
- **Visibility**: Skip chance, Segment rotation, Lengthening, Line swappiness, Reveal speed
- **Appearance**: Thickness, Line color/opacity, BG color/**opacity** [NEW], Hue shift, Blend mode, Shadows, Noise
- **Animation**: Live animation mode with audio modulation controls
- **39 one-click presets** from original Uji

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- A modern browser (Chrome, Firefox, Edge, Safari)
- Optional: A projector or second display for projection mapping
- Optional: MIDI controller for hardware control

### Installation

```bash
# Clone the repository
git clone https://github.com/kniessner/openvj.git
cd openvj

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit **http://localhost:5173** and you'll see the OpenVJ interface with a demo scene.

### First Steps

1. **Load a Video** – Drag and drop an MP4/WebM file into the Media Browser
2. **Create a Surface** – Click "+ Add Surface" in the Surface List
3. **Adjust Mapping** – Drag the corner handles to warp the projection
4. **Try a Shader** – Select a surface and apply a built-in shader effect
5. **Try Uji Generative Art** – Click "⛶" on a surface, choose "Uji Generator", select a preset
6. **Create p5.js Sketch** – Open the p5.js panel, click "New Sketch", and code live
7. **Enable Audio Reactivity** – Click the 🎤 icon to add audio-responsive visuals
8. **MIDI Control** – Connect a MIDI controller and use MIDI Learn to map parameters
9. **Go Fullscreen** – Press `F11` or click the fullscreen button

📖 **Detailed Guide:** See [QUICKSTART.md](./QUICKSTART.md)

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [QUICKSTART.md](./QUICKSTART.md) | Get up and running in 5 minutes |
| [DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md) | Current implementation status |
| [TODO.md](./TODO.md) | Development roadmap and task list |
| [docs/PROJECT_PLAN.md](./docs/PROJECT_PLAN.md) | Detailed feature specifications |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Technical architecture overview |

---

## 🎮 Keyboard Shortcuts

Press `?` in the app to see all shortcuts:

| Key | Action |
|-----|--------|
| `Space` | Play/Pause video |
| `F` | Toggle Fullscreen |
| `H` or `?` | Show/Hide Help |
| `S` | Save Project |
| `L` | Load Project |
| `M` | Toggle Media Browser |
| `Delete` | Remove selected surface |
| `1-9` | Select surface by number |

---

## 🛠️ Technology Stack

OpenVJ is built with modern web technologies:

- **[React](https://react.dev)** – UI framework
- **[Three.js](https://threejs.org)** – 3D rendering engine
- **[React Three Fiber](https://docs.pmnd.rs/react-three-fiber)** – React renderer for Three.js
- **[p5.js](https://p5js.org)** – Generative art and creative coding
- **[Zustand](https://zustand-demo.pmnd.rs/)** – Lightweight state management
- **[Vite](https://vitejs.dev)** – Lightning-fast build tool
- **[TypeScript](https://www.typescriptlang.org/)** – Type safety
- **[Tailwind CSS](https://tailwindcss.com)** – Utility-first styling

---

## 🤝 Contributing

OpenVJ is an open-source project and contributions are welcome!

### Ways to Contribute

- 🐛 **Report bugs** – Found an issue? [Open an issue](https://github.com/kniessner/openvj/issues)
- 💡 **Suggest features** – Have an idea? [Start a discussion](https://github.com/kniessner/openvj/discussions)
- 🔧 **Submit PRs** – Code contributions are always appreciated
- 📝 **Improve docs** – Help make the documentation better
- 🎨 **Share creations** – Show us what you've made!

### Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## 📜 License

OpenVJ is released under the **MIT License**. See [LICENSE](./LICENSE) for details.

You are free to use, modify, and distribute this software for personal, educational, or commercial purposes.

---

## 🙏 Acknowledgments

OpenVJ stands on the shoulders of giants:

- **Three.js** for making WebGL accessible
- **@react-three/fiber** for the React integration
- **p5.js** for creative coding capabilities
- **Noah Doersing** for the original [Uji](https://ghpages.noahdoersing.com/uji/) generative art system
- The open-source projection mapping community
- All contributors and testers

Special thanks to:
- **Uji** by Noah Doersing (inspiration for generative patterns)
- **MapMapMap** (inspiration for projection mapping workflows)
- **MadMapper** (feature reference)
- **Resolume** (VJ workflow inspiration)

---

## 🔗 Links

- **Documentation:** [GitHub Wiki](https://github.com/kniessner/openvj/wiki)
- **Issues:** [GitHub Issues](https://github.com/kniessner/openvj/issues)
- **Discussions:** [GitHub Discussions](https://github.com/kniessner/openvj/discussions)

---

## 💬 Community & Support

- 💬 **Discord** – *Coming soon*
- 🐦 **Twitter** – *Coming soon*
- 📧 **Email** – your.email@example.com

---

## ⚠️ Beta Notice

OpenVJ is currently in **beta**. Core features are working and stable, but you may encounter edge cases or browser compatibility issues. Please report issues on GitHub!

**Known Limitations:**
- Webcam/screen capture needs browser permissions (may vary by browser)
- Single display output only (multi-output in development)
- Effect chains not yet implemented (single effect per surface)
- No frame-by-frame image sequence playback yet
- Works best in Chrome/Edge (WebMIDI and WebGL support)

---

## 🎉 What's New in v0.2.0

### Generative Art Release

- ✨ **Uji Generative System** – 39 presets, full parameter control
- ✨ **p5.js Integration** – Live coding creative sketches
- ✨ **Surface Inspector** – Tabbed interface for all surface properties
- ✨ **Improved UI/UX** – Better help system, keyboard shortcuts overlay
- ✨ **Seamless Uji Looping** – No visible reset in animations
- ✨ **Audio-Reactive Uji** – Patterns react to music in real-time
- ✨ **Black Lines Fix** – Texture wrapping improvements
- 🐛 **Build Stability** – All TypeScript errors resolved

---

**Happy VJing!** 🎬✨

*Built with ❤️ by the OpenVJ community*
