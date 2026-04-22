import { UjiParams, UjiBlendMode } from './ujiRenderer'

/**
 * Original Uji Presets from https://github.com/doersino/uji
 * 39 presets converted from the original project
 */

export const UJI_PRESETS_FROM_ORIGINAL: Record<string, Partial<UjiParams>> = {
  // === TIFINAGH SCRIPT PRESETS (39 total) ===

  'ⵋ': {
    shape: 4 as const, segments: 5000, radius: 160, iterations: 450,
    rotationSpeed: -0.2, rotationSpeedup: 0, rotationPeriod: 100, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 1, expansionV: 1.003, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: 1.1,
    jitter: 1, wavinessPH: -1, wavinessAH: 2740, wavinessPV: 0.8, wavinessAV: 0.1,
    skipChance: 0, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: 100,
    fadeInSpeed: 0, fadeOutSpeed: 711, fadeOutStart: 0, sawtoothFadeOutSize: 460, sawtoothFadeOutStart: 168,
    thickness: 0.5, lineR: 201, lineG: 96, lineB: 34, lineOpacity: 0.25,
    hueshiftSpeed: 0, bgR: 223, bgG: 216, bgB: 168, bgOpacity: 1,
    blendMode: 'difference' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.15, rotByBeat: 0.30, jitterByHigh: 0.05, jitterByBeat: 0.12, expansionByLow: 0.08, hueshiftByMid: 0, clearOnBeat: false }
  },

  'ⴼ': {
    shape: 2 as const, segments: 8000, radius: 625, iterations: 1388,
    rotationSpeed: 0.025, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 0.994, expansionV: 0.994, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: 0,
    jitter: 1, wavinessPH: -1, wavinessAH: 1300, wavinessPV: -1, wavinessAV: 1,
    skipChance: 0.74, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: -1, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 0.5, lineR: 0, lineG: 0, lineB: 0, lineOpacity: 0.35,
    hueshiftSpeed: 0, bgR: 255, bgG: 255, bgB: 255, bgOpacity: 1,
    blendMode: 'source-over' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.08, rotByBeat: 0.40, jitterByHigh: 0.02, jitterByBeat: 0.18, expansionByLow: 0.05, hueshiftByMid: 0, clearOnBeat: true }
  },

  'ⵛ': {
    shape: 3 as const, segments: 8000, radius: 780, iterations: 297,
    rotationSpeed: -0.4, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 0.988, expansionV: 0.988, expansionHExp: 0, expansionVExp: 0,
    translationH: -0.9, translationV: 0,
    jitter: 4.7, wavinessPH: 239, wavinessAH: 95, wavinessPV: 0.3, wavinessAV: 2,
    skipChance: 0, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: -1, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 0.2, lineR: 232, lineG: 255, lineB: 222, lineOpacity: 1,
    hueshiftSpeed: 0, bgR: 170, bgG: 181, bgB: 180, bgOpacity: 1,
    blendMode: 'overlay' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.20, rotByBeat: 0.25, jitterByHigh: 0.10, jitterByBeat: 0.08, expansionByLow: 0.12, hueshiftByMid: 0.05, clearOnBeat: false }
  },

  'ⵍ': {
    shape: 4 as const, segments: 3000, radius: 230, iterations: 201,
    rotationSpeed: 0.05, rotationSpeedup: 0, rotationPeriod: 9, rotationUntil: -1,
    rotationOriginH: 0.68, rotationOriginV: 1, initialRotation: 0,
    expansionH: 0.999, expansionV: 1.05, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: 0,
    jitter: 0.2, wavinessPH: -1, wavinessAH: 1, wavinessPV: -1, wavinessAV: 1,
    skipChance: 0.5, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: 196, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 2, lineR: 238, lineG: 169, lineB: 54, lineOpacity: 0.75,
    hueshiftSpeed: 0, bgR: 0, bgG: 34, bgB: 28, bgOpacity: 1,
    blendMode: 'color-burn' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.05, rotByBeat: 0.15, jitterByHigh: 0.03, jitterByBeat: 0.05, expansionByLow: 0.20, hueshiftByMid: 0, clearOnBeat: false }
  },

  'ⵟ': {
    shape: 1 as const, segments: 9000, radius: 85, iterations: 192,
    rotationSpeed: -0.4, rotationSpeedup: -0.02, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 1.013, expansionV: 1.01, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: 0,
    jitter: 2, wavinessPH: -1, wavinessAH: 1, wavinessPV: -1, wavinessAV: 1,
    skipChance: 0, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: 153, fadeOutStart: 77, sawtoothFadeOutSize: 170, sawtoothFadeOutStart: 58,
    thickness: 1.8, lineR: 159, lineG: 157, lineB: 161, lineOpacity: 1,
    hueshiftSpeed: 0, bgR: 16, bgG: 12, bgB: 26, bgOpacity: 1,
    blendMode: 'overlay' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.25, rotByBeat: 0.35, jitterByHigh: 0.15, jitterByBeat: 0.20, expansionByLow: 0.06, hueshiftByMid: 0, clearOnBeat: true }
  },

  'ⵥ': {
    shape: 4 as const, segments: 5600, radius: 540, iterations: 201,
    rotationSpeed: -0.9, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 1, expansionV: 1, expansionHExp: 0, expansionVExp: 0,
    translationH: 0.9, translationV: 0,
    jitter: 1, wavinessPH: -1, wavinessAH: 2200, wavinessPV: -1, wavinessAV: 1,
    skipChance: 0.31, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: 172,
    fadeInSpeed: 0, fadeOutSpeed: 201, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 0.5, lineR: 163, lineG: 183, lineB: 201, lineOpacity: 1,
    hueshiftSpeed: 0.4, bgR: 44, bgG: 55, bgB: 78, bgOpacity: 1,
    blendMode: 'color-dodge' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.12, rotByBeat: 0.22, jitterByHigh: 0.08, jitterByBeat: 0.10, expansionByLow: 0.15, hueshiftByMid: 0.08, clearOnBeat: false }
  },

  'ⵣ': {
    shape: 2 as const, segments: 1000, radius: 410, iterations: 192,
    rotationSpeed: -0.55, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 21,
    expansionH: 0.996, expansionV: 0.996, expansionHExp: -10, expansionVExp: 58,
    translationH: 0, translationV: 0,
    jitter: 1.5, wavinessPH: -1, wavinessAH: 336, wavinessPV: -1, wavinessAV: 1,
    skipChance: 0.47, segmentRotation: 0, segmentLengthening: 90, lineSwappiness: 0, revealSpeed: 18,
    fadeInSpeed: 0, fadeOutSpeed: -1, fadeOutStart: 0, sawtoothFadeOutSize: 70, sawtoothFadeOutStart: 72,
    thickness: 0.8, lineR: 200, lineG: 233, lineB: 255, lineOpacity: 1,
    hueshiftSpeed: 0, bgR: 0, bgG: 0, bgB: 0, bgOpacity: 1,
    blendMode: 'source-over' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.18, rotByBeat: 0.28, jitterByHigh: 0.12, jitterByBeat: 0.15, expansionByLow: 0.10, hueshiftByMid: 0, clearOnBeat: false }
  },

  'ⵠ': {
    shape: 1 as const, segments: 4000, radius: 295, iterations: 134,
    rotationSpeed: -0.5, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 150,
    expansionH: 0.995, expansionV: 0.995, expansionHExp: 15, expansionVExp: 183,
    translationH: 0, translationV: 0,
    jitter: 0.5, wavinessPH: 913, wavinessAH: 1586, wavinessPV: 0.2, wavinessAV: 0.3,
    skipChance: 0, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: 129, fadeOutStart: 14, sawtoothFadeOutSize: 70, sawtoothFadeOutStart: 34,
    thickness: 0.8, lineR: 255, lineG: 255, lineB: 255, lineOpacity: 0.8,
    hueshiftSpeed: 0, bgR: 81, bgG: 91, bgB: 103, bgOpacity: 1,
    blendMode: 'source-over' as UjiBlendMode, shadowBlur: 20, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.10, rotByBeat: 0.20, jitterByHigh: 0.20, jitterByBeat: 0.25, expansionByLow: 0.04, hueshiftByMid: 0, clearOnBeat: false }
  },

  'ⵒ': {
    shape: 3 as const, segments: 4000, radius: 910, iterations: 297,
    rotationSpeed: 5, rotationSpeedup: 0, rotationPeriod: 192, rotationUntil: -1,
    rotationOriginH: 0.46, rotationOriginV: 0.22, initialRotation: 0,
    expansionH: 0.96, expansionV: 0.965, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: 0,
    jitter: 0.1, wavinessPH: 432, wavinessAH: 143, wavinessPV: 1.2, wavinessAV: 0.5,
    skipChance: 0, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: 384, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 1.5, lineR: 233, lineG: 243, lineB: 255, lineOpacity: 1,
    hueshiftSpeed: 0, bgR: 0, bgG: 0, bgB: 0, bgOpacity: 1,
    blendMode: 'hard-light' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.30, rotByBeat: 0.45, jitterByHigh: 0.06, jitterByBeat: 0.08, expansionByLow: 0.18, hueshiftByMid: 0.12, clearOnBeat: true }
  },

  'ⴱ': {
    shape: 2 as const, segments: 10510, radius: 160, iterations: 1474,
    rotationSpeed: 0.15, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 0.997, expansionV: 0.997, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: 0,
    jitter: 1, wavinessPH: -1, wavinessAH: 1, wavinessPV: -1, wavinessAV: 1,
    skipChance: 0, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: 37,
    fadeInSpeed: 0, fadeOutSpeed: 1000, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 1, lineR: 0, lineG: 0, lineB: 0, lineOpacity: 0.02,
    hueshiftSpeed: 0, bgR: 255, bgG: 255, bgB: 255, bgOpacity: 1,
    blendMode: 'source-over' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.04, rotByBeat: 0.10, jitterByHigh: 0.02, jitterByBeat: 0.03, expansionByLow: 0.25, hueshiftByMid: 0, clearOnBeat: false }
  },

  'ⴶ': {
    shape: 1 as const, segments: 5600, radius: 540, iterations: 201,
    rotationSpeed: -0.9, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 0.999, expansionV: 0.997, expansionHExp: 0, expansionVExp: 0,
    translationH: 0.9, translationV: 0,
    jitter: 1, wavinessPH: -1, wavinessAH: 2200, wavinessPV: -1, wavinessAV: 1,
    skipChance: 0.31, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: 172,
    fadeInSpeed: 0, fadeOutSpeed: 201, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 0.5, lineR: 192, lineG: 183, lineB: 201, lineOpacity: 1,
    hueshiftSpeed: 0, bgR: 44, bgG: 55, bgB: 78, bgOpacity: 1,
    blendMode: 'color-dodge' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.15, rotByBeat: 0.20, jitterByHigh: 0.05, jitterByBeat: 0.08, expansionByLow: 0.08, hueshiftByMid: 0.15, clearOnBeat: false }
  },

  'ⵅ': {
    shape: 2 as const, segments: 10000, radius: 50, iterations: 259,
    rotationSpeed: -1, rotationSpeedup: 0, rotationPeriod: 500, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 1.01, expansionV: 1.01, expansionHExp: 0, expansionVExp: 0,
    translationH: 1, translationV: 1,
    jitter: 0.1, wavinessPH: -1, wavinessAH: 1, wavinessPV: -1, wavinessAV: 1,
    skipChance: 0.5, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: 302, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 0.3, lineR: 238, lineG: 243, lineB: 230, lineOpacity: 1,
    hueshiftSpeed: 0, bgR: 13, bgG: 13, bgB: 51, bgOpacity: 1,
    blendMode: 'source-over' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.22, rotByBeat: 0.30, jitterByHigh: 0.18, jitterByBeat: 0.12, expansionByLow: 0.06, hueshiftByMid: 0.20, clearOnBeat: false }
  },

  'ⵙ': {
    shape: 1 as const, segments: 5000, radius: 5, iterations: 100,
    rotationSpeed: 2.55, rotationSpeedup: 0, rotationPeriod: 100, rotationUntil: -1,
    rotationOriginH: 0.51, rotationOriginV: 0, initialRotation: 0,
    expansionH: 1.05, expansionV: 1.05, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: 0,
    jitter: 0.1, wavinessPH: 47, wavinessAH: 1, wavinessPV: 8, wavinessAV: 1,
    skipChance: 0, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: -1, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 0.2, lineR: 227, lineG: 173, lineB: 99, lineOpacity: 1,
    hueshiftSpeed: 0, bgR: 177, bgG: 63, bgB: 32, bgOpacity: 1,
    blendMode: 'source-over' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.35, rotByBeat: 0.50, jitterByHigh: 0.25, jitterByBeat: 0.30, expansionByLow: 0.12, hueshiftByMid: 0.10, clearOnBeat: true }
  },

  'ⵢ': {
    shape: 1 as const, segments: 5700, radius: 1275, iterations: 48,
    rotationSpeed: -3.2, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.19, rotationOriginV: 0.53, initialRotation: 0,
    expansionH: 0.97, expansionV: 0.97, expansionHExp: 48, expansionVExp: -13,
    translationH: 0.5, translationV: 2,
    jitter: 8, wavinessPH: -1, wavinessAH: 1, wavinessPV: -1, wavinessAV: 1,
    skipChance: 0.27, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: -1, fadeOutStart: 0, sawtoothFadeOutSize: 0, sawtoothFadeOutStart: 0,
    thickness: 0.4, lineR: 254, lineG: 218, lineB: 66, lineOpacity: 0.8,
    hueshiftSpeed: 10, bgR: 194, bgG: 248, bgB: 190, bgOpacity: 1,
    blendMode: 'source-over' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.08, rotByBeat: 0.12, jitterByHigh: 0.30, jitterByBeat: 0.22, expansionByLow: 0.05, hueshiftByMid: 0.25, clearOnBeat: false }
  },

  'ⵉ': {
    shape: 2 as const, segments: 5000, radius: 150, iterations: 460,
    rotationSpeed: -0.2, rotationSpeedup: 0, rotationPeriod: 100, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 1.002, expansionV: 0.995, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: 0.9,
    jitter: 1.3, wavinessPH: -1, wavinessAH: 576, wavinessPV: -1, wavinessAV: 0.1,
    skipChance: 0, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: -1, fadeOutStart: 0, sawtoothFadeOutSize: 100, sawtoothFadeOutStart: 53,
    thickness: 0.5, lineR: 158, lineG: 180, lineB: 212, lineOpacity: 0.25,
    hueshiftSpeed: 0, bgR: 42, bgG: 47, bgB: 72, bgOpacity: 1,
    blendMode: 'overlay' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.06, rotByBeat: 0.08, jitterByHigh: 0.08, jitterByBeat: 0.06, expansionByLow: 0.30, hueshiftByMid: 0.18, clearOnBeat: false }
  },

  'ⵚ': {
    shape: 4 as const, segments: 10, radius: 750, iterations: 500,
    rotationSpeed: -0.1, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 1, expansionV: 1, expansionHExp: 0, expansionVExp: 0,
    translationH: 0.5, translationV: 3.5,
    jitter: 3.5, wavinessPH: -1, wavinessAH: 1, wavinessPV: -1, wavinessAV: 1,
    skipChance: 0.26, segmentRotation: 0, segmentLengthening: 49, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: 300, fadeOutStart: 200, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 4, lineR: 0, lineG: 15, lineB: 26, lineOpacity: 0.67,
    hueshiftSpeed: 100, bgR: 221, bgG: 223, bgB: 242, bgOpacity: 1,
    blendMode: 'overlay' as UjiBlendMode, shadowBlur: 7, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.40, rotByBeat: 0.35, jitterByHigh: 0.10, jitterByBeat: 0.15, expansionByLow: 0.08, hueshiftByMid: 0.30, clearOnBeat: true }
  },

  'ⴳ': {
    shape: 4 as const, segments: 21, radius: 425, iterations: 500,
    rotationSpeed: 1.5, rotationSpeedup: 0, rotationPeriod: 52, rotationUntil: -1,
    rotationOriginH: 0.16, rotationOriginV: 0.16, initialRotation: 359,
    expansionH: 1.008, expansionV: 1.014, expansionHExp: -17, expansionVExp: -23,
    translationH: 2.6, translationV: 10,
    jitter: 1.4, wavinessPH: 3, wavinessAH: 3, wavinessPV: 0.7, wavinessAV: 1,
    skipChance: 0.1, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: 1,
    fadeInSpeed: 0, fadeOutSpeed: -1, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 3.4, lineR: 213, lineG: 226, lineB: 205, lineOpacity: 0.8,
    hueshiftSpeed: 1, bgR: 33, bgG: 40, bgB: 49, bgOpacity: 1,
    blendMode: 'hard-light' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.12, rotByBeat: 0.18, jitterByHigh: 0.15, jitterByBeat: 0.10, expansionByLow: 0.14, hueshiftByMid: 0.08, clearOnBeat: false }
  },

  'ⵞ': {
    shape: 1 as const, segments: 1000, radius: 80, iterations: 402,
    rotationSpeed: -0.65, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 1.005, expansionV: 1.006, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: 0,
    jitter: 10, wavinessPH: 300, wavinessAH: 1, wavinessPV: -1, wavinessAV: 1,
    skipChance: 0, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: 1000, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 0.5, lineR: 255, lineG: 244, lineB: 204, lineOpacity: 0.05,
    hueshiftSpeed: 0, bgR: 0, bgG: 0, bgB: 17, bgOpacity: 1,
    blendMode: 'source-over' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.05, rotByBeat: 0.06, jitterByHigh: 0.12, jitterByBeat: 0.08, expansionByLow: 0.08, hueshiftByMid: 0.22, clearOnBeat: false }
  },

  'ⵓ': {
    shape: 4 as const, segments: 5000, radius: 195, iterations: 565,
    rotationSpeed: 0.15, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 0.994, expansionV: 1, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: 1.8,
    jitter: 0.1, wavinessPH: 6000, wavinessAH: 6000, wavinessPV: 0.1, wavinessAV: 0.4,
    skipChance: 0, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: 803, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 1, lineR: 255, lineG: 255, lineB: 255, lineOpacity: 0.24,
    hueshiftSpeed: 0, bgR: 53, bgG: 39, bgB: 48, bgOpacity: 1,
    blendMode: 'overlay' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.18, rotByBeat: 0.25, jitterByHigh: 0.35, jitterByBeat: 0.28, expansionByLow: 0.10, hueshiftByMid: 0.15, clearOnBeat: false }
  },

  'ⵘ': {
    shape: 4 as const, segments: 1000, radius: 250, iterations: 278,
    rotationSpeed: 4, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 183,
    expansionH: 0.99, expansionV: 0.983, expansionHExp: 0, expansionVExp: 0,
    translationH: -3.7, translationV: 0,
    jitter: 0.2, wavinessPH: 50, wavinessAH: 40, wavinessPV: -1, wavinessAV: 1,
    skipChance: 0, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: -1, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 0.8, lineR: 173, lineG: 179, lineB: 147, lineOpacity: 1,
    hueshiftSpeed: 0, bgR: 16, bgG: 26, bgB: 27, bgOpacity: 1,
    blendMode: 'hard-light' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.28, rotByBeat: 0.32, jitterByHigh: 0.08, jitterByBeat: 0.12, expansionByLow: 0.16, hueshiftByMid: 0.05, clearOnBeat: true }
  },

  'ⵆ': {
    shape: 3 as const, segments: 400, radius: 325, iterations: 77,
    rotationSpeed: 5, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 41,
    expansionH: 1, expansionV: 1, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: 0,
    jitter: 0, wavinessPH: -1, wavinessAH: 1, wavinessPV: -1, wavinessAV: 1,
    skipChance: 0.25, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: -1, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 2, lineR: 227, lineG: 235, lineB: 255, lineOpacity: 1,
    hueshiftSpeed: 0, bgR: 20, bgG: 23, bgB: 39, bgOpacity: 1,
    blendMode: 'hard-light' as UjiBlendMode, shadowBlur: 5, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.20, rotByBeat: 0.28, jitterByHigh: 0.40, jitterByBeat: 0.35, expansionByLow: 0.06, hueshiftByMid: 0.12, clearOnBeat: false }
  },

  'ⵐ': {
    shape: 2 as const, segments: 1000, radius: 505, iterations: 58,
    rotationSpeed: -0.95, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.65, rotationOriginV: 0.2, initialRotation: 0,
    expansionH: 0.977, expansionV: 0.969, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: 0,
    jitter: 0.1, wavinessPH: 95, wavinessAH: 47, wavinessPV: 1.2, wavinessAV: 2,
    skipChance: 0, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: 35,
    fadeInSpeed: 0, fadeOutSpeed: 384, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 1, lineR: 0, lineG: 0, lineB: 0, lineOpacity: 1,
    hueshiftSpeed: 0, bgR: 255, bgG: 255, bgB: 255, bgOpacity: 1,
    blendMode: 'source-over' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.15, rotByBeat: 0.22, jitterByHigh: 0.22, jitterByBeat: 0.18, expansionByLow: 0.20, hueshiftByMid: 0, clearOnBeat: false }
  },

  'ⵖ': {
    shape: 1 as const, segments: 10000, radius: 200, iterations: 192,
    rotationSpeed: -0.4, rotationSpeedup: 0, rotationPeriod: 201, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.64, initialRotation: 0,
    expansionH: 1.01, expansionV: 1.01, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: -1.3,
    jitter: 0.2, wavinessPH: 1874, wavinessAH: 3557, wavinessPV: 1.2, wavinessAV: 0.9,
    skipChance: 0, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: 71, fadeOutStart: 82, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 1, lineR: 172, lineG: 102, lineB: 194, lineOpacity: 1,
    hueshiftSpeed: 0, bgR: 229, bgG: 210, bgB: 136, bgOpacity: 1,
    blendMode: 'color-burn' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.08, rotByBeat: 0.15, jitterByHigh: 0.28, jitterByBeat: 0.20, expansionByLow: 0.12, hueshiftByMid: 0.28, clearOnBeat: false }
  },

  'ⵗ': {
    shape: 4 as const, segments: 4000, radius: 165, iterations: 316,
    rotationSpeed: -0.45, rotationSpeedup: 0, rotationPeriod: 33, rotationUntil: 220,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 3,
    expansionH: 1, expansionV: 1.022, expansionHExp: 0, expansionVExp: -6,
    translationH: 2.5, translationV: -5,
    jitter: 0.4, wavinessPH: 1634, wavinessAH: 864, wavinessPV: 0.1, wavinessAV: 0.2,
    skipChance: 0.2, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: 66,
    fadeInSpeed: 0, fadeOutSpeed: -1, fadeOutStart: 0, sawtoothFadeOutSize: 120, sawtoothFadeOutStart: 183,
    thickness: 0.3, lineR: 218, lineG: 223, lineB: 218, lineOpacity: 0.7,
    hueshiftSpeed: 0, bgR: 66, bgG: 69, bgB: 71, bgOpacity: 1,
    blendMode: 'source-over' as UjiBlendMode, shadowBlur: 10, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.25, rotByBeat: 0.30, jitterByHigh: 0.15, jitterByBeat: 0.22, expansionByLow: 0.18, hueshiftByMid: 0.10, clearOnBeat: true }
  },

  'ⴵ': {
    shape: 4 as const, segments: 1000, radius: 50, iterations: 1005,
    rotationSpeed: -2.5, rotationSpeedup: 0, rotationPeriod: 384, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 0.98, expansionV: 1.01, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: 0,
    jitter: 0.2, wavinessPH: 287, wavinessAH: 576, wavinessPV: 3, wavinessAV: 3,
    skipChance: 0, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: 1000, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 1, lineR: 196, lineG: 219, lineB: 255, lineOpacity: 0.16,
    hueshiftSpeed: 0, bgR: 7, bgG: 10, bgB: 16, bgOpacity: 1,
    blendMode: 'source-over' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.10, rotByBeat: 0.12, jitterByHigh: 0.45, jitterByBeat: 0.40, expansionByLow: 0.04, hueshiftByMid: 0.20, clearOnBeat: false }
  },

  'ⴻ': {
    shape: 3 as const, segments: 2900, radius: 275, iterations: 335,
    rotationSpeed: -0.2, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 238,
    expansionH: 0.999, expansionV: 0.985, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: -3,
    jitter: 0.7, wavinessPH: 150, wavinessAH: 24, wavinessPV: 0.1, wavinessAV: 0.1,
    skipChance: 0, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: 336, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 0.5, lineR: 204, lineG: 181, lineB: 145, lineOpacity: 0.66,
    hueshiftSpeed: 0, bgR: 26, bgG: 22, bgB: 47, bgOpacity: 1,
    blendMode: 'source-over' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.06, rotByBeat: 0.08, jitterByHigh: 0.18, jitterByBeat: 0.14, expansionByLow: 0.16, hueshiftByMid: 0.25, clearOnBeat: false }
  },

  'ⵡ': {
    shape: 3 as const, segments: 1000, radius: 180, iterations: 460,
    rotationSpeed: -0.95, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 0.995, expansionV: 0.997, expansionHExp: 17, expansionVExp: -25,
    translationH: 0, translationV: 0,
    jitter: 0.2, wavinessPH: -1, wavinessAH: 1, wavinessPV: -1, wavinessAV: 1,
    skipChance: 0, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: 105, fadeOutStart: 34, sawtoothFadeOutSize: 120, sawtoothFadeOutStart: 10,
    thickness: 1.5, lineR: 194, lineG: 202, lineB: 255, lineOpacity: 1,
    hueshiftSpeed: 0, bgR: 33, bgG: 33, bgB: 89, bgOpacity: 1,
    blendMode: 'hard-light' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.22, rotByBeat: 0.26, jitterByHigh: 0.20, jitterByBeat: 0.16, expansionByLow: 0.14, hueshiftByMid: 0.18, clearOnBeat: false }
  },

  'ⴸ': {
    shape: 3 as const, segments: 6400, radius: 800, iterations: 402,
    rotationSpeed: 0.2, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 0.99, expansionV: 0.998, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: 0,
    jitter: 3.4, wavinessPH: -1, wavinessAH: 747, wavinessPV: -1, wavinessAV: 1,
    skipChance: 0, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: 403, fadeOutStart: 0, sawtoothFadeOutSize: 410, sawtoothFadeOutStart: 0,
    thickness: 1, lineR: 175, lineG: 141, lineB: 140, lineOpacity: 0.27,
    hueshiftSpeed: 0, bgR: 5, bgG: 23, bgB: 37, bgOpacity: 1,
    blendMode: 'hard-light' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.14, rotByBeat: 0.18, jitterByHigh: 0.32, jitterByBeat: 0.26, expansionByLow: 0.22, hueshiftByMid: 0.08, clearOnBeat: false }
  },

  'ⴲ': {
    shape: 1 as const, segments: 11000, radius: 925, iterations: 603,
    rotationSpeed: 0.7, rotationSpeedup: 0, rotationPeriod: 170, rotationUntil: -1,
    rotationOriginH: 0.25, rotationOriginV: 0.25, initialRotation: 0,
    expansionH: 0.994, expansionV: 0.994, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: 0,
    jitter: 8, wavinessPH: -1, wavinessAH: 1300, wavinessPV: -1, wavinessAV: 1,
    skipChance: 0.74, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: -1, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 0.5, lineR: 172, lineG: 168, lineB: 168, lineOpacity: 0.04,
    hueshiftSpeed: 0, bgR: 255, bgG: 238, bgB: 239, bgOpacity: 1,
    blendMode: 'difference' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.04, rotByBeat: 0.06, jitterByHigh: 0.08, jitterByBeat: 0.05, expansionByLow: 0.06, hueshiftByMid: 0.15, clearOnBeat: false }
  },

  'ⵌ': {
    shape: 1 as const, segments: 5000, radius: 100, iterations: 508,
    rotationSpeed: 4, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 1.05, expansionV: 0.958, expansionHExp: 0, expansionVExp: 0,
    translationH: 10, translationV: 10,
    jitter: 0.2, wavinessPH: -1, wavinessAH: 1, wavinessPV: -1, wavinessAV: 1,
    skipChance: 0.8, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 5, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: -1, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 1, lineR: 126, lineG: 164, lineB: 240, lineOpacity: 1,
    hueshiftSpeed: 0, bgR: 44, bgG: 55, bgB: 96, bgOpacity: 1,
    blendMode: 'screen' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.30, rotByBeat: 0.40, jitterByHigh: 0.50, jitterByBeat: 0.45, expansionByLow: 0.10, hueshiftByMid: 0.20, clearOnBeat: true }
  },

  'ⴷ': {
    shape: 1 as const, segments: 1300, radius: 5, iterations: 220,
    rotationSpeed: -1, rotationSpeedup: 0, rotationPeriod: 60, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 1.037, expansionV: 1.037, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: 0,
    jitter: 0, wavinessPH: 358, wavinessAH: 415, wavinessPV: 0.4, wavinessAV: 0.3,
    skipChance: 0.1, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: 13,
    fadeInSpeed: 0, fadeOutSpeed: -1, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 2, lineR: 159, lineG: 204, lineB: 148, lineOpacity: 1,
    hueshiftSpeed: 0, bgR: 11, bgG: 15, bgB: 20, bgOpacity: 1,
    blendMode: 'source-over' as UjiBlendMode, shadowBlur: 30, lineCap: 'round', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.12, rotByBeat: 0.20, jitterByHigh: 0.15, jitterByBeat: 0.12, expansionByLow: 0.24, hueshiftByMid: 0.18, clearOnBeat: false }
  },

  'ⵎ': {
    shape: 4 as const, segments: 4000, radius: 315, iterations: 1206,
    rotationSpeed: 0.1, rotationSpeedup: 0, rotationPeriod: 403, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 1, expansionV: 1, expansionHExp: 0, expansionVExp: 0,
    translationH: -0.1, translationV: 1,
    jitter: 0.4, wavinessPH: -1, wavinessAH: 3749, wavinessPV: -1, wavinessAV: 0.1,
    skipChance: 0, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: -1, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 0.3, lineR: 53, lineG: 0, lineB: 12, lineOpacity: 0.3,
    hueshiftSpeed: 0, bgR: 244, bgG: 242, bgB: 222, bgOpacity: 1,
    blendMode: 'source-over' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.18, rotByBeat: 0.25, jitterByHigh: 0.25, jitterByBeat: 0.20, expansionByLow: 0.08, hueshiftByMid: 0.30, clearOnBeat: false }
  },

  'ⴿ': {
    shape: 1 as const, segments: 2000, radius: 15, iterations: 58,
    rotationSpeed: 2.75, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 1.05, expansionV: 1.05, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: 0,
    jitter: 10, wavinessPH: 432, wavinessAH: 47, wavinessPV: 5, wavinessAV: 5,
    skipChance: 0.5, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: -1, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 0.2, lineR: 130, lineG: 163, lineB: 199, lineOpacity: 1,
    hueshiftSpeed: 0, bgR: 16, bgG: 21, bgB: 60, bgOpacity: 1,
    blendMode: 'color-dodge' as UjiBlendMode, shadowBlur: 7.5, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.20, rotByBeat: 0.22, jitterByHigh: 0.18, jitterByBeat: 0.15, expansionByLow: 0.12, hueshiftByMid: 0.25, clearOnBeat: false }
  },

  'ⵄ': {
    shape: 1 as const, segments: 20, radius: 450, iterations: 150,
    rotationSpeed: -1, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 0.99, expansionV: 0.99, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: 0,
    jitter: 0, wavinessPH: -1, wavinessAH: 1, wavinessPV: -1, wavinessAV: 1,
    skipChance: 0.8, segmentRotation: 210, segmentLengthening: 90, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: -1, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 4, lineR: 255, lineG: 255, lineB: 255, lineOpacity: 0.66,
    hueshiftSpeed: 0, bgR: 31, bgG: 32, bgB: 47, bgOpacity: 1,
    blendMode: 'source-over' as UjiBlendMode, shadowBlur: 40, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.16, rotByBeat: 0.28, jitterByHigh: 0.22, jitterByBeat: 0.25, expansionByLow: 0.16, hueshiftByMid: 0.12, clearOnBeat: true }
  },

  'ⵇ': {
    shape: 4 as const, segments: 100, radius: 490, iterations: 240,
    rotationSpeed: -4.65, rotationSpeedup: 0, rotationPeriod: 730, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 0.995, expansionV: 0.995, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: 0,
    jitter: 0, wavinessPH: -1, wavinessAH: 1, wavinessPV: -1, wavinessAV: 1,
    skipChance: 0.5, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: -1, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 4, lineR: 255, lineG: 255, lineB: 255, lineOpacity: 0.66,
    hueshiftSpeed: 0, bgR: 89, bgG: 107, bgB: 72, bgOpacity: 1,
    blendMode: 'overlay' as UjiBlendMode, shadowBlur: 0, lineCap: 'square', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.24, rotByBeat: 0.32, jitterByHigh: 0.30, jitterByBeat: 0.28, expansionByLow: 0.14, hueshiftByMid: 0.22, clearOnBeat: false }
  },

  'ⴾ': {
    shape: 1 as const, segments: 8000, radius: 100, iterations: 508,
    rotationSpeed: 0.3, rotationSpeedup: 0, rotationPeriod: 66, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.4, initialRotation: 357,
    expansionH: 1.007, expansionV: 1.007, expansionHExp: 0, expansionVExp: 0,
    translationH: 4, translationV: 0,
    jitter: 0.5, wavinessPH: 1970, wavinessAH: 2643, wavinessPV: 0.2, wavinessAV: 0.2,
    skipChance: 0, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 50, fadeOutSpeed: 658, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 0.8, lineR: 196, lineG: 174, lineB: 211, lineOpacity: 0.8,
    hueshiftSpeed: -5, bgR: 4, bgG: 4, bgB: 12, bgOpacity: 1,
    blendMode: 'color-dodge' as UjiBlendMode, shadowBlur: 15, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.08, rotByBeat: 0.12, jitterByHigh: 0.12, jitterByBeat: 0.10, expansionByLow: 0.20, hueshiftByMid: 0.28, clearOnBeat: false }
  },

  'ⴴ': {
    shape: 2 as const, segments: 100, radius: 640, iterations: 450,
    rotationSpeed: -0.35, rotationSpeedup: 0, rotationPeriod: 600, rotationUntil: -1,
    rotationOriginH: 0.12, rotationOriginV: 0.13, initialRotation: 0,
    expansionH: 0.989, expansionV: 0.989, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: 0,
    jitter: 1, wavinessPH: 18, wavinessAH: 47, wavinessPV: 0.1, wavinessAV: 0.1,
    skipChance: 0.67, segmentRotation: 500, segmentLengthening: 30, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: 1000, fadeOutStart: 0, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 4, lineR: 188, lineG: 72, lineB: 0, lineOpacity: 1,
    hueshiftSpeed: 0, bgR: 38, bgG: 18, bgB: 10, bgOpacity: 1,
    blendMode: 'color-dodge' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.28, rotByBeat: 0.35, jitterByHigh: 0.20, jitterByBeat: 0.22, expansionByLow: 0.18, hueshiftByMid: 0.15, clearOnBeat: true }
  },

  'ⵁ': {
    shape: 1 as const, segments: 10000, radius: 100, iterations: 470,
    rotationSpeed: 0, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 1.002, expansionV: 1.002, expansionHExp: 0, expansionVExp: 0,
    translationH: 0.6, translationV: 0,
    jitter: 0.5, wavinessPH: -1, wavinessAH: 1, wavinessPV: -1, wavinessAV: 1,
    skipChance: 0.5, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: -1,
    fadeInSpeed: 0, fadeOutSpeed: 33, fadeOutStart: 420, sawtoothFadeOutSize: -1, sawtoothFadeOutStart: 0,
    thickness: 0.5, lineR: 0, lineG: 10, lineB: 66, lineOpacity: 0.1,
    hueshiftSpeed: 0, bgR: 255, bgG: 255, bgB: 255, bgOpacity: 1,
    blendMode: 'source-over' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.14, rotByBeat: 0.18, jitterByHigh: 0.18, jitterByBeat: 0.16, expansionByLow: 0.22, hueshiftByMid: 0.20, clearOnBeat: false }
  },

  'ⵃ': {
    shape: 2 as const, segments: 1000, radius: 65, iterations: 259,
    rotationSpeed: -0.1, rotationSpeedup: 0, rotationPeriod: -1, rotationUntil: -1,
    rotationOriginH: 0.5, rotationOriginV: 0.5, initialRotation: 0,
    expansionH: 1, expansionV: 1, expansionHExp: 0, expansionVExp: 0,
    translationH: 0, translationV: 0,
    jitter: 1, wavinessPH: 816, wavinessAH: 336, wavinessPV: 3.2, wavinessAV: 1,
    skipChance: 0, segmentRotation: 0, segmentLengthening: 100, lineSwappiness: 0, revealSpeed: 25,
    fadeInSpeed: 0, fadeOutSpeed: 225, fadeOutStart: 0, sawtoothFadeOutSize: 140, sawtoothFadeOutStart: 48,
    thickness: 0.4, lineR: 179, lineG: 179, lineB: 179, lineOpacity: 1,
    hueshiftSpeed: 0, bgR: 44, bgG: 44, bgB: 44, bgOpacity: 1,
    blendMode: 'color-dodge' as UjiBlendMode, shadowBlur: 0, lineCap: 'butt', canvasNoise: 0,
    animate: true, itersPerFrame: 3,
    audioMod: { rotByLow: 0.22, rotByBeat: 0.30, jitterByHigh: 0.28, jitterByBeat: 0.24, expansionByLow: 0.16, hueshiftByMid: 0.25, clearOnBeat: false }
  },
}
