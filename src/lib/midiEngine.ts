/**
 * MIDI engine for MIDI controller integration via WebMIDI API
 */
class MidiEngine {
  private inputs: MIDIInput[] = []
  private listeners: Array<(channel: number, cc: number, value: number) => void> = []
  private noteListeners: Array<(channel: number, note: number, velocity: number) => void> = []
  inputNames: string[] = []

  async start(): Promise<string[]> {
    return this.init()
  }

  stop(): void {
    this.inputs.forEach((input) => {
      input.onmidimessage = null
    })
    this.inputs = []
    this.inputNames = []
    this.listeners = []
  }

  async init(): Promise<string[]> {
    try {
      const access = await navigator.requestMIDIAccess()
      this.inputs = Array.from(access.inputs.values())
      
      this.inputs.forEach((input) => {
        input.onmidimessage = (event: Event) => {
          const midiEvent = event as MIDIMessageEvent
          if (!midiEvent.data || midiEvent.data.length < 3) return
          
          const [status, cc, value] = midiEvent.data
          const channel = status & 0x0f
          const command = status & 0xf0
          
          // CC message (0xB0)
          if (command === 0xb0) {
            const normalizedValue = value / 127
            this.listeners.forEach((cb) => cb(channel, cc, normalizedValue))
          }
          // Note On message (0x90)
          if (command === 0x90 && value > 0) {
            this.noteListeners.forEach((cb) => cb(channel, cc, value))
          }
        }
      })

      this.inputNames = this.inputs.map((input) => input.name || 'Unknown')
      return this.inputNames
    } catch (error) {
      console.error('MIDI access failed:', error)
      throw error
    }
  }

  onCC(callback: (channel: number, cc: number, value: number) => void): () => void {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) this.listeners.splice(index, 1)
    }
  }

  onNote(callback: (channel: number, note: number, velocity: number) => void): () => void {
    this.noteListeners.push(callback)
    return () => {
      const index = this.noteListeners.indexOf(callback)
      if (index > -1) this.noteListeners.splice(index, 1)
    }
  }

  getInputNames(): string[] {
    return this.inputs.map((input) => input.name || 'Unknown')
  }
}

export const midiEngine = new MidiEngine()
