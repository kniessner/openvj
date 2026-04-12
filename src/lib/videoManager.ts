import * as THREE from 'three'

class VideoManager {
  readonly element: HTMLVideoElement
  texture: THREE.VideoTexture | null = null

  constructor() {
    this.element = document.createElement('video')
    this.element.loop = true
    this.element.muted = true
    this.element.playsInline = true
    this.element.crossOrigin = 'anonymous'
  }

  load(url: string): THREE.VideoTexture {
    if (this.texture) {
      this.texture.dispose()
    }
    this.element.src = url
    this.element.load()
    this.texture = new THREE.VideoTexture(this.element)
    this.texture.colorSpace = THREE.SRGBColorSpace
    return this.texture
  }

  async play(): Promise<void> {
    return this.element.play()
  }

  pause(): void {
    this.element.pause()
  }

  seek(time: number): void {
    this.element.currentTime = time
  }

  stop(): void {
    this.element.pause()
    this.element.currentTime = 0
  }
}

export const videoManager = new VideoManager()
