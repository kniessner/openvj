import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Corner {
  x: number
  y: number
}

export type BlendMode = 'normal' | 'add' | 'screen' | 'multiply'

export interface Surface {
  id: string
  name: string
  corners: [Corner, Corner, Corner, Corner] // TL, TR, BR, BL
  visible: boolean
  locked: boolean
  opacity: number
  brightness: number
  contrast: number
  blendMode: BlendMode
  assetId: string | null
  // Color FX
  hue: number          // degrees -180 to 180, default 0
  saturation: number   // 0 to 2, default 1
  invert: boolean      // default false
  // Transform
  flipH: boolean       // default false
  flipV: boolean       // default false
  rotation: number     // degrees -180 to 180, default 0
  zoom: number         // 0.25 to 4, default 1
  // Distortion FX
  warpAmp: number      // 0 to 0.15, default 0
  warpFreq: number     // 0.5 to 30, default 5
  chromaAb: number     // 0 to 0.04, default 0
  pixelate: number     // 0=off, 4-256=grid count, default 0
  vignette: number     // 0 to 1, default 0
  // Custom post-process shader
  customShader: string | null  // default null
}

interface SurfaceState {
  surfaces: Surface[]
  activeSurfaceId: string | null
  /** True while any corner handle is being dragged — use to disable OrbitControls */
  isDraggingCorner: boolean
  /** Undo/redo history (not persisted) */
  _history: Surface[][]
  _future: Surface[][]
  undo: () => void
  redo: () => void
  addSurface: () => void
  removeSurface: (id: string) => void
  updateCorner: (surfaceId: string, cornerIndex: number, position: Corner) => void
  setActiveSurface: (id: string | null) => void
  setDraggingCorner: (v: boolean) => void
  toggleVisibility: (id: string) => void
  toggleLock: (id: string) => void
  resetSurface: (id: string) => void
  renameSurface: (id: string, name: string) => void
  updateSurfaceProps: (
    id: string,
    props: Partial<Pick<Surface, 'opacity' | 'brightness' | 'contrast' | 'blendMode' | 'hue' | 'saturation' | 'invert' | 'flipH' | 'flipV' | 'rotation' | 'zoom' | 'warpAmp' | 'warpFreq' | 'chromaAb' | 'pixelate' | 'vignette' | 'customShader'>>
  ) => void
  assignAsset: (surfaceId: string, assetId: string | null) => void
  reorderSurface: (fromIndex: number, toIndex: number) => void
  importConfig: (config: Surface[]) => void
  exportConfig: () => Surface[]
}

const defaultCorners: [Corner, Corner, Corner, Corner] = [
  { x: -2, y: 2 },   // Top Left
  { x: 2, y: 2 },    // Top Right
  { x: 2, y: -2 },   // Bottom Right
  { x: -2, y: -2 },  // Bottom Left
]

const generateId = () => Math.random().toString(36).substr(2, 9)

const defaultSurfaceProps = {
  visible: true,
  locked: false,
  opacity: 0.95,
  brightness: 0,
  contrast: 0,
  blendMode: 'normal' as BlendMode,
  assetId: null,
  hue: 0,
  saturation: 1,
  invert: false,
  flipH: false,
  flipV: false,
  rotation: 0,
  zoom: 1,
  warpAmp: 0,
  warpFreq: 5,
  chromaAb: 0,
  pixelate: 0,
  vignette: 0,
  customShader: null,
}

