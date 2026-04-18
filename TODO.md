# OpenVJ Development Todo


> 🎯 **Current Phase**: Phase 3 — Sprint 9 (Multi-Output)
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

## ✅ Phase 2: Features — COMPLETE

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

### Sprint 8: Layer System ✅ COMPLETE
- [x] Multi-layer architecture with z-ordering
- [x] Surface list with drag-to-reorder
- [x] Per-surface visibility, lock, blend mode
- [x] Clone/duplicate surfaces
- [x] Global output FX with post-processing
- [x] Layer groups with collapse/expand
- [x] Layer masks with feathered edges

### Sprint 9: p5.js Creative Coding ✅ COMPLETE (April 18, 2026)
- [x] p5.js 1.9.0 integration with full TypeScript support
- [x] Instance mode rendering for independent sketches
- [x] Live code editor with real-time preview
- [x] 5 starter templates (Audio Waveform, Particles, Kaleidoscope, Neon Grid, Liquid Flow)
- [x] OpenVJ Bridge API for audio/MIDI access
- [x] Layer-based sketch management in sidebar
- [x] Three.js texture bridge for projection mapping
- [x] Persistent sketch storage with Zustand
- [x] Template library for quick starts
  - [x] Play/pause, opacity, and blend mode controls

**Phase 2 (Sprints 5-9) complete. Phase 3 begins next.**

---

## 📋 Phase 3: Performance (Future)

### Sprint 9: Multi-Output ✅ Mostly Complete
- [x] Separate output window (popup) for projector (`?mode=output`)
- [x] Output URL mode — hides all UI, clean canvas fullscreen
- [x] BroadcastChannel audio sync across windows
- [x] localStorage storage events for surface/asset/output-FX sync
- [x] Edge blending — per-surface soft gradient fades at each edge for projector overlap ✅ DONE (April 18)

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
| Phase 2 | Sprint 8 (Layer System) | ✅ Complete |
| Phase 2 | Sprint 9 (p5.js) | ✅ Complete |
| Phase 3–5 | All | 🔲 Future |

---

## 🎯 Next Actions

1. **Now**: Sprint 9 — Multi-output (already partially done: output window + BroadcastChannel audio)
   - Update TODO to reflect what's already built
   - Edge blending between outputs
2. **Next**: Sprint 10 — Performance (FBO caching, WebGPU, texture pooling)
3. **Soon**: Sprint 11 — Advanced mapping (bezier curves, grid warp)

---

*Last modified: April 18, 2026*
