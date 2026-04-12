# OpenVJ Quickstart Guide

Get OpenVJ running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A modern browser (Chrome/Firefox/Edge/Safari)
- Optional: A projector or second display

## Installation

```bash
# Navigate to project
cd "$CLAUDE_VAULT/30-projects-active/2026-openvj"

# Install dependencies (first time only)
npm install

# Start development server
npm run dev

# Open in browser (or click the link shown)
open http://localhost:5173
```

You should see:
- A spinning blue cube
- Sidebar on the left (Media, Surfaces panels)
- Toolbar at the top (Play/Pause buttons)
- Timeline at the bottom

## What You Just Built

```
┌─────────────────────────────────────────────────┐
│  OpenVJ v0.1.0                        [≡]       │  ← Header with menu
├──────────┬──────────────────────────────────────┤
│ MEDIA    │                                      │
│ [Drop    │         🎲 Spinning Cube            │  ← Three.js canvas
│  files   │                                      │
│  here]   │    ← Left click drag to rotate    │
│          │    ← Scroll to zoom                 │
├──────────┤                                      │
│ SURFACES │                                      │
│ ┌──────┐ │                                      │
│ │Quad 1│ │                                      │
│ └──────┘ │                                      │
│ [+Add  ] │                                      │
├──────────┼──────────────────────────────────────┤
│ ▶ Play   │  00:00:00 [──────●──────] 00:00:00  │  ← Timeline
└──────────┴──────────────────────────────────────┘
```

## Next Steps

### 1. Load a Video (Next Task)

Replace the spinning cube with video:
```bash
# Edit this file:
open src/App.tsx
```

Add video texture (see TODO.md Sprint 2)

### 2. Map to Quad

Create top-left quad and drag corners to screen edges.

### 3. Test with Projector

```bash
# Create fullscreen on second display
# Press 'F' or click fullscreen button
```

## File Structure

```
openvj/
├── src/
│   ├── App.tsx          ← Main UI (edit this!)
│   ├── main.tsx         ← Entry point
│   ├── index.css        ← Styles
│   └── ...              ← (components to add)
├── docs/
│   ├── PROJECT_PLAN.md  ← Full roadmap
│   └── ARCHITECTURE.md  ← Tech details
├── TODO.md              ← Task list
└── README.md            ← Overview
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |

## Troubleshooting

**Port 5173 already in use?**
```bash
npm run dev -- --port 3000
```

**WebGL not working?**
- Update graphics drivers
- Enable hardware acceleration in browser
- Try different browser

**Hot reload not working?**
- Check console for errors
- Try `Cmd+Shift+R` (Mac) or `Ctrl+F5` (Windows) to hard refresh

## Resources

- **Three.js Docs**: https://threejs.org/docs/
- **R3F Docs**: https://docs.pmnd.rs/react-three-fiber
- **React Docs**: https://react.dev
- **OpenVJ Plan**: Open `docs/PROJECT_PLAN.md`
- **Tasks**: Open `TODO.md`

## Your First Tasks (from TODO.md)

**Sprint 1.1**: Project setup ✅ (DONE!)
**Sprint 1.2**: Video integration ← Start here!

1. Create `src/components/VideoPlayer.tsx`
2. Load video element
3. Create Three.js VideoTexture
4. Replace cube with video plane

See `TODO.md` for complete task list.

---

**Happy VJing!** 🎬✨
