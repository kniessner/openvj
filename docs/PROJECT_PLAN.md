# OpenVJ Project Plan

## Project Overview

**OpenVJ** aims to be the first truly open-source, web-based projection mapping and VJ software that's as powerful as MadMapper but accessible to everyone.

### Problem Statement

Current options for projection mapping:
- **MadMapper** ($500+) - Expensive, macOS only
- **Resolume Arena** ($800+) - Expensive, steep learning curve
- **TouchDesigner** ($600+) - Expensive, very steep learning curve
- **ofxPiMapper** - RPi only, limited features
- **Custom solutions** - Time-consuming to build

**OpenVJ fills the gap**: powerful + free + cross-platform + web-based

## Target Audience

1. **Visual Artists** - VJs, DJs, event producers
2. **Installation Artists** - Museums, galleries, public art
3. **Musicians** - Live performers needing visuals
4. **Hackers/Makers** - DIY projection projects
5. **Educators** - Teaching projection mapping

## Success Metrics

| Phase | Timeline | Milestone |
|-------|----------|-------------|
| Proof of Concept | Month 1-2 | Single projector, basic mapping |
| MVP | Month 3-4 | Multi-surface, video playback |
| Release v1.0 | Month 5-6 | Audio reactive, MIDI, usable for shows |
| v1.5 | Month 7-9 | Multi-projector, NDI, plugins |
| v2.0 | Month 10-12 | Industry competitive |

## Technical Architecture

```
┌─────────────────────────────────────────────────┐
│                  OpenVJ Layer                   │
├─────────────────────────────────────────────────┤
│  ┌───────────┐  ┌───────────┐  ┌───────────┐ │
│  │   Media   │  │   Audio   │  │   MIDI    │ │
│  │  Engine   │  │  Engine   │  │   OSC     │ │
│  └───────────┘  └───────────┘  └───────────┘ │
├─────────────────────────────────────────────────┤
│                Three.js Layer                   │
│     (Scenes, Cameras, FBOs, Shaders)          │
├─────────────────────────────────────────────────┤
│               WebGL/WebGPU Layer                │
├─────────────────────────────────────────────────┤
│              Browser/Platform                   │
└─────────────────────────────────────────────────┘
```

## Phase Breakdown

### Phase 1: Foundation (Weeks 1-4)
**Goal**: Get something on screen, project video onto a surface

#### Sprint 1: Three.js Setup
- [ ] Project scaffolding (Vite + React + Three.js)
- [ ] Basic scene with camera controls
- [ ] Renderer with multiple outputs
- [ ] Simple plane geometry mapping

#### Sprint 2: Video Integration
- [ ] HTML5 video element wrapper
- [ ] VideoTexture for Three.js
- [ ] Basic playback controls (play/pause/scrub)
- [ ] Support multiple video formats

#### Sprint 3: Projection Mapping MVP
- [ ] Corner pin distortion (homography)
- [ ] Quad warping (4-point transform)
- [ ] Mesh-based surface definition
- [ ] Save/load mapping configurations

#### Sprint 4: UI Foundation
- [ ] React component architecture
- [ ] Timeline/scrubber component
- [ ] Surface editor (drag handles)
- [ ] Simple preset system

### Phase 2: Features (Weeks 5-8)
**Goal**: Make it usable for real shows

#### Sprint 5: Effects System
- [ ] GLSL shader pipeline
- [ ] Blend modes (add/multiply/screen/etc)
- [ ] Basic effects (blur, kaleidoscope, delay)
- [ ] Effect chain/routing

#### Sprint 6: Audio Reactivity
- [ ] Web Audio API integration
- [ ] FFT analysis (frequency bins)
- [ ] Beat detection
- [ ] Audio-reactive uniforms for shaders

#### Sprint 7: Content Sources
- [ ] Image loading
- [ ] GIF/WebP animation support
- [ ] Canvas/SVG as source
- [ ] Screen capture (getDisplayMedia)

#### Sprint 8: Layer System
- [ ] Multiple layers
- [ ] Layer blending/compositing
- [ ] Layer masks
- [ ] Layer transform (position/scale/rotate)

### Phase 3: Performance (Weeks 9-12)
**Goal**: Optimize for 60fps, multiple outputs

