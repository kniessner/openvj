# OpenVJ Development Todo

> 🎯 **Current Phase**: Phase 1 - Foundation (complete) → Phase 2
> 📅 **Last Updated**: April 10, 2026

## ✅ Completed (Setup Phase)

- [x] Create project repository structure
- [x] Research existing solutions
- [x] Define project scope and features
- [x] Create initial documentation

---

## 🚧 Phase 1: Foundation (Weeks 1-4)

### Sprint 1: Three.js Setup (Week 1)
**Goal**: Basic Three.js scene running

- [ ] **1.1** Initialize Vite project with React
  ```bash
  npm create vite@latest openvj -- --template react-ts
  cd openvj
  npm install
  ```

- [ ] **1.2** Install Three.js dependencies
  ```bash
  npm install three @types/three
  npm install @react-three/fiber @react-three/drei
  ```

- [ ] **1.3** Create basic scene component
  - [ ] Scene container
  - [ ] Perspective camera
  - [ ] OrbitControls for navigation
  - [ ] Grid helper

- [ ] **1.4** Set up multiple render targets structure
  - [ ] Think about how to render to different displays
  - [ ] Consider using offscreen canvas/FBO pattern

- [ ] **1.5** Basic styling with Tailwind
  - [ ] Install Tailwind
  - [ ] Create dark theme base

- [ ] **1.6** Initial commit
  - [ ] Git init
  - [ ] .gitignore for node_modules, dist
  - [ ] First commit with message "Initial Three.js setup"

**Deliverable**: Empty 3D scene running in browser

### Sprint 2: Video Integration (Week 1-2) ✅ COMPLETED
**Goal**: Play video on a 3D plane

- [x] **2.1** Research video texture options — HTMLVideoElement + THREE.VideoTexture
- [x] **2.2** VideoManager singleton (`src/lib/videoManager.ts`) — load, play, pause, seek, stop
- [x] **2.3** Video controls — Play/Pause/Stop wired to actual HTMLVideoElement
- [x] **2.4** Supported formats — MP4, WebM (anything the browser can decode)
- [x] **2.5** Video state management — `src/stores/videoStore.ts` with Zustand

**Deliverable**: ✅ Drag-and-drop video loads and plays on all surfaces
**Files**: `stores/videoStore.ts`, `lib/videoManager.ts`

### Sprint 3: Projection Mapping MVP (Week 2-3) ✅ COMPLETED
**Goal**: Corner pin distortion working

- [x] **3.1** Research projection mapping techniques
  - [x] Homography matrices
  - [x] Corner pin (quad warping)
  - [x] Mesh-based warping

- [x] **3.2** Create ProjectedMaterial
  - [x] Custom shader material (`ProjectedMaterial.ts`)
  - [x] UV coordinate transformation via bilinear interpolation
  - [x] Brightness/contrast/tint uniforms
  - [x] Reference: three-projected-material patterns

- [x] **3.3** Quad surface with draggable corners
  - [x] Visual corner handles (red spheres)
  - [x] Drag to reposition in 3D space
  - [x] Real-time UV updates on drag
  - [x] Hover states and cursor feedback

- [x] **3.4** Save/load mapping config
  - [x] JSON format for mappings
  - [x] Save to localStorage (Zustand persist)
  - [x] Export to file (JSON download)
  - [x] Import from file (file upload)

- [x] **3.5** Multiple surfaces
  - [x] Array of surfaces in Zustand store
  - [x] Add/remove surfaces with UI
  - [x] Select active surface (click to edit)
  - [x] Visibility toggle per surface
  - [x] Lock/unlock to prevent accidental edits

**Deliverable**: ✅ Can map video to a quad, drag corners, save config
**Files**: `stores/surfaceStore.ts`, `shaders/ProjectedMaterial.ts`, `components/Surface.tsx`, `components/SurfaceList.tsx`

### Sprint 4: UI Foundation (Week 3-4) ✅ COMPLETED
**Goal**: Functional but minimal UI

- [x] **4.1** Layout — sidebar (media + surfaces + inspector) + canvas + transport bar
- [x] **4.2** Media browser — functional drag-and-drop, file picker, loaded state with clear button
- [x] **4.3** Surface inspector panel — Opacity/Brightness/Contrast sliders, corner nudges, reset; collapsible corners section
- [x] **4.4** Timeline component — interactive scrubber (range input) with time display, seek-on-drag
- [ ] **4.5** Preset system — deferred to Phase 3 (Sprint 12)

**Deliverable**: ✅ Complete, polished UI for mapping video to surfaces
**Files**: `App.tsx` (rewrite), `components/SurfaceList.tsx` (rewrite), `index.css` (updated)

**UI Improvements (v0.3.0)**:
- [x] Double-click surface name to rename inline
- [x] Keyboard shortcuts: Space (play/pause), Esc (deselect surface)
- [x] Global drag-and-drop overlay on the whole app
- [x] Inspector: Opacity/Brightness/Contrast sliders with live preview
- [x] Transport bar with green progress scrubber
- [x] Compact surface list items with hover-revealed action buttons
- [x] "Live" badge in canvas when video is playing
- [x] Surface props (opacity/brightness/contrast) synced to shader each frame

