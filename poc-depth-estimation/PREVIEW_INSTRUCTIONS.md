# Depth Estimation POC Preview

## Quick Start

```bash
cd ~/ClaudeVault/30-projects-active/2026-openvj/poc-depth-estimation
npx vite --port 5177
```

Then open http://localhost:5177 in Chrome/Edge with WebGPU enabled.

## Requirements

- Chrome or Edge browser (WebGPU required)
- Web camera access
- ~50MB download on first run (Depth Anything V2 model)

## Controls

- **Voxel Resolution**: 32-128 grid size (3K-12K voxels)
- **Extrusion Scale**: Depth intensity multiplier
- **Point Size**: Voxel size adjustment
- **Render Mode**: Points or wireframe
- **Color by Depth**: Toggle gradient coloring
- **Audio Reactivity**: Make depth react to microphone audio

## Troubleshooting

If you see "WebGPU not available":
1. Enable chrome://flags/#enable-webgpu
2. Restart browser
3. Check chrome://gpu for WebGPU status

## Performance

| Resolution | Voxels | Expected FPS |
|-----------|--------|--------------|
| 64x48     | 3,072  | 60+          |
| 80x60     | 4,800  | 30-45        |
| 100x75    | 7,500  | 25-35        |
| 128x96    | 12,288 | 15-25        |

## POC Versions

- `poc-depth/` - Depth Anything V2 + Three.js voxels
- `poc-transformers/` - Standard transformers.js depth
