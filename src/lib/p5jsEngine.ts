/**
 * OpenVJ - p5.js Integration Engine
 * 
 * Provides p5.js sketch rendering as texture sources for OpenVJ surfaces.
 * Each sketch runs in "instance mode" and renders to an offscreen canvas,
 * which is then used as a Three.js texture.
 */

import p5 from 'p5';
import * as THREE from 'three';
import { audioEngine } from './audioEngine';

// Audio analysis interface matching OpenVJ's audio engine
interface AudioUniforms {
  uAudioLow: number;      // 0-255
  uAudioMid: number;      // 0-255
  uAudioHigh: number;     // 0-255
  uAudioAvg: number;      // 0-255
  uBeat: number;          // 0 or 1 (beat trigger)
  uBpm: number;           // Detected BPM
  uTime: number;          // Time since start
  uDeltaTime: number;     // Frame delta
}

// MIDI state interface
interface MidiState {
  knobs: number[];        // CC values 0-127
  buttons: boolean[];     // Note on/off
}

// Runtime context passed to sketches
export interface P5JsContext {
  audio: AudioUniforms;
  midi: MidiState;
  width: number;
  height: number;
}

// Sketch configuration
export interface P5JsSketch {
  id: string;
  name: string;
  code: string;
  mode: '2D' | 'WEBGL';
  width: number;
  height: number;
}

/**
 * P5JsSource - Manages a p5.js instance as an OpenVJ texture source
 */
export class P5JsSource {
  private p5Instance: p5 | null = null;
  private canvas: HTMLCanvasElement;
  private texture: THREE.CanvasTexture;
  private animationId: number | null = null;
  private context: P5JsContext;
  private isRunning: boolean = false;
  private errorHandler: ((error: Error) => void) | null = null;

  constructor(
    private sketch: P5JsSketch,
    private onTextureUpdate?: () => void
  ) {
    // Create offscreen canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = sketch.width;
    this.canvas.height = sketch.height;
    
    // Initialize context with default values
    this.context = {
      audio: {
        uAudioLow: 0,
        uAudioMid: 0,
        uAudioHigh: 0,
        uAudioAvg: 0,
        uBeat: 0,
        uBpm: 120,
        uTime: 0,
        uDeltaTime: 0
      },
      midi: {
        knobs: new Array(128).fill(0),
        buttons: new Array(128).fill(false)
      },
      width: sketch.width,
      height: sketch.height
    };

    // Create Three.js texture
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.colorSpace = THREE.SRGBColorSpace;

    // Initialize p5 instance
    this.initializeP5();
  }

