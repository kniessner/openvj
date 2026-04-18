/**
 * Audio analysis engine for audio-reactive features
 * Provides real-time frequency analysis and beat detection
 */
class AudioEngine {
  low = 0
  mid = 0
  high = 0
  beat = 0
  sensitivity = 1
  smoothing = 0.8
  beatThreshold = 0.3
  bpm = 0
  active = false

  private context: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private dataArray: Uint8Array<ArrayBuffer> | null = null

  async startMic(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.context = new AudioContext()
      const source = this.context.createMediaStreamSource(stream)
      this.analyser = this.context.createAnalyser()
      this.analyser.fftSize = 512
      this.analyser.smoothingTimeConstant = this.smoothing
      source.connect(this.analyser)
      const bufferLength = this.analyser.frequencyBinCount
      this.dataArray = new Uint8Array(bufferLength)
      this.active = true
    } catch (error) {
      console.error('Failed to start microphone:', error)
      this.active = false
      throw error
    }
  }

  stop(): void {
    if (this.context) {
      this.context.close()
      this.context = null
      this.analyser = null
      this.dataArray = null
    }
    this.active = false
    this.low = 0
    this.mid = 0
    this.high = 0
    this.beat = 0
  }

  setSmoothing(value: number): void {
    this.smoothing = value
    if (this.analyser) {
      this.analyser.smoothingTimeConstant = value
    }
  }

  tick(): void {
    if (!this.analyser || !this.dataArray) return

    this.analyser.getByteFrequencyData(this.dataArray)

    // Calculate frequency bands (simplified)
    const lowEnd = Math.floor(this.dataArray.length * 0.1)
    const midEnd = Math.floor(this.dataArray.length * 0.5)

    let lowSum = 0
    let midSum = 0
    let highSum = 0

    for (let i = 0; i < lowEnd; i++) lowSum += this.dataArray[i]
    for (let i = lowEnd; i < midEnd; i++) midSum += this.dataArray[i]
    for (let i = midEnd; i < this.dataArray.length; i++) highSum += this.dataArray[i]

    this.low = (lowSum / lowEnd / 255) * this.sensitivity
    this.mid = (midSum / (midEnd - lowEnd) / 255) * this.sensitivity
    this.high = (highSum / (this.dataArray.length - midEnd) / 255) * this.sensitivity

    // Beat detection (simplified)
    if (this.low > this.beatThreshold) {
      this.beat = Math.min(1, this.low)
    } else {
      this.beat *= 0.95 // Decay
    }
  }
}

export const audioEngine = new AudioEngine()
