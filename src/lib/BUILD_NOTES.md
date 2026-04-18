# Build Notes - Missing Implementation Files

## Status

The following lib files were stubbed for initial publication but need proper implementations:

### 1. `ujiRenderer.ts` - Partial Implementation
**Status:** Basic interface defined, full rendering logic needed

**Missing exports:**
- `renderUji()` - Canvas 2D rendering function
- `UjiAnimator` - Animation controller class
- `UjiAudioMod` - Audio modulation parameters interface
- `DEFAULT_UJI_PARAMS` - Should be `defaultUjiParams` (naming mismatch)
- `DEFAULT_AUDIO_MOD` - Audio modulation defaults
- `UJI_PRESETS` - Preset collection

**Current:** Only `UjiParams` interface and `generateUjiShader()` implemented

**Required properties in UjiParams:**
All 36 parameters are now defined (see interface)

**Required properties in audio mod:**
- rotByLow, rotByBeat
- jitterByHigh, jitterByBeat
- expansionByLow
- hueshiftByMid
- clearOnBeat

### 2. `assetTextureManager.ts` - Partial Implementation
**Status:** Basic texture loading implemented

**Missing methods:**
- `reload()` - Reload/refresh a texture
- `getTexture()` - Get texture by asset ID

### 3. `audioEngine.ts` - Complete
**Status:** ✅ Fully implemented

### 4. `midiEngine.ts` - Complete
**Status:** ✅ Fully implemented

### 5. `sceneTransition.ts` - Stub Only
**Status:** Empty stub, transitions not animated yet

### 6. `projectIO.ts` - Complete
**Status:** ✅ Fully implemented

---

## Workaround for Initial Publication

**Option 1: Comment out Uji features temporarily**
- Comment out UjiGenerator import in App.tsx
- Remove Uji-related UI elements
- Ship without Uji generator initially

**Option 2: Find original implementations**
- Check git history
- Check other branches
- Recover from backups

**Option 3: Reimplement from scratch**
- Use UjiGenerator.tsx as specification
- Implement full canvas 2D Uji rendering
- Add animation system
- Add audio modulation

---

## Next Steps

1. Decide on approach (comment out vs. reimplement)
2. Complete remaining lib files
3. Test build
4. Publish to GitHub

**For now, these stub files allow ESLint to pass but build will fail due to missing exports.**
