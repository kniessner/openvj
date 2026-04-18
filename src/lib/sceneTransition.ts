import type { Surface } from '../stores/surfaceStore'

/**
 * Transition from current surfaces to scene surfaces with animation
 * @param targetSurfaces - The surfaces to transition to
 * @param durationMs - Transition duration in milliseconds
 */
export function transitionToScene(targetSurfaces: Surface[], durationMs: number = 1000): void {
  // TODO: Implement smooth scene transition with animations
  // For now, just log and do nothing (surfaces are managed by the store)
  console.log('Scene transition:', targetSurfaces.length, 'surfaces,', durationMs, 'ms')
}
