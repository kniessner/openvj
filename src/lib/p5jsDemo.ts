/**
 * OpenVJ - p5.js Demo Performance Setup
 * 
 * Creates a demo scene with p5.js patterns for testing.
 */

import type { P5JsSketch } from '../lib/p5jsEngine';

// Demo sketch: Audio-reactive visualization
const audioVisualizerSketch: P5JsSketch = {
  id: 'demo-audio-viz',
  name: 'Audio Visualizer',
  code: `
// Audio-reactive visualization
// Uses: openvj.audio.getLow(), getMid(), getHigh(), getBeat()

let particles = [];
let numParticles = 50;

function setup() {
  createCanvas(512, 512);
  colorMode(HSB, 360, 100, 100);
  
  // Initialize particles
  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      vx: random(-2, 2),
      vy: random(-2, 2),
      size: random(5, 20),
      hue: random(360)
    });
  }
}

function draw() {
  // Get audio data
  const bass = openvj.audio.getLow() / 255;
  const mid = openvj.audio.getMid() / 255;
  const treble = openvj.audio.getHigh() / 255;
  const beat = openvj.audio.getBeat();
  
  // Beat reactive background
  const bgBrightness = 5 + beat * 20;
  background(240, 10, bgBrightness);
  
  // Draw concentric circles based on frequencies
  noFill();
  strokeWeight(2 + bass * 5);
  
  for (let i = 0; i < 5; i++) {
    const radius = 50 + i * 40 + bass * 100;
    const hue = (frameCount * 2 + i * 30 + beat * 60) % 360;
    stroke(hue, 80, 100, 0.8);
    circle(width/2, height/2, radius * 2);
  }
  
  // Update and draw particles
  for (let p of particles) {
    // Audio affects movement
    p.vx += (noise(p.x * 0.01, p.y * 0.01, frameCount * 0.01) - 0.5) * 0.5;
    p.vy += (noise(p.x * 0.01 + 100, p.y * 0.01, frameCount * 0.01) - 0.5) * 0.5;
    
    // Beat gives burst energy
    if (beat > 0.5) {
      p.vx *= 1.5;
      p.vy *= 1.5;
    }
    
    p.x += p.vx * (1 + mid * 2);
    p.y += p.vy * (1 + mid * 2);
    
    // Damping
    p.vx *= 0.98;
    p.vy *= 0.98;
    
    // Wrap around
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;
    
    // Draw particle
    const size = p.size * (1 + treble);
    const brightness = 50 + bass * 50;
    fill(p.hue, 80, brightness, 0.7);
    noStroke();
    circle(p.x, p.y, size);
    
    // Glow effect on beat
    if (beat > 0.5) {
      fill(p.hue, 40, 100, 0.3);
      circle(p.x, p.y, size * 2);
    }
  }
  
  // Frequency bars at bottom
  const barWidth = width / 32;
  for (let i = 0; i < 32; i++) {
    const h = map(noise(i, frameCount * 0.1) * bass + noise(i * 2, frameCount * 0.05) * mid, 0, 2, 0, 150);
    const hue = (frameCount + i * 10) % 360;
    fill(hue, 80, 100);
    rect(i * barWidth, height - h, barWidth - 2, h);
  }
}
`,
  mode: '2D',
  width: 512,
  height: 512,
};

// Demo sketch: Geometric patterns
const geometricSketch: P5JsSketch = {
  id: 'demo-geometric',
  name: 'Geometric Patterns',
  code: `
// Geometric patterns with MIDI and audio control
// MIDI: CC 1 = rotation speed, CC 2 = color shift

let angle = 0;
let shapes = [];
const numShapes = 12;

function setup() {
  createCanvas(512, 512, WEBGL);
  colorMode(HSB, 360, 100, 100);
  
  for (let i = 0; i < numShapes; i++) {
    shapes.push({
      angle: (TWO_PI / numShapes) * i,
      radius: 50 + i * 15,
      speed: 0.02 + (i % 3) * 0.01
    });
  }
}

function draw() {
  const bass = openvj.audio.getLow() / 255;
  const beat = openvj.audio.getBeat();
  const rotSpeed = openvj.midi.getCC ? openvj.midi.getCC(1) : 0.5;
  const colorShift = openvj.midi.getCC ? openvj.midi.getCC(2) : 0;
  
  background(0);
  
  // Camera movement
  rotateX(frameCount * 0.005);
  rotateY(frameCount * 0.003);
  
  // Draw torus field
  for (let s of shapes) {
    push();
    
    // Orbit motion
    const r = s.radius + bass * 100;
    const x = cos(s.angle + angle * s.speed * (1 + rotSpeed)) * r;
    const y = sin(s.angle + angle * s.speed * (1 + rotSpeed)) * r;
    const z = sin(frameCount * 0.02 + s.angle * 2) * 50;
    
    translate(x, y, z);
    rotateX(angle * 2);
    rotateY(angle);
    
    // Color based on audio and MIDI
    const hue = (frameCount * 0.5 + s.angle * 30 + colorShift * 360) % 360;
    const sat = 60 + bass * 40;
    const bri = 80 + beat * 20;
    
    stroke(hue, sat, bri);
    strokeWeight(2 + beat * 2);
    noFill();
    
    // Shape morphing based on audio
    const size = 20 + bass * 30;
    if (i % 3 === 0) {
      torus(size, size * 0.3);
    } else if (i % 3 === 1) {
      box(size);
    } else {
      sphere(size * 0.8);
    }
    pop();
  }
  
  // Update rotation
  angle += 0.02 + beat * 0.1;
  
  // Center glow on beat
  if (beat > 0.5) {
    push();
    noStroke();
    for (let i = 5; i > 0; i--) {
      fill(0, 0, 100, 0.1);
      sphere(i * 20);
    }
    pop();
  }
}
`,
  mode: 'WEBGL',
  width: 512,
  height: 512,
};

