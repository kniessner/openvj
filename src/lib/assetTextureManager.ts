import * as THREE from 'three'
import { Asset, DEFAULT_SHADER } from '../stores/assetStore'
import { audioEngine } from './audioEngine'
import { renderUji, UjiAnimator, DEFAULT_UJI_PARAMS } from './ujiRenderer'

interface ManagedTexture {
  texture: THREE.Texture
  /** Called every RAF frame to refresh animated textures. */
  update?: () => void
  dispose: () => void
  /** Non-null for video / webcam / screen capture assets. */
  mediaEl?: HTMLVideoElement
}

class AssetTextureManager {
  private cache = new Map<string, ManagedTexture>()

  has(id: string) { return this.cache.has(id) }

  getTexture(id: string): THREE.Texture | null {
    return this.cache.get(id)?.texture ?? null
  }

  getMediaEl(id: string): HTMLVideoElement | null {
    return this.cache.get(id)?.mediaEl ?? null
  }

  /** Tick all animated assets (call once per frame in useFrame). */
  tickAll() {
    for (const m of this.cache.values()) m.update?.()
  }

  async load(asset: Asset): Promise<THREE.Texture | null> {
    if (this.cache.has(asset.id)) return this.cache.get(asset.id)!.texture
    switch (asset.type) {
      case 'video':         return this._video(asset)
      case 'image':         return this._image(asset)
      case 'shader':        return this._shader(asset)
      case 'webcam':        return this._webcam(asset)
      case 'screencapture': return this._screen(asset)
      case 'uji':           return this._uji(asset)
    }
  }

  /** Dispose and re-load (e.g. after shader code change). */
  async reload(asset: Asset): Promise<THREE.Texture | null> {
    this.dispose(asset.id)
    return this.load(asset)
  }

  dispose(id: string) {
    this.cache.get(id)?.dispose()
    this.cache.delete(id)
  }

  disposeAll() {
    for (const id of this.cache.keys()) this.dispose(id)
  }

  // ─── loaders ─────────────────────────────────────────────────────────────

  private _video(asset: Asset): THREE.Texture {
    const v = this._videoEl(asset.url!)
    const tex = new THREE.VideoTexture(v)
    tex.colorSpace = THREE.SRGBColorSpace
    this.cache.set(asset.id, {
      texture: tex,
      mediaEl: v,
      dispose: () => { v.pause(); v.src = ''; tex.dispose() },
    })
    return tex
  }

