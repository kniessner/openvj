/**
 * Depth Estimation Engine for OpenVJ
 * Uses Depth Anything V2 via Transformers.js with WebGPU acceleration
 */

export interface DepthMapData {
  width: number;
  height: number;
  data: Float32Array; // Normalized 0-1 depth values
}

export interface DepthEstimationConfig {
  modelName: 'Xenova/depth-anything-small-hf' | 'Xenova/depth-anything-base-hf' | 'Xenova/depth-anything-large-hf';
  device: 'webgpu' | 'cpu';
  quantization: 'fp16' | 'fp32' | 'int8';
}

export const DEFAULT_DEPTH_CONFIG: DepthEstimationConfig = {
  modelName: 'Xenova/depth-anything-small-hf',
  device: 'webgpu',
  quantization: 'fp16',
};

// CDN URL for Transformers.js
const TRANSFORMERS_CDN = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js';

class DepthEstimator {
  private pipeline: unknown = null;
  private isLoaded = false;
  private isLoading = false;
  private config: DepthEstimationConfig;
  private frameCount = 0;
  private fps = 0;
  private lastFpsTime = performance.now();
  private transformePromise: Promise<unknown> | null = null;

  constructor(config: Partial<DepthEstimationConfig> = {}) {
    this.config = { ...DEFAULT_DEPTH_CONFIG, ...config };
  }

  /**
   * Check if WebGPU is available
   */
  static isWebGPUSupported(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  /**
   * Get the best available device
   */
  static getRecommendedDevice(): 'webgpu' | 'cpu' {
    return DepthEstimator.isWebGPUSupported() ? 'webgpu' : 'cpu';
  }

  /**
   * Load Transformers.js from CDN dynamically
   */
  private async loadTransformers(): Promise<{ pipeline: unknown; env: unknown }> {
    if (this.transformePromise) {
      return this.transformePromise as Promise<{ pipeline: unknown; env: unknown }>;
    }

    // Create the promise
    const promise = (async () => {
      // Use dynamic import with type assertion
      const module = await import(/* @vite-ignore */ TRANSFORMERS_CDN);
      return module as { pipeline: unknown; env: unknown };
    })();
    
    this.transformePromise = promise;

    return promise;
  }

  /**
   * Initialize the depth estimation pipeline
   */
  async initialize(): Promise<boolean> {
    if (this.isLoaded) return true;
    if (this.isLoading) {
      // Wait for existing load
      while (this.isLoading) {
        await new Promise(r => setTimeout(r, 100));
      }
      return this.isLoaded;
    }

    this.isLoading = true;

    try {
      const { pipeline, env } = await this.loadTransformers();

      // Configure environment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (env as any).backends.onnx.wasm.proxy = false;
      
      // Use CPU fallback if WebGPU not available
      const device = this.config.device === 'webgpu' && !DepthEstimator.isWebGPUSupported() 
        ? 'cpu' 
        : this.config.device;

      console.log(`[DepthEstimator] Loading model: ${this.config.modelName} on ${device}`);

      this.pipeline = await (pipeline as CallableFunction)('depth-estimation', this.config.modelName, {
        device,
        dtype: this.config.quantization,
      });

      this.isLoaded = true;
      console.log('[DepthEstimator] Model loaded successfully');
      return true;

    } catch (error) {
      console.error('[DepthEstimator] Failed to load model:', error);
      this.isLoaded = false;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Estimate depth from an image/video element
   */
  async estimateDepth(source: HTMLImageElement | HTMLVideoElement | ImageBitmap): Promise<DepthMapData | null> {
    if (!this.isLoaded || !this.pipeline) {
      console.warn('[DepthEstimator] Not initialized');
      return null;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (this.pipeline as any)(source, {
        min_depth: 0,
        max_depth: 1, // Output normalized 0-1
      });

      // Update FPS counter
      this.frameCount++;
      const now = performance.now();
      if (now - this.lastFpsTime >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastFpsTime = now;
      }

      return {
        width: result.depth.width,
        height: result.depth.height,
        data: result.depth.data,
      };

    } catch (error) {
      console.error('[DepthEstimator] Estimation failed:', error);
      return null;
    }
  }

  /**
   * Get current depth processing FPS
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * Check if model is loaded
   */
  isReady(): boolean {
    return this.isLoaded;
  }

  /**
   * Dispose pipeline and free resources
   */
  dispose(): void {
    this.pipeline = null;
    this.isLoaded = false;
    this.transformePromise = null;
  }
}

// Singleton instance
let globalEstimator: DepthEstimator | null = null;

export function getGlobalDepthEstimator(config?: Partial<DepthEstimationConfig>): DepthEstimator {
  if (!globalEstimator) {
    globalEstimator = new DepthEstimator(config);
  }
  return globalEstimator;
}

export function disposeGlobalDepthEstimator(): void {
  globalEstimator?.dispose();
  globalEstimator = null;
}

export { DepthEstimator };
