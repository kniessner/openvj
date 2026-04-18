import { create } from 'zustand'

interface VideoState {
  url: string | null
  fileName: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
  setUrl: (url: string, fileName: string) => void
  clearVideo: () => void
  setPlaying: (isPlaying: boolean) => void
  setCurrentTime: (currentTime: number) => void
  setDuration: (duration: number) => void
}

export const useVideoStore = create<VideoState>((set) => ({
  url: null,
  fileName: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  setUrl: (url, fileName) =>
    set({ url, fileName, currentTime: 0, duration: 0, isPlaying: false }),
  clearVideo: () =>
    set({ url: null, fileName: null, isPlaying: false, currentTime: 0, duration: 0 }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
}))