---

## 📋 Phase 2: Features (Weeks 5-8)

### Sprint 5: Effects System (Week 5)

- [ ] **5.1** GLSL shader pipeline architecture
  - [ ] Fragment shader structure
  - [ ] Uniform passing system
  - [ ] Effect composition order

- [ ] **5.2** Basic effects library
  - [ ] Shader: Invert colors
  - [ ] Shader: Grayscale
  - [ ] Shader: Hue rotate
  - [ ] Shader: Brightness/Contrast

- [ ] **5.3** Blend modes
  - [ ] Normal, Add, Multiply, Screen
  - [ ] Overlay, Soft Light
  - [ ] Custom blend shader

- [ ] **5.4** Effect chain UI
  - [ ] Drag to reorder effects
  - [ ] Toggle effects on/off
  - [ ] Effect parameter sliders

**Deliverable**: Apply effects to video layers

### Sprint 6: Audio Reactivity (Week 6)

- [ ] **6.1** Web Audio API setup
  - [ ] AudioContext
  - [ ] AnalyserNode
  - [ ] Permission handling

- [ ] **6.2** FFT Analysis
  - [ ] Frequency data (FFT size: 256/512)
  - [ ] Time domain data
  - [ ] Smoothing

- [ ] **6.3** Audio data store
  - [ ] Frequency bins
  - [ ] Overall volume
  - [ ] Beat detection

- [ ] **6.4** Audio-reactive uniforms
  - [ ] Pass audio data to shaders
  - [ ] Example: video brightness = volume
  - [ ] Example: distortion amount = bass

**Deliverable**: Video reacts to microphone/system audio

### Sprint 7: Content Sources (Week 7)

- [ ] **7.1** Image support
  - [ ] Load PNG/JPG
  - [ ] Texture from image
  - [ ] Slideshow mode

- [ ] **7.2** GIF/WebP animation
  - [ ] Decode frames
  - [ ] Sync to video playback

- [ ] **7.3** Canvas source
  - [ ] 2D canvas as texture
  - [ ] P5.js integration possibility

- [ ] **7.4** Screen capture
  - [ ] getDisplayMedia API
  - [ ] Capture another window

**Deliverable**: Support images, screen capture as sources

### Sprint 8: Layer System (Week 8)

- [ ] **8.1** Multi-layer architecture
  - [ ] Layer class/structure
  - [ ] Z-order/index
  - [ ] Visibility toggle

- [ ] **8.2** Layer compositing
  - [ ] Render layers to FBOs
  - [ ] Blend layers
  - [ ] Final composite output

- [ ] **8.3** Layer UI
  - [ ] Layer list panel
  - [ ] Add/remove/duplicate
  - [ ] Solo/mute layer

- [ ] **8.4** Layer masks
  - [ ] Alpha masks
  - [ ] Draw mask shape
  - [ ] Feather edges

**Deliverable**: Multiple layers with blending and masks

---

## 📋 Phase 3: Performance (Weeks 9-12)

### Sprint 9: Multi-Projector (Week 9)

- [ ] **9.1** Research multi-display APIs
  - [ ] window.screen API
  - [ ] Fullscreen across displays

- [ ] **9.2** Output window management
  - [ ] Create popup windows for outputs
  - [ ] Position on specific displays
  - [ ] Synchronize content

- [ ] **9.3** Edge blending
  - [ ] Gradient alpha between projectors
  - [ ] Blend mask editor

- [ ] **9.4** Display preview
  - [ ] Mini-map of all outputs
  - [ ] Output status indicators

**Deliverable**: Support 2-3 projectors with edge blending

### Sprint 10: Performance Optimization (Week 10)

- [ ] **10.1** FBO caching
  - [ ] Cache expensive renders
  - [ ] Invalidate on change

- [ ] **10.2** WebGPU backend
  - [ ] Research WebGPU support
  - [ ] Three.js WebGPU renderer

- [ ] **10.3** Texture pooling
  - [ ] Reuse texture objects
  - [ ] Reduce garbage collection

- [ ] **10.4** FPS monitoring
  - [ ] Stats.js or similar
  - [ ] Performance warnings

**Deliverable**: 60fps on mid-range laptop

### Sprint 11: Advanced Mapping (Week 11)

- [ ] **11.1** Bezier curve warping
  - [ ] Curved surfaces
  - [ ] More than 4 control points

- [ ] **11.2** Grid warping
  - [ ] 4x4 or 8x8 grid
  - [ ] Per-point adjustment

- [ ] **11.3** Soft edge masking
  - [ ] Gradual fade at edges
  - [ ] Mask editor

- [ ] **11.4** Mask shapes
  - [ ] Circle, triangle, custom SVG