  /**
   * Initialize the p5.js instance in instance mode
   */
  private initializeP5(): void {
    try {
      // Create sketch wrapper that injects OpenVJ context
      const sketchWrapper = this.createSketchWrapper();
      
      // Create p5 instance
      this.p5Instance = new p5(sketchWrapper, this.canvas);
      
      this.isRunning = true;
      this.startUpdateLoop();
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Creates the sketch function with OpenVJ bridge injected
   */
  private createSketchWrapper(): (p: p5) => void {
    const sketchCode = this.sketch.code;
    const ctx = this.context;

    return (p: p5) => {
      // Store reference to update context later
      const self = this;

      // Override setup to inject canvas creation
      p.setup = () => {
        try {
          // Create canvas with correct renderer
          if (this.sketch.mode === 'WEBGL') {
            p.createCanvas(this.sketch.width, this.sketch.height, p.WEBGL);
          } else {
            p.createCanvas(this.sketch.width, this.sketch.height);
          }

          // Inject OpenVJ globals
          (p as any).openvj = {
            audio: {
              getLow: () => ctx.audio.uAudioLow,
              getMid: () => ctx.audio.uAudioMid,
              getHigh: () => ctx.audio.uAudioHigh,
              getAvg: () => ctx.audio.uAudioAvg,
              getBeat: () => ctx.audio.uBeat,
              getBpm: () => ctx.audio.uBpm
            },
            midi: {
              getCC: (cc: number) => ctx.midi.knobs[cc] ?? 0,
              getButton: (note: number) => ctx.midi.buttons[note] ?? false
            },
            width: ctx.width,
            height: ctx.height
          };

          // Add FFT-like functions for compatibility
          (p as any).fft = {
            analyze: () => [ctx.audio.uAudioLow, ctx.audio.uAudioMid, ctx.audio.uAudioHigh],
            getEnergy: (band?: string) => {
              switch (band) {
                case 'bass': return ctx.audio.uAudioLow;
                case 'lowMid': return ctx.audio.uAudioMid;
                case 'mid': return ctx.audio.uAudioMid;
                case 'highMid': case 'treble': return ctx.audio.uAudioHigh;
                default: return ctx.audio.uAudioAvg;
              }
            }
          };

          // Execute user's setup code if provided in sketch
          if (sketchCode.includes('function setup()')) {
            // Let the user's setup override our defaults
            const userSetup = new Function('p', `
              ${sketchCode}
              if (typeof setup === 'function') setup();
            `);
            userSetup(p);
          } else {
            // No user setup, execute full sketch
            const userSketch = new Function('p', sketchCode);
            userSketch(p);
          }
        } catch (error) {
          self.handleError(error as Error);
        }
      };

      // Override draw to inject uniforms before user draw
      const originalDraw = p.draw;
      p.draw = () => {
        try {
          // Update time
          ctx.audio.uTime = p.millis() / 1000;
          ctx.audio.uDeltaTime = p.deltaTime;

          // Call original draw if it exists
          if (originalDraw) {
            originalDraw.call(p);
          } else {
            // Execute sketch code directly
            const userDraw = new Function('p', `
              ${sketchCode}
              if (typeof draw === 'function') draw();
            `);
            userDraw(p);
          }

          // Update texture
          self.texture.needsUpdate = true;
          if (self.onTextureUpdate) {
            self.onTextureUpdate();
          }
        } catch (error) {
          self.handleError(error as Error);
        }
      };
    };
  }

  /**
   * Start the update loop to sync with OpenVJ's audio engine
   */
  private startUpdateLoop(): void {
    const update = () => {
      if (!this.isRunning) return;

      // Get current audio data from audio engine
      this.context.audio.uAudioLow = audioEngine.low * 255;
      this.context.audio.uAudioMid = audioEngine.mid * 255;
      this.context.audio.uAudioHigh = audioEngine.high * 255;
      this.context.audio.uAudioAvg = (audioEngine.low + audioEngine.mid + audioEngine.high) / 3 * 255;
      this.context.audio.uBeat = audioEngine.beat;
      this.context.audio.uBpm = audioEngine.bpm;

      this.animationId = requestAnimationFrame(update);
    };

    this.animationId = requestAnimationFrame(update);
  }

  /**
   * Handle errors from sketch execution
   */
  private handleError(error: Error): void {
    console.error('[P5JsSource] Sketch error:', error);
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.errorHandler) {
      this.errorHandler(error);
    }
  }

  /**
   * Set error handler callback
   */
  onError(handler: (error: Error) => void): void {
    this.errorHandler = handler;
  }

  /**
   * Get the Three.js texture for this sketch
   */
  getTexture(): THREE.CanvasTexture {
    return this.texture;
  }

  /**
   * Update MIDI state
   */
  updateMidi(cc: number, value: number): void {
    if (cc >= 0 && cc < 128) {
      this.context.midi.knobs[cc] = value;
    }
  }

  /**
   * Resize the sketch canvas
   */
  resize(width: number, height: number): void {
    this.context.width = width;
    this.context.height = height;
    
    if (this.p5Instance) {
      this.p5Instance.resizeCanvas(width, height);
    }

    // Recreate texture with new dimensions
    this.canvas.width = width;
    this.canvas.height = height;
    this.texture.dispose();
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.colorSpace = THREE.SRGBColorSpace;
  }

  /**
   * Get current canvas for preview
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Pause the sketch
   */
  pause(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.p5Instance) {
      this.p5Instance.noLoop();
    }
  }

  /**
   * Resume the sketch
   */
  resume(): void {
    this.isRunning = true;
    if (this.p5Instance) {
      this.p5Instance.loop();
    }
    this.startUpdateLoop();
  }

  /**
   * Stop and cleanup
   */
  dispose(): void {
    this.isRunning = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.p5Instance) {
      this.p5Instance.remove();
      this.p5Instance = null;
    }

    this.texture.dispose();
  }
}

/**
 * P5JsEngine - Manages multiple p5.js sources
 */
export class P5JsEngine {
  private sources: Map<string, P5JsSource> = new Map();

  /**
   * Create a new p5.js source from sketch code
   */
  createSource(sketch: P5JsSketch, onTextureUpdate?: () => void): P5JsSource {
    const source = new P5JsSource(sketch, onTextureUpdate);
    this.sources.set(sketch.id, source);
    return source;
  }

  /**
   * Get a source by ID
   */
  getSource(id: string): P5JsSource | undefined {
    return this.sources.get(id);
  }

  /**
   * Remove a source
   */
  removeSource(id: string): void {
    const source = this.sources.get(id);
    if (source) {
      source.dispose();
      this.sources.delete(id);
    }
  }

  /**
   * Update MIDI for all sources
   */
  updateMidiAll(cc: number, value: number): void {
    this.sources.forEach(source => {
      source.updateMidi(cc, value);
    });
  }

  /**
   * Dispose all sources
   */
  dispose(): void {
    this.sources.forEach(source => source.dispose());
    this.sources.clear();
  }
}

// Singleton instance
export const p5jsEngine = new P5JsEngine();