// Demo sketch: Particle fire
const particleFireSketch: P5JsSketch = {
  id: 'demo-fire',
  name: 'Particle Fire',
  code: `
// Particle fire effect
// Responds to bass for intensity, beat for bursts

let particles = [];
let maxParticles = 200;

function setup() {
  createCanvas(512, 512);
  colorMode(HSB, 360, 100, 100);
}

function draw() {
  const bass = openvj.audio.getLow() / 255;
  const beat = openvj.audio.getBeat();
  
  // Fade background
  background(0, 0, 0, 0.1);
  
  // Add new particles
  const spawnRate = 2 + bass * 10 + (beat > 0.5 ? 20 : 0);
  for (let i = 0; i < spawnRate; i++) {
    if (particles.length < maxParticles) {
      particles.push({
        x: width / 2 + random(-50, 50) * (1 + bass),
        y: height - 20,
        vx: random(-1, 1) * (1 + bass),
        vy: -random(2, 5) - bass * 5,
        size: random(10, 30),
        life: 1.0,
        hue: random(0, 60)
      });
    }
  }
  
  // Update and draw particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1; // gravity
    p.life -= 0.01;
    p.size *= 0.98;
    
    if (p.life <= 0 || p.size < 1) {
      particles.splice(i, 1);
      continue;
    }
    
    // Draw
    noStroke();
    fill(p.hue, 80, map(p.life, 0, 1, 50, 100), p.life * 0.5);
    circle(p.x, p.y, p.size);
    
    // Inner core
    fill(p.hue + 10, 40, 100, p.life);
    circle(p.x, p.y, p.size * 0.5);
  }
  
  // Update trail count display
  fill(0, 0, 100);
  // text('Particles: ' + particles.length, 10, 20);
}
`,
  mode: '2D',
  width: 512,
  height: 512,
};

// Demo performance layer configuration
export interface DemoLayerConfig {
  opacity: number;
  blendMode: 'NORMAL' | 'ADD' | 'MULTIPLY' | 'SCREEN';
  isPlaying: boolean;
}

export const demoLayerConfigs: { config: DemoLayerConfig; sketch: P5JsSketch }[] = [
  {
    config: {
      opacity: 0.8,
      blendMode: 'ADD',
      isPlaying: true,
    },
    sketch: audioVisualizerSketch,
  },
  {
    config: {
      opacity: 0.6,
      blendMode: 'SCREEN',
      isPlaying: true,
    },
    sketch: geometricSketch,
  },
  {
    config: {
      opacity: 0.5,
      blendMode: 'ADD',
      isPlaying: false, // Start paused, toggle to use
    },
    sketch: particleFireSketch,
  },
];

// Surface configuration for projection mapping demo
export interface SurfaceConfig {
  id: string;
  name: string;
  type: string;
  assetId?: string;
  corners: { x: number; y: number; u: number; v: number }[];
}

// Demo surfaces arranged for projection mapping
export const demoSurfaces: SurfaceConfig[] = [
  {
    id: 'center-main',
    name: 'Center Main',
    type: 'quad',
    corners: [
      { x: -2, y: 2, u: 0, v: 0 },
      { x: 2, y: 2, u: 1, v: 0 },
      { x: 2, y: -2, u: 1, v: 1 },
      { x: -2, y: -2, u: 0, v: 1 },
    ],
  },
  {
    id: 'left-sat',
    name: 'Left Satellite',
    type: 'quad',
    corners: [
      { x: -4, y: 1, u: 0, v: 0 },
      { x: -2.5, y: 1.5, u: 1, v: 0 },
      { x: -2.5, y: -0.5, u: 1, v: 1 },
      { x: -4, y: -1, u: 0, v: 1 },
    ],
  },
  {
    id: 'right-sat',
    name: 'Right Satellite',
    type: 'quad',
    corners: [
      { x: 2.5, y: 1.5, u: 0, v: 0 },
      { x: 4, y: 1, u: 1, v: 0 },
      { x: 4, y: -1, u: 1, v: 1 },
      { x: 2.5, y: -0.5, u: 0, v: 1 },
    ],
  },
  {
    id: 'top-arch',
    name: 'Top Arch',
    type: 'quad',
    corners: [
      { x: -1, y: 3.5, u: 0, v: 0 },
      { x: 1, y: 3.5, u: 1, v: 0 },
      { x: 1.5, y: 2.5, u: 1, v: 1 },
      { x: -1.5, y: 2.5, u: 0, v: 1 },
    ],
  },
];

// Performance tips display
export const performanceTips = `
🎛️ p5.js Performance Tips:

AUDIO (openvj.audio):
- getLow() / 255 - Bass (20-300Hz) for heavy impacts
- getMid() / 255 - Mids (300-4kHz) for rhythm
- getHigh() / 255 - Highs (4k-20kHz) for details
- getBeat() - Decaying beat pulse (use > 0.5 for triggers)

MIDI (openvj.midi):
- getCC(n) - Continuous controller values (0-1)
- Map CC 1-8 to effects parameters
- Use notes for scene triggers

PERFORMANCE:
- Limit particles: <500 for 60fps
- Use WEBGL for 3D, 2D for simpler effects
- Blend modes: ADD for glow, MULTIPLY for shadows
- Opacity control for layering

PROJECTION MAPPING:
- Create multiple surfaces
- Use UV mapping to fit content
- Layer p5.js sketches with different blend modes
- Combine with video/shader assets
`;
