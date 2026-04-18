import * as THREE from 'three'
import type { Asset } from '../stores/assetStore'

/**
 * Manages texture loading and lifecycle for all asset types
 */
class AssetTextureManager {
  private textures = new Map<string, THREE.Texture | THREE.VideoTexture>()
  private mediaElements = new Map<string, HTMLVideoElement>()

  async load(asset: Asset): Promise<THREE.Texture | null> {
    if (!asset) return null

    // Return cached texture if exists
    if (this.textures.has(asset.id)) {
      return this.textures.get(asset.id) || null
    }

    switch (asset.type) {
      case 'video':
      case 'webcam':
      case 'screencapture': {
        if (!asset.url) return null
        const video = document.createElement('video')
        video.src = asset.url
        video.crossOrigin = 'anonymous'
        video.loop = true
        video.muted = true
        video.playsInline = true
        
        const texture = new THREE.VideoTexture(video)
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        
        this.textures.set(asset.id, texture)
        this.mediaElements.set(asset.id, video)
        
        // Auto-play for webcam/screen capture
        if (asset.type === 'webcam' || asset.type === 'screencapture') {
          video.play().catch(console.error)
        }
        
        return texture
      }

      case 'image': {
        if (!asset.url) return null
        const texture = await new Promise<THREE.Texture>((resolve) => {
          const loader = new THREE.TextureLoader()
          loader.load(asset.url!, (tex) => {
            resolve(tex)
          })
        })
        this.textures.set(asset.id, texture)
        return texture
      }

      default:
        return null
    }
  }

  getMediaEl(assetId: string): HTMLVideoElement | null {
    return this.mediaElements.get(assetId) || null
  }

  getTexture(assetId: string): THREE.Texture | THREE.VideoTexture | null {
    return this.textures.get(assetId) || null
  }

  async reload(asset: Asset): Promise<void> {
    // Dispose old texture
    this.dispose(asset.id)
    // Reload fresh
    await this.load(asset)
  }

  tickAll(): void {
    // Update video textures (needed for video playback)
    // Textures auto-update, but this ensures timing is correct
  }

  dispose(assetId: string): void {
    const texture = this.textures.get(assetId)
    if (texture) {
      texture.dispose()
      this.textures.delete(assetId)
    }

    const media = this.mediaElements.get(assetId)
    if (media) {
      media.pause()
      media.src = ''
      this.mediaElements.delete(assetId)
    }
  }
}

export const assetTextureManager = new AssetTextureManager()
