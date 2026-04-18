import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Surface properties that can be controlled via MIDI CC */
export type MidiTarget =
  | 'opacity'
  | 'brightness'
  | 'contrast'
  | 'hue'
  | 'saturation'
  | 'zoom'
  | 'warpAmp'
  | 'chromaAb'
  | 'pixelate'
  | 'vignette'
  | 'rotation'

/** Min/max range for each target — used to scale 0–1 CC value */
export const MIDI_TARGET_RANGE: Record<MidiTarget, [number, number]> = {
  opacity:    [0,    1],
  brightness: [-0.5, 0.5],
  contrast:   [-0.5, 0.5],
  hue:        [-180, 180],
  saturation: [0,    2],
  zoom:       [0.25, 4],
  warpAmp:    [0,    0.15],
  chromaAb:   [0,    0.04],
  pixelate:   [0,    64],
  vignette:   [0,    1],
  rotation:   [-180, 180],
}

export const MIDI_TARGET_LABELS: Record<MidiTarget, string> = {
  opacity:    'Opacity',
  brightness: 'Brightness',
  contrast:   'Contrast',
  hue:        'Hue',
  saturation: 'Saturation',
  zoom:       'Zoom',
  warpAmp:    'Warp',
  chromaAb:   'Chroma AB',
  pixelate:   'Pixelate',
  vignette:   'Vignette',
  rotation:   'Rotation',
}

export interface MidiBinding {
  channel: number
  cc: number
  target: MidiTarget
}

/** Map a MIDI note-on to a scene recall */
export interface NoteBinding {
  channel: number
  note: number
  sceneId: string
}

interface MidiState {
  bindings: MidiBinding[]
  /** Which target is waiting for a CC "learn" message */
  learning: MidiTarget | null
  noteBindings: NoteBinding[]
  /** Scene ID waiting for a note "learn" message */
  learningNote: string | null

  addBinding: (binding: MidiBinding) => void
  removeBinding: (target: MidiTarget) => void
  setLearning: (target: MidiTarget | null) => void
  addNoteBinding: (binding: NoteBinding) => void
  removeNoteBinding: (sceneId: string) => void
  setLearningNote: (sceneId: string | null) => void
  clearAll: () => void
}

/** Default 8-CC mapping: typical knobs on a generic controller (ch 0, CC 1–8) */
const DEFAULT_BINDINGS: MidiBinding[] = [
  { channel: 0, cc: 1,  target: 'opacity'    },
  { channel: 0, cc: 2,  target: 'brightness' },
  { channel: 0, cc: 3,  target: 'contrast'   },
  { channel: 0, cc: 4,  target: 'hue'        },
  { channel: 0, cc: 5,  target: 'saturation' },
  { channel: 0, cc: 6,  target: 'zoom'       },
  { channel: 0, cc: 7,  target: 'warpAmp'    },
  { channel: 0, cc: 8,  target: 'chromaAb'   },
]

export const useMidiStore = create<MidiState>()(
  persist(
    (set) => ({
      bindings: DEFAULT_BINDINGS,
      learning: null,
      noteBindings: [],
      learningNote: null,

      addBinding: (binding) =>
        set((s) => ({
          bindings: [
            ...s.bindings.filter((b) => b.target !== binding.target),
            binding,
          ],
          learning: null,
        })),

      removeBinding: (target) =>
        set((s) => ({
          bindings: s.bindings.filter((b) => b.target !== target),
        })),

      setLearning: (target) => set({ learning: target }),

      addNoteBinding: (binding) =>
        set((s) => ({
          noteBindings: [
            ...s.noteBindings.filter((b) => b.sceneId !== binding.sceneId),
            binding,
          ],
          learningNote: null,
        })),

      removeNoteBinding: (sceneId) =>
        set((s) => ({
          noteBindings: s.noteBindings.filter((b) => b.sceneId !== sceneId),
        })),

      setLearningNote: (sceneId) => set({ learningNote: sceneId }),

      clearAll: () => set({ bindings: [], learning: null, noteBindings: [], learningNote: null }),
    }),
    { name: 'openvj-midi' }
  )
)
