/**
 * Project file export / import.
 *
 * What IS saved:
 *   - surfaces (all properties, corner positions, FX settings)
 *   - scenes (layout snapshots + thumbnails)
 *   - user assets that carry self-contained data: shader code + Uji params
 *
 * What is NOT saved:
 *   - video / image assets (blob URLs are ephemeral — re-import media files after loading a project)
 *   - webcam / screencapture (live inputs)
 *   - built-in assets (always available)
 *   - MIDI bindings (persisted separately in localStorage)
 */

import type { Surface } from '../stores/surfaceStore'
import type { Scene }   from '../stores/sceneStore'
import type { Asset }   from '../stores/assetStore'

export const PROJECT_VERSION = '0.5.0'

export interface ProjectFile {
  version:    string
  exportedAt: string
  surfaces:   Surface[]
  scenes:     Scene[]
  /** Only shader + uji assets — no blob-URL-based media */
  assets:     Asset[]
}

// ─── Export ────────────────────────────────────────────────────────────────────

export function exportProject(
  surfaces: Surface[],
  scenes:   Scene[],
  assets:   Asset[],
): void {
  const portableAssets = assets.filter(
    (a) => a.type === 'shader' || a.type === 'uji'
  )

  const file: ProjectFile = {
    version:    PROJECT_VERSION,
    exportedAt: new Date().toISOString(),
    surfaces,
    scenes,
    assets: portableAssets,
  }

  const json = JSON.stringify(file, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `openvj-project-${Date.now()}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

// ─── Import ────────────────────────────────────────────────────────────────────

export type ImportResult =
  | { ok: true;  data: ProjectFile }
  | { ok: false; error: string }

export async function importProject(file: File): Promise<ImportResult> {
  try {
    const text = await file.text()
    const data = JSON.parse(text) as Partial<ProjectFile>

    if (!data.version)  return { ok: false, error: 'Not a valid OpenVJ project file.' }
    if (!data.surfaces) return { ok: false, error: 'Project file is missing surfaces.' }

    return {
      ok: true,
      data: {
        version:    data.version,
        exportedAt: data.exportedAt ?? '',
        surfaces:   data.surfaces  ?? [],
        scenes:     data.scenes    ?? [],
        assets:     data.assets    ?? [],
      },
    }
  } catch (err) {
    return { ok: false, error: `Failed to parse file: ${(err as Error).message}` }
  }
}