#### Sprint 9: Multi-Projector
- [ ] Multiple render targets
- [ ] Edge blending between projectors
- [ ] Output window management
- [ ] Fullscreen across displays

#### Sprint 10: Performance
- [ ] FBO (Frame Buffer Object) caching
- [ ] WebGPU backend option
- [ ] Texture pooling
- [ ] Render loop optimization

#### Sprint 11: Advanced Mapping
- [ ] Mesh warping (bezier curves)
- [ ] Soft edge masking
- [ ] Mask editor (draw shapes)
- [ ] Grid-based warping

#### Sprint 12: State Management
- [ ] Project save/load (JSON)
- [ ] Undo/redo system
- [ ] Preset management
- [ ] Scene transitions

### Phase 4: Hardware Integration (Weeks 13-16)
**Goal**: Connect to real VJ hardware

#### Sprint 13: MIDI Support
- [ ] Web MIDI API integration
- [ ] MIDI learn functionality
- [ ] Map controllers to parameters
- [ ] Common controller presets (APC40, Launchpad)

#### Sprint 14: OSC Support
- [ ] OSC client (for sending)
- [ ] OSC server (for receiving)
- [ ] TouchOSC integration
- [ ] Resolume/Catalyst compatibility

#### Sprint 15: External Input
- [ ] NDI input/output (if possible in browser)
- [ ] Syphon/Spout (macOS/Windows)
- [ ] WebRTC input
- [ ] IP camera support

#### Sprint 16: Playback Control
- [ ] BPM sync
- [ ] Timeline/timeline scrubbing
- [ ] Cue points/markers
- [ ] Playlist/queue system

### Phase 5: Polish & Distribution (Weeks 17-20)
**Goal**: Production ready, documented, community

#### Sprint 17: UI Polish
- [ ] Dark/light theme
- [ ] Responsive layout
- [ ] Keyboard shortcuts
- [ ] Onboarding/tutorial

#### Sprint 18: Documentation
- [ ] User manual
- [ ] API documentation
- [ ] Video tutorials
- [ ] Example projects

#### Sprint 19: Plugin System
- [ ] Plugin architecture
- [ ] Third-party effects API
- [ ] Plugin marketplace (simple)
- [ ] Developer docs

#### Sprint 20: Distribution
- [ ] Electron app wrapper
- [ ] Auto-updater
- [ ] Website/marketing
- [ ] Community building

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| WebGL performance limits | Medium | High | WebGPU fallback, optimization |
| Cross-browser issues | High | Medium | Testing matrix, polyfills |
| Audio sync issues | Medium | High | Web Audio best practices |
| Multi-display API limitations | Medium | High | Electron wrapper as fallback |
| Steep Three.js learning curve | Low | Medium | Good documentation |

## Resource Requirements

### Development Time
- **Solo developer**: 20 weeks (5 months) for MVP
- **Two developers**: 10-12 weeks
- **Recommended**: 1 full-time + community contributions

### Hardware for Testing
- Minimum: Laptop + projector
- Recommended: Desktop + 2-3 projectors
- Nice to have: MIDI controller, multi-monitor setup

### Third-Party Libraries

| Library | Purpose | License |
|---------|---------|---------|
| three.js | 3D rendering | MIT |
| @react-three/fiber | React + Three.js | MIT |
| @react-three/drei | Three.js helpers | MIT |
| zustand | State management | MIT |
| vite | Build tool | MIT |
| tailwindcss | Styling | MIT |
| webmidi | MIDI support | Apache 2.0 |
| osc-js | OSC support | MIT |

## Success Criteria

### MVP Success (Phase 1)
- [ ] Can load and play a video
- [ ] Can map to a quad surface
- [ ] Can save/load the mapping
- [ ] Runs at 30fps on mid-range hardware

### v1.0 Success (Phase 2-3)
- [ ] Multi-layer compositing
- [ ] Audio reactivity
- [ ] Multiple outputs
- [ ] Used in at least one real show

### v2.0 Success (Phase 4-5)
- [ ] MIDI/OSC stable
- [ ] Plugin system working
- [ ] 1000+ GitHub stars
- [ ] Active Discord community

## Next Steps

1. **This week**: Set up project, three.js scene
2. **Next week**: Video playback integration
3. **Week 3**: Basic mapping UI
4. **Week 4**: Test with real projector

See [TODO.md](../TODO.md) for detailed task list.
