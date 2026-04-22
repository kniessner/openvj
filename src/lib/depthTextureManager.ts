/**
 * Depth Texture Manager for OpenVJ
 * Manages depth estimation and voxel rendering for media sources
 */

import * as THREE from 'three';
import { DepthEstimator, DepthMapData, getGlobalDepthEstimator } from './depthEstimator';
import { audioEngine } from './audioEngine';

export interface DepthVoxelConfig {
  /** Grid resolution X (default: 64) */
  resolutionX: number;
  /** Grid resolution Y (default: 48) */
  resolutionY: number;
  /** How much depth values extrude (default: 2.0) */
  extrusionScale: number;
  /** Point/voxel size (default: 3.0) */
  pointSize: number;
  /** Color points by depth (default: true) */
  colorByDepth: boolean;
  /** Render mode: 'points' | 'voxels' | 'mesh' */
  renderMode: 'points' | 'voxels' | 'mesh';
  /** Audio reactivity: how much audio affects depth */
  audioReactivity: number;
}

export const DEFAULT_VOXEL_CONFIG: DepthVoxelConfig = {
  resolutionX: 64,
  resolutionY: 48,
  extrusionScale: 2.0,
  pointSize: 3.0,
  colorByDepth: true,
  renderMode: 'points',
  audioReactivity: 0.5,
};

interface DepthTextureEntry {
  texture: THREE.Texture;
  depthEstimator: DepthEstimator;
  voxelConfig: DepthVoxelConfig;
  /** Source video element being processed */
  sourceVideo?: HTMLVideoElement;
  /** Last computed depth data */
  lastDepthData?: DepthMapData;
  /** Frame counter for FPS tracking */
  frameCount: number;
  /** Last FPS calculation time */
  lastFpsTime: number;
  /** Current depth processing FPS */
  depthFps: number;
  /** RAF handle for processing loop */
  rafHandle?: number;
  /** Is the loop running */
  isProcessing: boolean;
  /** Three.js objects for voxel rendering */
  voxelMesh?: THREE.Points | THREE.InstancedMesh;
  voxelGeometry?: THREE.BufferGeometry;
  voxelMaterial?: THREE.ShaderMaterial | THREE.PointsMaterial;
  /** Canvas for rendering depth texture */
  depthCanvas: HTMLCanvasElement;
  depthCtx: CanvasRenderingContext2D;
  /** Disposal */
  dispose: () => void;
  update?: () => void;
}

class DepthTextureManager {
  private cache = new Map<string, DepthTextureEntry>();
  private depthCanvasPool: HTMLCanvasElement[] = [];

  has(id: string): boolean {
    return this.cache.has(id);
  }

  getTexture(id: string): THREE.Texture | null {
    return this.cache.get(id)?.texture ?? null;
  }

  getDepthFPS(id: string): number {
    return this.cache.get(id)?.depthFps ?? 0;
  }

