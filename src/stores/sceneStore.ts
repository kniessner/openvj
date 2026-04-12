import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Surface } from './surfaceStore'

export interface Scene {
  id: string
  name: string
  /** Snapshot of all surfaces at save time */
  surfaces: Surface[]
  /** Base64 PNG thumbnail (grabbed from canvas) */
  thumbnail: string | null
  createdAt: number
}

interface SceneState {
  scenes: Scene[]
  activeSceneId: string | null

  saveScene: (name: string, surfaces: Surface[], thumbnail: string | null) => string
  deleteScene: (id: string) => void
  renameScene: (id: string, name: string) => void
  updateThumbnail: (id: string, thumbnail: string) => void
  setActiveScene: (id: string | null) => void
}

const generateId = () => Math.random().toString(36).substr(2, 9)

export const useSceneStore = create<SceneState>()(
  persist(
    (set) => ({
      scenes: [],
      activeSceneId: null,

      saveScene: (name, surfaces, thumbnail) => {
        const id = generateId()
        set((s) => ({
          scenes: [
            ...s.scenes,
            {
              id,
              name: name.trim() || `Scene ${s.scenes.length + 1}`,
              surfaces: JSON.parse(JSON.stringify(surfaces)), // deep clone
              thumbnail,
              createdAt: Date.now(),
            },
          ],
          activeSceneId: id,
        }))
        return id
      },

      deleteScene: (id) =>
        set((s) => ({
          scenes: s.scenes.filter((sc) => sc.id !== id),
          activeSceneId: s.activeSceneId === id ? null : s.activeSceneId,
        })),

      renameScene: (id, name) =>
        set((s) => ({
          scenes: s.scenes.map((sc) =>
            sc.id === id ? { ...sc, name: name.trim() || sc.name } : sc
          ),
        })),

      updateThumbnail: (id, thumbnail) =>
        set((s) => ({
          scenes: s.scenes.map((sc) =>
            sc.id === id ? { ...sc, thumbnail } : sc
          ),
        })),

      setActiveScene: (id) => set({ activeSceneId: id }),
    }),
    {
      name: 'openvj-scenes',
    }
  )
)
