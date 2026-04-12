/**
 * Web MIDI API engine — singleton.
 * Connects to all MIDI inputs, routes CC and Note-On messages to listeners.
 */

type CCListener  = (channel: number, cc: number, value: number) => void
type NoteListener = (channel: number, note: number, velocity: number) => void

class MidiEngine {
  private _access: MIDIAccess | null = null
  private _ccListeners:   Set<CCListener>   = new Set()
  private _noteListeners: Set<NoteListener> = new Set()

  /** Snapshot of all received CC values: key = `ch:cc`, value = 0–1 */
  readonly ccValues: Map<string, number> = new Map()

  active = false

  async start(): Promise<void> {
    if (this.active) return
    const access = await navigator.requestMIDIAccess({ sysex: false })
    this._access = access
    this.active = true

    const attach = (input: MIDIInput) => {
      input.onmidimessage = (e: MIDIMessageEvent) => this._handle(e)
    }

    access.inputs.forEach(attach)
    access.onstatechange = (e: MIDIConnectionEvent) => {
      if (e.port && e.port.type === 'input' && e.port.state === 'connected') {
        attach(e.port as MIDIInput)
      }
    }
  }

  stop() {
    this._access?.inputs.forEach((i) => { i.onmidimessage = null })
    this._access = null
    this.active = false
    this.ccValues.clear()
  }

  private _handle(e: MIDIMessageEvent) {
    if (!e.data) return
    const [status, data1, data2] = Array.from(e.data)
    const type    = status & 0xf0
    const channel = status & 0x0f

    if (type === 0xb0) {
      // Control Change
      const val = data2 / 127
      this.ccValues.set(`${channel}:${data1}`, val)
      this._ccListeners.forEach((fn) => fn(channel, data1, val))
    } else if (type === 0x90 && data2 > 0) {
      // Note On (velocity > 0)
      this._noteListeners.forEach((fn) => fn(channel, data1, data2 / 127))
    }
  }

  /** Subscribe to every CC message. Returns unsubscribe fn. */
  onCC(fn: CCListener): () => void {
    this._ccListeners.add(fn)
    return () => this._ccListeners.delete(fn)
  }

  /** Subscribe to every Note-On message. Returns unsubscribe fn. */
  onNote(fn: NoteListener): () => void {
    this._noteListeners.add(fn)
    return () => this._noteListeners.delete(fn)
  }

  /** Get the last value (0–1) for a CC, defaulting to 0 if never seen. */
  get(channel: number, cc: number): number {
    return this.ccValues.get(`${channel}:${cc}`) ?? 0
  }

  /** List all connected input port names. */
  get inputNames(): string[] {
    if (!this._access) return []
    const names: string[] = []
    this._access.inputs.forEach((i) => names.push(i.name ?? 'Unknown'))
    return names
  }
}

export const midiEngine = new MidiEngine()