export const useSurfaceStore = create<SurfaceState>()(
  persist(
    (set, get) => {
      // Closure-level debounce for slider-heavy updateSurfaceProps calls
      let _sliderDebounceTimer: ReturnType<typeof setTimeout> | null = null
      let _sliderHistoryPushed = false

      const _pushHistory = () => {
        const curr = get().surfaces
        set((s) => ({
          _history: [...s._history.slice(-49), curr],
          _future: [],
        }))
      }

      const _pushHistoryDebounced = () => {
        if (!_sliderHistoryPushed) {
          _pushHistory()
          _sliderHistoryPushed = true
        }
        if (_sliderDebounceTimer) clearTimeout(_sliderDebounceTimer)
        _sliderDebounceTimer = setTimeout(() => {
          _sliderDebounceTimer = null
          _sliderHistoryPushed = false
        }, 600)
      }

      return {
      surfaces: [
        {
          id: generateId(),
          name: 'Surface 1',
          corners: [...defaultCorners],
          ...defaultSurfaceProps,
        },
      ],
      activeSurfaceId: null,
      isDraggingCorner: false,
      _history: [],
      _future: [],

      undo: () => {
        const { _history, surfaces, _future } = get()
        if (_history.length === 0) return
        set({
          surfaces: _history[_history.length - 1],
          _history: _history.slice(0, -1),
          _future: [surfaces, ..._future.slice(0, 49)],
        })
      },

      redo: () => {
        const { _future, surfaces, _history } = get()
        if (_future.length === 0) return
        set({
          surfaces: _future[0],
          _history: [..._history.slice(-49), surfaces],
          _future: _future.slice(1),
        })
      },

      setDraggingCorner: (v) => set({ isDraggingCorner: v }),

      addSurface: () => {
        _pushHistory()
        const id = generateId()
        const existing = get().surfaces
        const nums = existing
          .map((s) => parseInt(s.name.replace('Surface ', '')))
          .filter((n) => !isNaN(n))
        const next = nums.length ? Math.max(...nums) + 1 : existing.length + 1
        const offset = (Math.random() - 0.5) * 0.6
        set((state) => ({
          surfaces: [
            ...state.surfaces,
            {
              id,
              name: `Surface ${next}`,
              corners: [
                { x: -2 + offset, y: 2 + offset },
                { x: 2 + offset, y: 2 + offset },
                { x: 2 + offset, y: -2 + offset },
                { x: -2 + offset, y: -2 + offset },
              ],
              ...defaultSurfaceProps,
            },
          ],
          activeSurfaceId: id,
        }))
      },

      removeSurface: (id) => {
        _pushHistory()
        set((state) => ({
          surfaces: state.surfaces.filter((s) => s.id !== id),
          activeSurfaceId:
            state.activeSurfaceId === id ? null : state.activeSurfaceId,
        }))
      },

      updateCorner: (surfaceId, cornerIndex, position) => {
        set((state) => ({
          surfaces: state.surfaces.map((surface) =>
            surface.id === surfaceId
              ? {
                  ...surface,
                  corners: surface.corners.map((corner, idx) =>
                    idx === cornerIndex ? position : corner
                  ) as [Corner, Corner, Corner, Corner],
                }
              : surface
          ),
        }))
      },

      setActiveSurface: (id) => set({ activeSurfaceId: id }),

      toggleVisibility: (id) => {
        _pushHistory()
        set((state) => ({
          surfaces: state.surfaces.map((surface) =>
            surface.id === id
              ? { ...surface, visible: !surface.visible }
              : surface
          ),
        }))
      },

      toggleLock: (id) => {
        _pushHistory()
        set((state) => ({
          surfaces: state.surfaces.map((surface) =>
            surface.id === id
              ? { ...surface, locked: !surface.locked }
              : surface
          ),
        }))
      },

      resetSurface: (id) => {
        _pushHistory()
        set((state) => ({
          surfaces: state.surfaces.map((surface) =>
            surface.id === id
              ? {
                  ...surface,
                  corners: [...defaultCorners],
                  opacity: defaultSurfaceProps.opacity,
                  brightness: defaultSurfaceProps.brightness,
                  contrast: defaultSurfaceProps.contrast,
                  hue: defaultSurfaceProps.hue,
                  saturation: defaultSurfaceProps.saturation,
                  invert: defaultSurfaceProps.invert,
                  flipH: defaultSurfaceProps.flipH,
                  flipV: defaultSurfaceProps.flipV,
                  rotation: defaultSurfaceProps.rotation,
                  zoom: defaultSurfaceProps.zoom,
                  warpAmp: defaultSurfaceProps.warpAmp,
                  warpFreq: defaultSurfaceProps.warpFreq,
                  chromaAb: defaultSurfaceProps.chromaAb,
                  pixelate: defaultSurfaceProps.pixelate,
                  vignette: defaultSurfaceProps.vignette,
                }
              : surface
          ),
        }))
      },

      renameSurface: (id, name) => {
        set((state) => ({
          surfaces: state.surfaces.map((surface) =>
            surface.id === id ? { ...surface, name: name.trim() || surface.name } : surface
          ),
        }))
      },

      updateSurfaceProps: (id, props) => {
        _pushHistoryDebounced()
        set((state) => ({
          surfaces: state.surfaces.map((surface) =>
            surface.id === id ? { ...surface, ...props } : surface
          ),
        }))
      },

      assignAsset: (surfaceId, assetId) => {
        _pushHistory()
        set((state) => ({
          surfaces: state.surfaces.map((s) =>
            s.id === surfaceId ? { ...s, assetId } : s
          ),
        }))
      },

      reorderSurface: (fromIndex, toIndex) => {
        _pushHistory()
        set((state) => {
          const arr = [...state.surfaces]
          const [item] = arr.splice(fromIndex, 1)
          arr.splice(toIndex, 0, item)
          return { surfaces: arr }
        })
      },

      importConfig: (config) => {
        _pushHistory()
        set({ surfaces: config })
      },
      exportConfig: () => get().surfaces,
    }},
    {
      name: 'openvj-surfaces',
      partialize: (s) => ({ surfaces: s.surfaces, activeSurfaceId: s.activeSurfaceId }),
    }
  )
)
