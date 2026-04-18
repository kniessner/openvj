/**
 * Smooth numeric tween between the current surface state and a target scene.
 * Runs its own RAF loop and writes directly to the Zustand store.
 */

import { useSurfaceStore } from '../stores/surfaceStore'
import type { Surface } from '../stores/surfaceStore'

type NumericSurfaceProp = {
  [K in keyof Surface]: Surface[K] extends number ? K : never
}[keyof Surface]

const LERP_PROPS = [
  'opacity', 'brightness', 'contrast',
  'hue', 'saturation',
  'zoom', 'rotation',
  'warpAmp', 'warpFreq', 'chromaAb', 'pixelate', 'vignette',
] as const satisfies readonly NumericSurfaceProp[]

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/** Smooth ease-in-out */
function ease(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

let _rafId: number | null = null

/**
 * Tween all matching surfaces from their current state to `targetSurfaces`.
 * Matched by surface ID. Surfaces that exist only in the target appear instantly.
 *
 * @param targetSurfaces  The desired end state.
 * @param durationMs      Transition length in ms. 0 = instant cut.
 */
export function transitionToScene(targetSurfaces: Surface[], durationMs: number): void {
  if (_rafId !== null) {
    cancelAnimationFrame(_rafId)
    _rafId = null
  }

  if (durationMs <= 0) {
    // Instant cut — use importConfig so history is recorded
    useSurfaceStore.getState().importConfig(targetSurfaces)
    return
  }

  const fromSurfaces = [...useSurfaceStore.getState().surfaces]

  // Save current state to history before tweening starts
  useSurfaceStore.setState((s) => ({
    _history: [...s._history.slice(-49), fromSurfaces],
    _future:  [],
  }))

  const startTime = performance.now()

  const step = (now: number) => {
    const t      = Math.min((now - startTime) / durationMs, 1)
    const eased  = ease(t)

    const interpolated: Surface[] = targetSurfaces.map((target) => {
      const from = fromSurfaces.find((f) => f.id === target.id)
      if (!from) return target // new surface: appear at final values

      // Start with target for all non-numeric / non-corner props
      const result: Surface = { ...target }

      // Lerp corners — only when both surfaces have the same count
      if (from.corners.length === target.corners.length) {
        result.corners = target.corners.map((tc, i) => ({
          ...tc,
          x: lerp(from.corners[i].x, tc.x, eased),
          y: lerp(from.corners[i].y, tc.y, eased),
        }))
      }

      // Lerp numeric FX props
      for (const prop of LERP_PROPS) {
        const a = from[prop]
        const b = target[prop]
        result[prop] = lerp(a, b, eased)
      }

      return result
    })

    // Direct state update — bypasses history (history was pushed at start)
    useSurfaceStore.setState({ surfaces: interpolated })

    if (t < 1) {
      _rafId = requestAnimationFrame(step)
    } else {
      _rafId = null
    }
  }

  _rafId = requestAnimationFrame(step)
}

/** Cancel any in-progress transition immediately. */
export function cancelTransition(): void {
  if (_rafId !== null) {
    cancelAnimationFrame(_rafId)
    _rafId = null
  }
}
