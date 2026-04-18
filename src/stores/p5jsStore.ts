/**
 * OpenVJ - p5.js Store
 * 
 * Zustand store for managing p5.js layers/sketches
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { P5JsSketch, P5JsSource, p5jsEngine } from '../lib/p5jsEngine';

// Layer representing a p5.js sketch in the scene
export interface P5JsLayer {
  id: string;
  name: string;
  sketch: P5JsSketch;
  isPlaying: boolean;
  opacity: number;
  blendMode: 'NORMAL' | 'ADD' | 'MULTIPLY' | 'SCREEN';
  assignedSurfaceId?: string; // If mapped to a specific surface
}

interface P5JsState {
  // Layers
  layers: P5JsLayer[];
  activeLayerId: string | null;
  
  // Sources (runtime instances)
  sources: Map<string, P5JsSource>;
  
  // Default template library
  templates: P5JsSketch[];
}

interface P5JsActions {
  // Layer management
  addLayer: (sketch?: P5JsSketch) => string;
  removeLayer: (id: string) => void;
  setActiveLayer: (id: string | null) => void;
  updateLayer: (id: string, updates: Partial<P5JsLayer>) => void;
  reorderLayers: (layerIds: string[]) => void;
  
  // Sketch code editing
  updateSketchCode: (layerId: string, code: string) => void;
  updateSketchName: (layerId: string, name: string) => void;
  
  // Playback
  playLayer: (id: string) => void;
  pauseLayer: (id: string) => void;
  toggleLayer: (id: string) => void;
  
  // Surface assignment
  assignToSurface: (layerId: string, surfaceId: string | undefined) => void;
  
  // Template management
  loadTemplate: (templateId: string) => string;
  addTemplate: (template: P5JsSketch) => void;
  
  // Source management
  getOrCreateSource: (layerId: string) => P5JsSource | null;
  removeSource: (layerId: string) => void;
  
  // Layer opacity/blend
  setLayerOpacity: (id: string, opacity: number) => void;
  setLayerBlendMode: (id: string, mode: P5JsLayer['blendMode']) => void;
  
  // Import/Export
  exportLayer: (id: string) => string;
  importLayer: (json: string) => string;
  
  // Cleanup
  dispose: () => void;
}

// Default templates library
const DEFAULT_TEMPLATES: P5JsSketch[] = [
  {
    id: 'template-audio-waveform',
    name: 'Audio Waveform',
    mode: '2D',
    width: 1920,
    height: 1080,
    code: `function setup() {
  createCanvas(800, 600);
  noFill();
}

function draw() {
  background(0, 20);
  
  const bass = openvj.audio.getLow() / 255;
  const mid = openvj.audio.getMid() / 255;
  const high = openvj.audio.getHigh() / 255;
  
  stroke(100 + bass * 155, 200, 255 - high * 100);
  strokeWeight(2 + bass * 5);
  
  beginShape();
  for (let x = 0; x < width; x += 10) {
    const y = height/2 + sin(x * 0.01 + frameCount * 0.05) * 100 * mid;
    vertex(x, y);
  }
  endShape();
}`
  },
  {
    id: 'template-particles',
    name: 'Particle System',
    mode: 'WEBGL',
    width: 1920,
    height: 1080,
    code: `let particles = [];

function setup() {
  createCanvas(800, 600, WEBGL);
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: random(-400, 400),
      y: random(-300, 300),
      z: random(-200, 200),
      vx: random(-2, 2),
      vy: random(-2, 2),
      vz: random(-2, 2),
      size: random(5, 20)
    });
  }
}

function draw() {
  background(0);
  
  const bass = openvj.audio.getLow() / 255;
  const mid = openvj.audio.getMid() / 255;
  
  rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.01 + bass);
  
  noStroke();
  
  particles.forEach(p => {
    p.x += p.vx * (1 + bass);
    p.y += p.vy;
    p.z += p.vz;
    
    // Wrap around
    if (p.x > 400) p.x = -400;
    if (p.x < -400) p.x = 400;
    if (p.y > 300) p.y = -300;
    if (p.y < -300) p.y = 300;
    if (p.z > 200) p.z = -200;
    if (p.z < -200) p.z = 200;
    
    push();
    translate(p.x, p.y, p.z);
    fill(100 + mid * 155, 200, 255);
    sphere(p.size * (1 + bass));
    pop();
  });
}`
  },
  {
    id: 'template-kaleidoscope',
    name: 'Kaleidoscope',
    mode: '2D',
    width: 1920,
    height: 1080,
    code: `let segments = 8;

function setup() {
  createCanvas(800, 600);
}

function draw() {
  background(0, 50);
  translate(width/2, height/2);
  
  const bass = openvj.audio.getLow() / 255;
  segments = floor(map(openvj.midi.getCC(1), 0, 127, 3, 24));
  
  const angle = TWO_PI / segments;
  
  for (let i = 0; i < segments; i++) {
    push();
    rotate(angle * i + frameCount * 0.01);
    
    fill(255, 100 + bass * 100, 150);
    noStroke();
    
    const size = 50 + bass * 100;
    ellipse(100, 0, size, size * 0.6);
    
    // Add some variation
    fill(100, 255, 200, 150);
    ellipse(150, 50, size * 0.5, size * 0.5);
    
    pop();
  }
}`
  },
  {
    id: 'template-neon-grid',
    name: 'Neon Grid',
    mode: 'WEBGL',
    width: 1920,
    height: 1080,
    code: `function setup() {
  createCanvas(800, 600, WEBGL);
}

function draw() {
  background(5, 5, 15);
  
  const bass = openvj.audio.getLow() / 255;
  const mid = openvj.audio.getMid() / 255;
  const beat = openvj.audio.getBeat();
  
  // Camera movement
  rotateX(frameCount * 0.005);
  rotateZ(frameCount * 0.003);
  
  stroke(0, 255, 255);
  strokeWeight(1);
  noFill();
  
  // Draw grid
  const gridSize = 20;
  const spacing = 40;
  
  for (let x = -gridSize; x <= gridSize; x++) {
    for (let z = -gridSize; z <= gridSize; z++) {
      const y = sin(x * 0.1 + z * 0.1 + frameCount * 0.05) * 50 * mid;
      const dist = sqrt(x*x + z*z);
      
      // Color based on distance and audio
      const r = map(sin(dist * 0.1 + frameCount * 0.05), -1, 1, 0, 255) * bass;
      const g = 255;
      const b = 200 + beat * 55;
      
      stroke(r, g, b);
      
      push();
      translate(x * spacing, y, z * spacing);
      box(10);
      pop();
    }
  }
}`
  },
  {
    id: 'template-liquid',
    name: 'Liquid Flow',
    mode: '2D',
    width: 1920,
    height: 1080,
    code: `let particles = [];
const NUM_PARTICLES = 200;

function setup() {
  createCanvas(800, 600);
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      vx: 0,
      vy: 0,
      hue: random(360)
    });
  }
  colorMode(HSB, 360, 100, 100, 100);
}

function draw() {
  background(0, 0, 0, 10);
  
  const bass = openvj.audio.getLow() / 255;
  const mid = openvj.audio.getMid() / 255;
  
  particles.forEach(p => {
    // Perlin noise flow field
    const angle = noise(p.x * 0.003, p.y * 0.003, frameCount * 0.01) * TWO_PI * 2;
    
    p.vx += cos(angle) * 0.1;
    p.vy += sin(angle) * 0.1;
    
    // Audio pushes particles
    p.vx += (random(-1, 1) * bass);
    p.vy += (random(-1, 1) * bass);
    
    // Friction
    p.vx *= 0.95;
    p.vy *= 0.95;
    
    p.x += p.vx;
    p.y += p.vy;
    
    // Wrap
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;
    
    // Draw
    noStroke();
    fill(p.hue, 80, 100, 50);
    ellipse(p.x, p.y, 3 + mid * 10);
    
    // Update hue
    p.hue = (p.hue + 0.5) % 360;
  });
}`
  }
];

// Starter template for new sketches
const EMPTY_SKETCH: P5JsSketch = {
  id: '',
  name: 'New Sketch',
  mode: '2D',
  width: 1920,
  height: 1080,
  code: `function setup() {
  createCanvas(800, 600);
}

function draw() {
  background(0);
  
  // Access audio: openvj.audio.getLow(), getMid(), getHigh(), getBeat(), getBpm()
  // Access MIDI: openvj.midi.getCC(1)
  
  fill(255);
  const size = openvj.audio.getLow() / 255 * 200;
  circle(width/2, height/2, size);
}`
};

export const useP5JsStore = create<P5JsState & P5JsActions>()(
  persist(
    (set, get) => ({
      // Initial state
      layers: [],
      activeLayerId: null,
      sources: new Map(),
      templates: DEFAULT_TEMPLATES,

      // Add new layer
      addLayer: (sketch?: P5JsSketch) => {
        const id = `p5-${Date.now()}`;
        const newLayer: P5JsLayer = {
          id,
          name: sketch?.name || `p5.js Layer ${get().layers.length + 1}`,
          sketch: {
            ...(sketch || EMPTY_SKETCH),
            id,
            name: sketch?.name || `Sketch ${get().layers.length + 1}`
          },
          isPlaying: true,
          opacity: 1,
          blendMode: 'NORMAL'
        };

        set((state) => ({
          layers: [...state.layers, newLayer],
          activeLayerId: id
        }));

        // Create source immediately
        get().getOrCreateSource(id);

        return id;
      },

      // Remove layer
      removeLayer: (id: string) => {
        // Dispose source
        get().removeSource(id);

        set((state) => ({
          layers: state.layers.filter(l => l.id !== id),
          activeLayerId: state.activeLayerId === id 
            ? (state.layers.find(l => l.id !== id)?.id || null)
            : state.activeLayerId
        }));
      },

      // Set active layer
      setActiveLayer: (id: string | null) => {
        set({ activeLayerId: id });
      },

      // Update layer properties
      updateLayer: (id: string, updates: Partial<P5JsLayer>) => {
        set((state) => ({
          layers: state.layers.map(l =>
            l.id === id ? { ...l, ...updates } : l
          )
        }));
      },

      // Reorder layers
      reorderLayers: (layerIds: string[]) => {
        set((state) => ({
          layers: layerIds
            .map(id => state.layers.find(l => l.id === id))
            .filter((l): l is P5JsLayer => l !== undefined)
        }));
      },

      // Update sketch code
      updateSketchCode: (layerId: string, code: string) => {
        set((state) => ({
          layers: state.layers.map(l =>
            l.id === layerId
              ? { ...l, sketch: { ...l.sketch, code } }
              : l
          )
        }));

        // Recreate source with new code
        get().removeSource(layerId);
        get().getOrCreateSource(layerId);
      },

      // Update sketch name
      updateSketchName: (layerId: string, name: string) => {
        set((state) => ({
          layers: state.layers.map(l =>
            l.id === layerId
              ? { ...l, sketch: { ...l.sketch, name } }
              : l
          )
        }));
      },

      // Playback controls
      playLayer: (id: string) => {
        const source = get().sources.get(id);
        if (source) {
          source.resume();
        }
        get().updateLayer(id, { isPlaying: true });
      },

      pauseLayer: (id: string) => {
        const source = get().sources.get(id);
        if (source) {
          source.pause();
        }
        get().updateLayer(id, { isPlaying: false });
      },

      toggleLayer: (id: string) => {
        const layer = get().layers.find(l => l.id === id);
        if (layer?.isPlaying) {
          get().pauseLayer(id);
        } else {
          get().playLayer(id);
        }
      },

      // Assign to surface
      assignToSurface: (layerId: string, surfaceId: string | undefined) => {
        get().updateLayer(layerId, { assignedSurfaceId: surfaceId });
      },

      // Load template
      loadTemplate: (templateId: string) => {
        const template = get().templates.find(t => t.id === templateId);
        if (template) {
          return get().addLayer(template);
        }
        return '';
      },

      // Add custom template
      addTemplate: (template: P5JsSketch) => {
        set((state) => ({
          templates: [...state.templates, template]
        }));
      },

      // Get or create source
      getOrCreateSource: (layerId: string) => {
        const { sources, layers } = get();
        
        if (sources.has(layerId)) {
          return sources.get(layerId)!;
        }

        const layer = layers.find(l => l.id === layerId);
        if (!layer) return null;

        const source = p5jsEngine.createSource(layer.sketch, () => {
          // Texture update callback
        });

        set((state) => {
          const newSources = new Map(state.sources);
          newSources.set(layerId, source);
          return { sources: newSources };
        });

        return source;
      },

      // Remove source
      removeSource: (layerId: string) => {
        const { sources } = get();
        const source = sources.get(layerId);
        if (source) {
          source.dispose();
        }
        
        set((state) => {
          const newSources = new Map(state.sources);
          newSources.delete(layerId);
          return { sources: newSources };
        });
      },

      // Set opacity
      setLayerOpacity: (id: string, opacity: number) => {
        get().updateLayer(id, { opacity });
      },

      // Set blend mode
      setLayerBlendMode: (id: string, mode: P5JsLayer['blendMode']) => {
        get().updateLayer(id, { blendMode: mode });
      },

      // Export layer
      exportLayer: (id: string) => {
        const layer = get().layers.find(l => l.id === id);
        if (!layer) return '';
        
        return JSON.stringify({
          name: layer.name,
          sketch: layer.sketch,
          version: '1.0'
        }, null, 2);
      },

      // Import layer
      importLayer: (json: string) => {
        try {
          const data = JSON.parse(json);
          const sketch: P5JsSketch = {
            ...data.sketch,
            id: '', // Will be assigned by addLayer
          };
          return get().addLayer(sketch);
        } catch (error) {
          console.error('Failed to import layer:', error);
          return '';
        }
      },

      // Cleanup
      dispose: () => {
        const { sources } = get();
        sources.forEach(source => source.dispose());
        
        set({
          sources: new Map(),
          layers: [],
          activeLayerId: null
        });
      }
    }),
    {
      name: 'openvj-p5js-storage',
      partialize: (state) => ({
        layers: state.layers.map(l => ({
          ...l,
          // Don't persist runtime source
        })),
        activeLayerId: state.activeLayerId,
        templates: state.templates
      })
    }
  )
);