  private _image(asset: Asset): Promise<THREE.Texture> {
    const isGif =
      asset.isAnimated ||
      (asset.name?.toLowerCase().endsWith('.gif') ?? false)

    return new Promise((resolve, reject) => {
      if (isGif) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        img.onload = () => {
          canvas.width = img.naturalWidth || 512
          canvas.height = img.naturalHeight || 512
          ctx.drawImage(img, 0, 0)
          const tex = new THREE.CanvasTexture(canvas)
          tex.colorSpace = THREE.SRGBColorSpace
          this.cache.set(asset.id, {
            texture: tex,
            update: () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height)
              ctx.drawImage(img, 0, 0)
              tex.needsUpdate = true
            },
            dispose: () => { img.src = ''; tex.dispose() },
          })
          resolve(tex)
        }
        img.onerror = reject
        img.src = asset.url!
      } else {
        new THREE.TextureLoader().load(
          asset.url!,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace
            this.cache.set(asset.id, { texture: tex, dispose: () => tex.dispose() })
            resolve(tex)
          },
          undefined,
          reject
        )
      }
    })
  }

  private _shader(asset: Asset): THREE.Texture {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false })
    renderer.setSize(512, 512, false)

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const scene = new THREE.Scene()
    const geo = new THREE.PlaneGeometry(2, 2)

    const code = asset.shaderCode ?? DEFAULT_SHADER
    const mat = new THREE.ShaderMaterial({
      vertexShader: `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `precision highp float;
uniform float uTime;
uniform vec2  uResolution;
uniform float uAudioLow;
uniform float uAudioMid;
uniform float uAudioHigh;
uniform float uBeat;
${code}`,
      uniforms: {
        uTime:       { value: 0 },
        uResolution: { value: new THREE.Vector2(512, 512) },
        uAudioLow:   { value: 0 },
        uAudioMid:   { value: 0 },
        uAudioHigh:  { value: 0 },
        uBeat:       { value: 0 },
      },
    })

    scene.add(new THREE.Mesh(geo, mat))
    const t0 = performance.now()
    renderer.render(scene, camera)

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace

    this.cache.set(asset.id, {
      texture: tex,
      update: () => {
        mat.uniforms.uTime.value = (performance.now() - t0) / 1000
        mat.uniforms.uAudioLow.value   = audioEngine.low
        mat.uniforms.uAudioMid.value   = audioEngine.mid
        mat.uniforms.uAudioHigh.value  = audioEngine.high
        mat.uniforms.uBeat.value       = audioEngine.beat
        renderer.render(scene, camera)
        tex.needsUpdate = true
      },
      dispose: () => {
        renderer.dispose()
        geo.dispose()
        mat.dispose()
        tex.dispose()
      },
    })
    return tex
  }

  private _uji(asset: Asset): THREE.Texture {
    const params = asset.ujiParams ?? DEFAULT_UJI_PARAMS
    // 1024px: 4× the pixel area vs 512, keeping art proportional via getPixelScale()
    const TEX_SIZE = 1024

    if (params.animate) {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = TEX_SIZE
      const animator = new UjiAnimator(canvas, params)
      const tex = new THREE.CanvasTexture(canvas)
      tex.colorSpace = THREE.SRGBColorSpace
      // Dynamic canvas textures: disable mipmap generation each frame
      tex.generateMipmaps = false
      tex.minFilter = THREE.LinearFilter

      this.cache.set(asset.id, {
        texture: tex,
        update: () => {
          animator.params = params  // params may have been updated via updateAsset
          animator.step(audioEngine.low, audioEngine.mid, audioEngine.high, audioEngine.beat)
          tex.needsUpdate = true
        },
        dispose: () => tex.dispose(),
      })
      return tex
    } else {
      const srcCanvas = document.createElement('canvas')
      srcCanvas.width = srcCanvas.height = TEX_SIZE
      renderUji(srcCanvas, params)

      const dispCanvas = document.createElement('canvas')
      dispCanvas.width = dispCanvas.height = TEX_SIZE
      const dispCtx = dispCanvas.getContext('2d')!
      dispCtx.drawImage(srcCanvas, 0, 0)

      const tex = new THREE.CanvasTexture(dispCanvas)
      tex.colorSpace = THREE.SRGBColorSpace
      const speed = params.hueshiftSpeed ?? 0
      if (speed !== 0) {
        tex.generateMipmaps = false
        tex.minFilter = THREE.LinearFilter
      }

      let hue = 0

      this.cache.set(asset.id, {
        texture: tex,
        update: speed !== 0 ? () => {
          hue = (hue + speed * 0.1) % 360
          dispCtx.clearRect(0, 0, TEX_SIZE, TEX_SIZE)
          dispCtx.filter = `hue-rotate(${hue}deg)`
          dispCtx.drawImage(srcCanvas, 0, 0)
          dispCtx.filter = 'none'
          tex.needsUpdate = true
        } : undefined,
        dispose: () => tex.dispose(),
      })
      return tex
    }
  }

  private async _webcam(asset: Asset): Promise<THREE.Texture> {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    return this._streamTex(asset.id, stream)
  }

  private async _screen(asset: Asset): Promise<THREE.Texture> {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 } as MediaTrackConstraints,
    })
    return this._streamTex(asset.id, stream)
  }

  // ─── helpers ─────────────────────────────────────────────────────────────

  private _videoEl(url: string): HTMLVideoElement {
    const v = document.createElement('video')
    v.src = url
    v.loop = true
    v.muted = true
    v.playsInline = true
    v.crossOrigin = 'anonymous'
    v.load()
    return v
  }

  private _streamTex(id: string, stream: MediaStream): THREE.Texture {
    const v = document.createElement('video')
    v.srcObject = stream
    v.muted = true
    v.playsInline = true
    v.play().catch(console.error)

    const tex = new THREE.VideoTexture(v)
    tex.colorSpace = THREE.SRGBColorSpace

    const onEnd = () => this.dispose(id)
    stream.getVideoTracks()[0]?.addEventListener('ended', onEnd)

    this.cache.set(id, {
      texture: tex,
      mediaEl: v,
      dispose: () => {
        stream.getTracks().forEach((t) => t.stop())
        v.srcObject = null
        tex.dispose()
      },
    })
    return tex
  }
}

export const assetTextureManager = new AssetTextureManager()