**Deliverable**: Complex curved surface mappings

### Sprint 12: Project State (Week 12)

- [ ] **12.1** Project file format
  - [ ] JSON schema
  - [ ] Assets referenced by path
  - [ ] Binary assets base64 embedded

- [ ] **12.2** Undo/redo
  - [ ] Command pattern
  - [ ] History stack (50 states)

- [ ] **12.3** Preset system
  - [ ] Named presets
  - [ ] Quick recall
  - [ ] Preset transitions

- [ ] **12.4** Scene management
  - [ ] Multiple scenes
  - [ ] Scene transitions

**Deliverable**: Save/load complex projects

---

## 📋 Phase 4: Hardware (Weeks 13-16)

### Sprint 13: MIDI (Week 13)

- [ ] **13.1** Web MIDI API
  - [ ] Access MIDI devices
  - [ ] MIDI message parsing

- [ ] **13.2** MIDI Learn
  - [ ] Click to map
  - [ ] Store mappings

- [ ] **13.3** Common controllers
  - [ ] APC40 preset
  - [ ] Launchpad preset

- [ ] **13.4** MIDI output
  - [ ] Send MIDI for feedback
  - [ ] LED control

**Deliverable**: Physical controller support

### Sprint 14: OSC (Week 14)

- [ ] **14.1** OSC.js integration
  - [ ] OSC server
  - [ ] Message routing

- [ ] **14.2** TouchOSC layouts
  - [ ] Pre-configured layouts
  - [ ] Bi-directional sync

- [ ] **14.3** Resolume compatibility
  - [ ] Same OSC address space

**Deliverable**: OSC remote control

### Sprint 15: External Input (Week 15)

- [ ] **15.1** NDI research
  - [ ] Possible in browser?
  - [ ] WASM option?

- [ ] **15.2** WebRTC input
  - [ ] Peer connection
  - [ ] Remote video source

- [ ] **15.3** IP camera
  - [ ] MJPEG stream
  - [ ] RTSP (if possible)

**Deliverable**: External video sources

### Sprint 16: Playback Control (Week 16)

- [ ] **16.1** BPM sync
  - [ ] Tap tempo
  - [ ] MIDI clock

- [ ] **16.2** Timeline
  - [ ] Visual timeline
  - [ ] Cue markers

- [ ] **16.3** Playlist
  - [ ] Queue videos
  - [ ] Auto-advance

**Deliverable**: Show-ready playback

---

## 📋 Phase 5: Polish (Weeks 17-20)

### Sprint 17: UI/UX (Week 17-18)

- [ ] **17.1** Theming
  - [ ] Dark mode polished
  - [ ] Light mode option

- [ ] **17.2** Keyboard shortcuts
  - [ ] Common actions mapped
  - [ ] Shortcut customization

- [ ] **17.3** Onboarding
  - [ ] First-run tutorial
  - [ ] Tooltips

- [ ] **17.4** Settings panel
  - [ ] User preferences
  - [ ] Performance settings

### Sprint 18: Documentation (Week 18-19)

- [ ] **18.1** User manual
  - [ ] Getting started
  - [ ] Mapping tutorial
  - [ ] Advanced features

- [ ] **18.2** Video tutorials
  - [ ] Basic setup
  - [ ] First mapping
  - [ ] Audio reactivity

- [ ] **18.3** Example projects
  - [ ] Sample videos
  - [ ] Demo mappings

### Sprint 19: Plugin System (Week 19)

- [ ] **19.1** Plugin architecture
  - [ ] API design
  - [ ] Effect plugin format
  - [ ] Source plugin format

- [ ] **19.2** Plugin developer docs
  - [ ] How to write a plugin
  - [ ] Example plugins

### Sprint 20: Distribution (Week 20)

- [ ] **20.1** Electron wrapper
  - [ ] Desktop app build
  - [ ] Auto-updater

- [ ] **20.2** Website
  - [ ] Marketing site
  - [ ] Download page

- [ ] **20.3** Community
  - [ ] Discord server
  - [ ] GitHub Discussions

---

## 📊 Progress Tracker

| Phase | Total Tasks | Completed | Progress |
|-------|-------------|-----------|----------|
| Phase 1 | 20 | 12 | 60% |
| Phase 2 | 16 | 0 | 0% |
| Phase 3 | 16 | 0 | 0% |
| Phase 4 | 16 | 0 | 0% |
| Phase 5 | 14 | 0 | 0% |
| **TOTAL** | **82** | **12** | **15% |

---

## 🎯 Next Actions

1. **Now**: Test with a real video file and projector — Phase 1 is complete
2. **Next**: Sprint 5 — Effects system (GLSL shader pipeline, blend modes, basic effects)
3. **Soon**: Sprint 6 — Audio reactivity (Web Audio API, FFT, beat detection)

**Current Focus**: Phase 2 — Sprint 5 (Effects System)

---

*Last modified: March 6, 2026*
*Update this file as tasks are completed*
