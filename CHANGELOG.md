# Changelog

All notable changes to OpenVJ will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-28 (Beta Release)

### ✨ Added

**Core Features:**
- Quad-based projection mapping with corner pin distortion
- Real-time UV coordinate transformation for surface warping
- Drag-and-drop video loading (MP4, WebM support)
- Video playback controls (play, pause, stop, seek)
- Timeline scrubbing interface
- Multiple independent surfaces per project

**Shader System:**
- Custom GLSL shader support per surface
- AI-assisted shader generation (Anthropic Claude integration)
- Live shader editor with syntax highlighting
- Built-in shader library:
  - Noise patterns
  - Kaleidoscope effects
  - Pixelation
  - Color grading
  - Edge detection
  - And more...

**Generative Graphics:**
- Uji Generator for animated kaleidoscope patterns
- Multiple blend modes
- Color and brightness adjustments
- Parameter controls

**User Interface:**
- Clean, dark-themed interface
- Media browser with drag-and-drop
- Surface list with visibility/lock controls
- Real-time parameter adjustments
- Save/load project configurations
- Export/import mapping presets
- Fullscreen mode
- Keyboard shortcuts

**Technical:**
- React 18 with TypeScript
- Three.js 0.160 for 3D rendering
- React Three Fiber integration
- Zustand for state management
- Vite for fast development
- Tailwind CSS for styling

### 📝 Documentation

- Comprehensive README with feature overview
- Quick start guide (QUICKSTART.md)
- Development roadmap (TODO.md)
- Project architecture documentation
- Contributing guidelines
- MIT License

### 🔧 Development

- Vitest test setup
- ESLint configuration
- TypeScript strict mode
- Hot module replacement
- Source maps for debugging

---

## [Unreleased]

### 🚧 Planned Features

See [TODO.md](./TODO.md) for the complete development roadmap.

**Phase 2 (Upcoming):**
- MIDI controller support
- Audio-reactive effects
- Effect chains and post-processing
- Image sequence playback
- Webcam/screenshare input
- Multi-output support
- Scene transitions

**Phase 3 (Future):**
- DMX lighting control
- Network sync (multiple instances)
- Cloud project storage
- Collaboration features
- Advanced timeline with keyframes
- Python scripting integration

---

## Version History

### Version Numbering

- **Major (X.0.0)** – Breaking changes, major features
- **Minor (0.X.0)** – New features, backwards compatible
- **Patch (0.0.X)** – Bug fixes, small improvements

### Release Status

- **0.1.0-beta** – Current release (beta testing)
- **0.2.0** – Planned for Q2 2026 (MIDI + audio)
- **1.0.0** – Stable release (planned Q4 2026)

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to contribute to OpenVJ.

---

[Unreleased]: https://github.com/kniessner/openvj/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/kniessner/openvj/releases/tag/v0.1.0
