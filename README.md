# 🎛️ OpenVJ

> **Real-time visual performance and projection mapping in your browser**

OpenVJ is an open-source VJ (Video Jockey) and projection mapping system built with modern web technologies. Transform any surface into a dynamic canvas for live visuals, performances, and installations—no expensive hardware or proprietary software required.

![Beta Release](https://img.shields.io/badge/status-beta-yellow)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/react-18.2-61dafb)
![Three.js](https://img.shields.io/badge/three.js-0.160-black)

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

### Current (v0.1.0 - Beta)

✅ **Projection Mapping**
- Quad-based surface warping with corner pin distortion
- Drag-and-drop corner manipulation in 3D space
- Multiple independent surfaces per project
- Real-time UV coordinate transformation

✅ **Video Playback**
- Support for MP4, WebM, and browser-native formats
- Drag-and-drop video loading
- Play/pause/stop/seek controls
- Timeline scrubbing

✅ **Shader System**
- Custom GLSL shaders per surface
- AI-assisted shader generation (bring your own Anthropic API key)
- Live shader editing with syntax highlighting
- Built-in shader library (noise, kaleidoscope, pixelate, etc.)

✅ **User Interface**
- Clean, dark-themed interface
- Real-time parameter adjustments
- Save/load project configurations
- Export/import mapping presets
- Keyboard shortcuts for performance

✅ **Generative Graphics**
- Uji Generator for animated kaleidoscope patterns
- Multiple blend modes and color adjustments
- Parameter automation ready

### 🚧 Roadmap

See [TODO.md](./TODO.md) for the complete development roadmap.

**Coming Soon:**
- 🎹 MIDI controller support
- 🎵 Audio-reactive effects
- 🔄 Effect chains and post-processing
- 🖼️ Image sequence playback
- 📹 Webcam/screenshare input
- 🌐 Multi-output support
- 🎭 Scene transitions and crossfades

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- A modern browser (Chrome, Firefox, Edge, Safari)
- Optional: A projector or second display for projection mapping

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
5. **Go Fullscreen** – Press `F` or click the fullscreen button to fill your screen/projector

📖 **Detailed Guide:** See [QUICKSTART.md](./QUICKSTART.md)

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [QUICKSTART.md](./QUICKSTART.md) | Get up and running in 5 minutes |
| [TODO.md](./TODO.md) | Development roadmap and task list |
| [docs/PROJECT_PLAN.md](./docs/PROJECT_PLAN.md) | Detailed feature specifications |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Technical architecture overview |

---

## 🎨 Screenshots

*Coming soon – we'd love contributions! Share your creations.*

---

## 🛠️ Technology Stack

OpenVJ is built with modern web technologies:

- **[React](https://react.dev)** – UI framework
- **[Three.js](https://threejs.org)** – 3D rendering engine
- **[React Three Fiber](https://docs.pmnd.rs/react-three-fiber)** – React renderer for Three.js
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
- The open-source projection mapping community
- All contributors and testers

Special thanks to:
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

OpenVJ is currently in **beta**. While core features are stable, you may encounter bugs or incomplete features. Please report issues on GitHub!

**Known Limitations:**
- No MIDI support yet (coming in Phase 2)
- Audio reactivity not implemented
- Single display output only (multi-output in development)
- Limited shader presets (we're building the library!)

---

## 🎉 Get Involved

We're building OpenVJ in the open and would love your input!

- ⭐ **Star this repo** if you find it useful
- 👀 **Watch for updates** on new releases
- 🍴 **Fork and experiment** with your own modifications
- 📣 **Spread the word** to other creative technologists

---

**Happy VJing!** 🎬✨

*Built with ❤️ by the OpenVJ community*
