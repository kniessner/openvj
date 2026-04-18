import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OutputState {
  brightness: number  // -1 to 1, 0 = neutral
  contrast:   number  // -1 to 1, 0 = neutral
  saturation: number  // 0 to 2,  1 = neutral
  hue:        number  // degrees -180 to 180, 0 = neutral
  vignette:   number  // 0 to 1, 0 = off
  updateOutputProps: (props: Partial<Pick<OutputState, 'brightness' | 'contrast' | 'saturation' | 'hue' | 'vignette'>>) => void
  resetOutput: () => void
}

export const useOutputStore = create<OutputState>()(
  persist(
    (set) => ({
      brightness: 0,
      contrast:   0,
      saturation: 1,
      hue:        0,
      vignette:   0,
      updateOutputProps: (props) => set((s) => ({ ...s, ...props })),
      resetOutput: () => set({ brightness: 0, contrast: 0, saturation: 1, hue: 0, vignette: 0 }),
    }),
    {
      name: 'openvj-output',
      partialize: (s) => ({
        brightness: s.brightness,
        contrast:   s.contrast,
        saturation: s.saturation,
        hue:        s.hue,
        vignette:   s.vignette,
      }),
    }
  )
)
