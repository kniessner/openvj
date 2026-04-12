# Changelog

All notable changes to OpenVJ will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-28 (Beta Release)

### ✨ Added

**Projection Mapping:**
- Quad-based projection mapping with corner pin distortion
- Real-time UV coordinate transformation for surface warping
- Drag-and-drop corner manipulation in 3D space
- Multiple independent surfaces per project
- Surface visibility toggle and lock

**Video Playback:**
- Drag-and-drop video loading (MP4, WebM support)
- Video playback controls (play, pause, stop, seek)
- Variable playback rate (0.5×, 1×, 2×, 4×)
- Loop mode and volume control
- Timeline scrubbing interface with waveform visualization
- Video audio mute/unmute

**Audio-Reactive Features:**
- **Real-time microphone input** with frequency analysis
- Three-band frequency analysis: Low (20-300Hz), Mid (300-4kHz), High (4k-20kHz)
- Beat detection with adjustable threshold
- BPM tap tempo calculator
- Visual level meters with live feedback
- Audio uniforms for shaders: `uAudioLow`, `uAudioMid`, `uAudioHigh`, `uBeat`
- Adjustable sensitivity, smoothing, and beat threshold settings

**MIDI Controller Support:**
- **Full MIDI CC mapping** via WebMIDI API
- MIDI learn mode for easy parameter binding
- Control 11 surface parameters: opacity, brightness, contrast, hue, saturation, zoom, warp, chromatic aberration, pixelate, vignette, rotation
- Default 8-knob mapping with persistent storage
- Multi-channel MIDI support
- Works with any standard MIDI controller

**Shader System:**
- Custom GLSL shader support per surface
- AI-assisted shader generation (Anthropic Claude integration)
- Live shader editor with syntax highlighting
- Built-in shader library:
  - Plasma Wave
  - Tunnel
  - Kaleidoscope
  - Lava Lamp
  - Voronoi
  - Spiral
  - Hexagonal Tiles
  - Grid Distortion
  - And more...
- Audio-reactive uniforms built into shader system

**Media Sources:**
- Video files (MP4, WebM) via drag-and-drop
- Image files (JPG, PNG, GIF)
- Webcam input
- Screen capture
- Custom GLSL shaders
- Uji Generator (generative kaleidoscope patterns)

**Scene Management:**
- Save and load complete scenes
- Scene thumbnails for quick preview
- Smooth scene transitions
- Multiple scene presets with persistent storage

**Project Management:**
- Save/load project configurations
- Export/import projects as JSON
- LocalStorage persistence
- Full state restoration on reload

**User Interface:**
- Clean, dark-themed interface
- Media browser with type filters (all, video, image, shader, uji, webcam, screen)
- Surface list with thumbnails and quick controls
- Real-time parameter sliders for all effects
- Fullscreen mode (F key)
- Comprehensive keyboard shortcuts
- Built-in help modal with shortcut reference (? key)
- Transport controls with audio waveform visualization
- MIDI and audio control panels
- Settings panels for audio and MIDI

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
