# OpenVJ Development Todo

> 🎯 **Current Phase**: Phase 2 — Sprint 8 (Layer Masks)
> 📅 **Last Updated**: April 18, 2026

## ✅ Completed (Setup Phase)

- [x] Create project repository structure
- [x] Research existing solutions
- [x] Define project scope and features
- [x] Create initial documentation

---

## ✅ Phase 1: Foundation — COMPLETE

### Sprint 1: Three.js Setup ✅ COMPLETE
- [x] Vite + React + TypeScript project
- [x] Three.js + @react-three/fiber + @react-three/drei
- [x] Basic 3D scene with camera and controls
- [x] Dark theme with Tailwind CSS

### Sprint 2: Video Integration ✅ COMPLETE
- [x] VideoManager singleton — load, play, pause, seek, stop
- [x] HTMLVideoElement + THREE.VideoTexture
- [x] MP4, WebM support
- [x] Zustand video store

### Sprint 3: Projection Mapping MVP ✅ COMPLETE
- [x] ProjectedMaterial with bilinear UV warping
- [x] Corner pin distortion (4 draggable handles)
- [x] Real-time UV updates during drag
- [x] Multiple independent surfaces
- [x] Visibility toggle, lock, rename
- [x] JSON save/load (localStorage + file)

### Sprint 4: UI Foundation ✅ COMPLETE
- [x] Sidebar layout (Media + Surfaces + Scenes)
- [x] Media browser with drag-and-drop
- [x] Surface inspector with all FX sliders
- [x] Transport bar with scrubber
- [x] Layout presets (Single, Diptych, Triptych, Quad, Stage, Cross, Hexagon, etc.)
- [x] Undo/redo (50-state history)
- [x] Keyboard shortcuts

---

## ✅ Phase 2: Features — Sprints 5–7 COMPLETE, Sprint 8 In Progress

### Sprint 5: Effects System ✅ COMPLETE
- [x] GLSL fragment shader pipeline (ProjectedMaterial.ts)
- [x] Per-surface effects: brightness, contrast, hue, saturation, invert
- [x] Distortion FX: wave warp, chromatic aberration, pixelate, vignette
- [x] Blend modes: normal, add, screen, multiply
- [x] Custom GLSL post-process per surface (applyFX function)
- [x] AI-assisted shader generation (Anthropic API)
- [x] Live shader editor with syntax highlighting + live preview

### Sprint 6: Audio Reactivity ✅ COMPLETE
- [x] Web Audio API + AnalyserNode (audioEngine.ts)
- [x] 3-band FFT: low (20–300Hz), mid (300–4kHz), high (4k–20kHz)
- [x] Beat detection with adjustable threshold
- [x] BPM tap tempo
- [x] Audio uniforms in shaders: uAudioLow, uAudioMid, uAudioHigh, uBeat, uBpm
- [x] Visual level meters in UI

### Sprint 7: Content Sources ✅ COMPLETE
- [x] Video files (MP4, WebM) with full playback controls
- [x] Image files (JPG, PNG, animated GIF)
- [x] Webcam input (getUserMedia)
- [x] Screen capture (getDisplayMedia)
- [x] Custom GLSL shaders as source
- [x] Uji generative canvas source with audio modulation
- [x] 20 built-in shader presets

### Sprint 8: Layer System 🚧 IN PROGRESS

- [x] **8.1** Multi-layer architecture — surfaces act as independent layers with z-ordering
  - [x] Surface list = layer stack with drag-to-reorder
  - [x] Per-surface visibility, lock, blend mode
  - [x] Clone/duplicate surfaces
- [ ] **8.2** FBO-based compositing — render layers to off-screen textures
  - [ ] Render each surface to its own FBO
  - [ ] Final composite pass with global blend
  - [ ] Performance: only re-render dirty layers
- [ ] **8.3** Layer groups — group multiple surfaces together
  - [ ] Group container with shared blend mode
  - [ ] Expand/collapse groups in layer list
- [x] **8.4** Layer masks — alpha mask shapes per surface ✅ DONE (April 18)
  - [x] Mask shapes: ellipse, triangle, diamond, top/bottom/left/right half
  - [x] Feathered edges (softness slider)
  - [x] Invert mask toggle
  - [x] Mask UI in Surface Inspector

**Current focus:** Sprint 8.2 — FBO-based compositing

---

## 📋 Phase 3: Performance (Future)

### Sprint 9: Multi-Output
- [ ] Separate output window (popup) for projector
- [ ] `?output=1` URL mode — hides all UI, just canvas fullscreen
- [ ] BroadcastChannel or shared Zustand state across windows
- [ ] Edge blending between outputs

### Sprint 10: Performance Optimization
- [ ] FBO caching — skip re-render for unchanged surfaces
- [ ] WebGPU renderer backend (Three.js WebGPU)
- [ ] Texture pooling
- [ ] Stats.js FPS display + performance warnings

### Sprint 11: Advanced Mapping
- [ ] Bezier curve surface edges (more than 4 control points)
- [ ] Grid warp (4×4 mesh control points)
- [ ] Soft edge feathering (gradient alpha at quad edges)
- [ ] Custom SVG mask shapes

### Sprint 12: Advanced Project State
- [ ] Project file format v2 (asset bundles, not just JSON refs)
- [ ] Embedded binary assets in project file
- [ ] Preset recall system (named presets, instant recall)

---

## 📋 Phase 4: Hardware (Future)

### Sprint 13: OSC
- [ ] OSC.js integration
- [ ] TouchOSC layout support
- [ ] Bi-directional sync (send state back to controller)

### Sprint 14: External Video Input
- [ ] WebRTC peer connection as video source
- [ ] IP camera MJPEG stream
- [ ] NDI (WASM research needed)

### Sprint 15: Timeline
- [ ] Visual timeline with playhead
- [ ] Cue markers for scene recall
- [ ] Video playlist / auto-advance

---

## 📋 Phase 5: Polish (Future)

### Sprint 16: Distribution
- [ ] Electron wrapper for desktop app
- [ ] Auto-updater
- [ ] Marketing website + download page
- [ ] Discord community

### Sprint 17: Plugin System
- [ ] Plugin API design (effect plugins, source plugins)
- [ ] Plugin developer documentation
- [ ] Example plugins

### Sprint 18: Documentation
- [ ] User manual
- [ ] Video tutorials
- [ ] Example projects with sample scenes

---

## 📊 Progress Tracker

| Phase | Sprint | Status |
|-------|--------|--------|
| Phase 1 | All (1–4) | ✅ Complete |
| Phase 2 | Sprint 5 (Effects) | ✅ Complete |
| Phase 2 | Sprint 6 (Audio) | ✅ Complete |
| Phase 2 | Sprint 7 (Sources) | ✅ Complete |
| Phase 2 | Sprint 8.1 (Multi-layer) | ✅ Complete |
| Phase 2 | Sprint 8.4 (Layer Masks) | ✅ Complete |
| Phase 2 | Sprint 8.2 (FBO compositing) | 🔲 Next |
| Phase 2 | Sprint 8.3 (Layer groups) | 🔲 Planned |
| Phase 3–5 | All | 🔲 Future |

---

## 🎯 Next Actions

1. **Now**: Sprint 8.2 — FBO-based layer compositing
2. **Next**: Sprint 8.3 — Layer groups
3. **Soon**: Sprint 9 — Multi-output popup window for projector

---

*Last modified: April 18, 2026*