  /**
   * Get or create a depth-processed texture for a video source
   */
  async loadDepthTexture(
    id: string,
    sourceVideo: HTMLVideoElement,
    config: Partial<DepthVoxelConfig> = {}
  ): Promise<THREE.Texture | null> {
    // Return existing if already cached
    if (this.cache.has(id)) {
      const entry = this.cache.get(id)!;
      // Update config if changed
      entry.voxelConfig = { ...entry.voxelConfig, ...config };
      return entry.texture;
    }

    const voxelConfig = { ...DEFAULT_VOXEL_CONFIG, ...config };

    try {
      // Initialize depth estimator
      const depthEstimator = getGlobalDepthEstimator();
      await depthEstimator.initialize();

      // Get or create canvas from pool
      const depthCanvas = this.getCanvas();
      depthCanvas.width = 256;
      depthCanvas.height = 192;
      const depthCtx = depthCanvas.getContext('2d', { willReadFrequently: true })!;

      // Create initial texture
      const texture = new THREE.CanvasTexture(depthCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;

      // Create voxel mesh
      const voxelMesh = this.createVoxelMesh(voxelConfig);

      // Create entry
      const entry: DepthTextureEntry = {
        texture,
        depthEstimator,
        voxelConfig,
        sourceVideo,
        frameCount: 0,
        lastFpsTime: performance.now(),
        depthFps: 0,
        isProcessing: true,
        voxelMesh,
        voxelGeometry: voxelMesh.geometry as THREE.BufferGeometry,
        voxelMaterial: voxelMesh.material as THREE.ShaderMaterial,
        depthCanvas,
        depthCtx,
        dispose: () => this.disposeEntry(id),
      };

      // Start processing loop
      this.startProcessingLoop(entry);

      this.cache.set(id, entry);
      return texture;

    } catch (error) {
      console.error('[DepthTextureManager] Failed to load depth texture:', error);
      return null;
    }
  }

  /**
   * Create voxel mesh based on configuration
   */
  private createVoxelMesh(config: DepthVoxelConfig): THREE.Points {
    const count = config.resolutionX * config.resolutionY;
    
    const geometry = new THREE.BufferGeometry();
    
    // Position attribute
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    // Initialize grid positions
    let i = 0;
    for (let y = 0; y < config.resolutionY; y++) {
      for (let x = 0; x < config.resolutionX; x++) {
        // Normalize to -1 to 1 range, centered
        const u = (x / (config.resolutionX - 1)) * 2 - 1;
        const v = (y / (config.resolutionY - 1)) * 2 - 1;
        
        positions[i * 3] = u * 2;      // x
        positions[i * 3 + 1] = -v * 1.5; // y (flip for correct orientation)
        positions[i * 3 + 2] = 0;      // z (depth)
        
        // Default white color
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;
        
        i++;
      }
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Create shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPointSize: { value: config.pointSize },
        uTime: { value: 0 },
        uAudioLow: { value: 0 },
        uAudioMid: { value: 0 },
        uAudioHigh: { value: 0 },
        uBeat: { value: 0 },
        uAudioReactivity: { value: config.audioReactivity },
      },
      vertexShader: `
        uniform float uPointSize;
        uniform float uAudioReactivity;
        uniform float uAudioLow;
        uniform float uBeat;
        attribute vec3 color;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          
          // Apply audio reactivity to position
          vec3 pos = position;
          float audioBoost = 1.0 + (uAudioLow * uAudioReactivity) + (uBeat * uAudioReactivity * 0.5);
          pos.z *= audioBoost;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Size attenuation
          gl_PointSize = uPointSize * (300.0 / -mvPosition.z);
          
          // Audio-reactive size
          gl_PointSize *= (1.0 + uAudioLow * 0.3);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        uniform float uBeat;
        uniform float uAudioHigh;
        
        void main() {
          // Circular point
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          
          // Soft edge
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          
          // Add glow on beat
          vec3 finalColor = vColor;
          finalColor += vec3(1.0, 0.8, 0.4) * uBeat * 0.3;
          finalColor += vec3(0.4, 0.8, 1.0) * uAudioHigh * 0.2;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    
    const points = new THREE.Points(geometry, material);
    points.rotation.z = Math.PI; // Flip for correct orientation
    
    return points;
  }

  /**
   * Update voxel mesh from depth data
   */
  private updateVoxelMesh(entry: DepthTextureEntry, depthData: DepthMapData) {
    if (!entry.voxelGeometry || !depthData) return;

    const positions = entry.voxelGeometry.attributes.position.array as Float32Array;
    const colors = entry.voxelGeometry.attributes.color.array as Float32Array;
    
    const { resolutionX, resolutionY, extrusionScale, colorByDepth } = entry.voxelConfig;
    const depthWidth = depthData.width;
    const depthHeight = depthData.height;
    const depthValues = depthData.data;

    // Update audio uniforms
    if (entry.voxelMaterial && 'uniforms' in entry.voxelMaterial) {
      entry.voxelMaterial.uniforms.uTime.value = performance.now() * 0.001;
      entry.voxelMaterial.uniforms.uAudioLow.value = audioEngine.low;
      entry.voxelMaterial.uniforms.uAudioMid.value = audioEngine.mid;
      entry.voxelMaterial.uniforms.uAudioHigh.value = audioEngine.high;
      entry.voxelMaterial.uniforms.uBeat.value = audioEngine.beat;
    }

    let i = 0;
    for (let y = 0; y < resolutionY; y++) {
      for (let x = 0; x < resolutionX; x++) {
        // Sample from depth map
        const depthX = Math.floor((x / resolutionX) * depthWidth);
        const depthY = Math.floor((y / resolutionY) * depthHeight);
        const depthIdx = depthY * depthWidth + depthX;
        
        const depthValue = depthValues[depthIdx] ?? 0;
        
        // Update Z position (base depth only, audio applied in shader)
        positions[i * 3 + 2] = depthValue * extrusionScale;
        
        // Update color
        if (colorByDepth) {
          // Gradient: near = cyan/blue, far = purple/magenta
          const t = depthValue;
          colors[i * 3] = 0.2 + t * 0.8;     // R
          colors[i * 3 + 1] = 0.5 + t * 0.4 * (1.0 - t); // G
          colors[i * 3 + 2] = 0.8 + t * 0.2; // B
        } else {
          colors[i * 3] = 1;
          colors[i * 3 + 1] = 1;
          colors[i * 3 + 2] = 1;
        }
        
        i++;
      }
    }

    entry.voxelGeometry.attributes.position.needsUpdate = true;
    entry.voxelGeometry.attributes.color.needsUpdate = true;
  }

  /**
   * Create depth texture visualization
   */
  private renderDepthTexture(entry: DepthTextureEntry, depthData: DepthMapData) {
    const { depthCanvas, depthCtx } = entry;
    const width = depthData.width;
    const height = depthData.height;

    // Resize canvas if needed
    if (depthCanvas.width !== width || depthCanvas.height !== height) {
      depthCanvas.width = width;
      depthCanvas.height = height;
    }

    // Create ImageData
    const imageData = depthCtx.createImageData(width, height);
    const data = imageData.data;
    const depthValues = depthData.data;

    // Convert to grayscale with slight color tint
    for (let i = 0; i < depthValues.length; i++) {
      const value = Math.floor(depthValues[i] * 255);
      const idx = i * 4;
      // Slight blue tint for depth visualization
      data[idx] = value * 0.8;     // R
      data[idx + 1] = value;       // G
      data[idx + 2] = 255;         // B
      data[idx + 3] = 255;         // A
    }

    depthCtx.putImageData(imageData, 0, 0);
    entry.texture.needsUpdate = true;
  }

  /**
   * Start the depth processing loop
   */
  private startProcessingLoop(entry: DepthTextureEntry) {
    const processFrame = async () => {
      if (!entry.isProcessing || !entry.sourceVideo) return;

      // Only process if video is ready and playing
      if (entry.sourceVideo.readyState >= 2 && !entry.sourceVideo.paused) {
        try {
          const depthData = await entry.depthEstimator.estimateDepth(entry.sourceVideo);
          
          if (depthData) {
            entry.lastDepthData = depthData;
            this.renderDepthTexture(entry, depthData);
            this.updateVoxelMesh(entry, depthData);

            // Update FPS
            entry.frameCount++;
            const now = performance.now();
            if (now - entry.lastFpsTime >= 1000) {
              entry.depthFps = entry.frameCount;
              entry.frameCount = 0;
              entry.lastFpsTime = now;
            }
          }
        } catch (error) {
          console.error('[DepthTextureManager] Processing error:', error);
        }
      }

      // Schedule next frame (throttle to ~10-15 FPS for performance)
      entry.rafHandle = window.setTimeout(() => {
        entry.rafHandle = requestAnimationFrame(processFrame);
      }, 66); // ~15 FPS
    };

    entry.rafHandle = requestAnimationFrame(processFrame);
  }

  /**
   * Stop processing for an entry
   */
  private stopProcessing(entry: DepthTextureEntry) {
    entry.isProcessing = false;
    if (entry.rafHandle) {
      cancelAnimationFrame(entry.rafHandle);
      clearTimeout(entry.rafHandle);
    }
  }

  /**
   * Get voxel mesh for a depth texture
   */
  getVoxelMesh(id: string): THREE.Points | null {
    return (this.cache.get(id)?.voxelMesh as THREE.Points) ?? null;
  }

  /**
   * Update voxel configuration
   */
  updateConfig(id: string, config: Partial<DepthVoxelConfig>): boolean {
    const entry = this.cache.get(id);
    if (!entry) return false;

    entry.voxelConfig = { ...entry.voxelConfig, ...config };

    // Recreate mesh if resolution changed
    if (config.resolutionX !== undefined || config.resolutionY !== undefined) {
      this.stopProcessing(entry);
      
      // Dispose old mesh
      entry.voxelGeometry?.dispose();
      if ('dispose' in entry.voxelMaterial!) {
        entry.voxelMaterial.dispose();
      }

      // Create new mesh
      entry.voxelMesh = this.createVoxelMesh(entry.voxelConfig);
      entry.voxelGeometry = entry.voxelMesh.geometry as THREE.BufferGeometry;
      entry.voxelMaterial = entry.voxelMesh.material as THREE.ShaderMaterial;

      this.startProcessingLoop(entry);
    }

    // Update material uniforms
    if (entry.voxelMaterial && 'uniforms' in entry.voxelMaterial) {
      if (config.pointSize !== undefined) {
        entry.voxelMaterial.uniforms.uPointSize.value = config.pointSize;
      }
      if (config.audioReactivity !== undefined) {
        entry.voxelMaterial.uniforms.uAudioReactivity.value = config.audioReactivity;
      }
    }

    return true;
  }

  /**
   * Dispose a specific entry
   */
  private disposeEntry(id: string) {
    const entry = this.cache.get(id);
    if (!entry) return;

    this.stopProcessing(entry);

    // Dispose Three.js objects
    entry.texture.dispose();
    entry.voxelGeometry?.dispose();
    (entry.voxelMaterial as THREE.Material)?.dispose();

    // Return canvas to pool
    this.returnCanvas(entry.depthCanvas);

    this.cache.delete(id);
  }

  /**
   * Dispose all entries
   */
  disposeAll() {
    for (const id of this.cache.keys()) {
      this.disposeEntry(id);
    }
  }

  /**
   * Get a canvas from pool or create new
   */
  private getCanvas(): HTMLCanvasElement {
    return this.depthCanvasPool.pop() ?? document.createElement('canvas');
  }

  /**
   * Return canvas to pool
   */
  private returnCanvas(canvas: HTMLCanvasElement) {
    // Limit pool size
    if (this.depthCanvasPool.length < 5) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      this.depthCanvasPool.push(canvas);
    }
  }
}

export const depthTextureManager = new DepthTextureManager();
