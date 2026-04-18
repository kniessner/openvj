import type { Surface } from '../stores/surfaceStore'
import type { Scene } from '../stores/sceneStore'
import type { Asset } from '../stores/assetStore'

export interface ProjectData {
  version: string
  surfaces: Surface[]
  scenes: Scene[]
  assets: Asset[]
}

export function exportProject(surfaces: Surface[], scenes: Scene[], assets: Asset[]): void {
  const data: ProjectData = {
    version: '0.1.0',
    surfaces,
    scenes,
    assets: assets.filter((a) => a.type === 'shader' || a.type === 'uji'), // Only export shader/uji
  }

  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `openvj-project-${Date.now()}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export async function importProject(
  file: File
): Promise<{ ok: true; data: ProjectData } | { ok: false; error: string }> {
  try {
    const text = await file.text()
    const data = JSON.parse(text) as ProjectData

    if (!data.version || !Array.isArray(data.surfaces)) {
      return { ok: false, error: 'Invalid project file format' }
    }

    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to import project',
    }
  }
}
