/**
 * Web Audio API engine — singleton.
 * Call tick() once per animation frame to keep low/mid/high/beat current.
 */
class AudioEngine {
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private stream: MediaStream | null = null
  private data: Uint8Array = new Uint8Array(0)

  /** Normalised 0..1 energy bands — update every tick() */
  low  = 0
  mid  = 0
  high = 0
  /** Decaying beat pulse 0..1 — peaks on each detected kick */
  beat = 0
  /** Tapped BPM — set externally from the Transport tap tempo control */
  bpm = 0

  /** Scales all band values. 1.0 = default */
  sensitivity = 1.0
  /** FFT smoothing 0–1. Higher = slower/smoother. Applied on startMic/setSmooting. */
  smoothing = 0.8
  /** Bass energy threshold for beat detection */
  beatThreshold = 0.3

  private _beatDecay = 0

  get active() {
    return this.ctx !== null && this.ctx.state !== 'closed'
  }

  /** Update smoothingTimeConstant live */
  setSmoothing(v: number) {
    this.smoothing = Math.max(0, Math.min(0.99, v))
    if (this.analyser) this.analyser.smoothingTimeConstant = this.smoothing
  }

  /** Start microphone input. Throws on permission denied. */
  async startMic(): Promise<void> {
    if (this.active) return
    this.ctx = new AudioContext()
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = this.smoothing
    this.data = new Uint8Array(this.analyser.frequencyBinCount)

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    const src = this.ctx.createMediaStreamSource(this.stream)
    src.connect(this.analyser)
  }

  stop() {
    this.stream?.getTracks().forEach((t) => t.stop())
    this.ctx?.close()
    this.ctx = null
    this.analyser = null
    this.stream = null
    this.data = new Uint8Array(0)
    this.low = this.mid = this.high = this.beat = this._beatDecay = 0
  }

  /** Update energy values from current FFT frame. Call once per RAF. */
  tick() {
    if (!this.analyser || !this.ctx || this.ctx.state === 'closed') return

    this.analyser.getByteFrequencyData(this.data as Uint8Array<ArrayBuffer>)

    const n = this.data.length
    const hzPerBin = (this.ctx.sampleRate / 2) / n
    const s = this.sensitivity

    const avg = (fromHz: number, toHz: number): number => {
      const a = Math.max(0, Math.floor(fromHz / hzPerBin))
      const b = Math.min(n - 1, Math.ceil(toHz / hzPerBin))
      if (b <= a) return 0
      let sum = 0
      for (let i = a; i <= b; i++) sum += this.data[i]
      return sum / ((b - a + 1) * 255)
    }

    this.low  = Math.min(1, avg(20,   300)   * 2.5 * s)
    this.mid  = Math.min(1, avg(300,  4000)  * 2.0 * s)
    this.high = Math.min(1, avg(4000, 20000) * 3.5 * s)

    // Beat detection: bass spike above decaying threshold
    if (this.low > this.beatThreshold && this.low > this._beatDecay * 1.05) {
      this.beat = 1.0
      this._beatDecay = this.low
    } else {
      this._beatDecay *= 0.96
      this.beat = this._beatDecay
    }
  }
}

export const audioEngine = new AudioEngine()
