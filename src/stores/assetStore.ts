import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UjiParams } from '../lib/ujiRenderer'

export type { UjiParams }

export type AssetType = 'video' | 'image' | 'shader' | 'webcam' | 'screencapture' | 'uji' | 'p5js'

export interface Asset {
  id: string
  type: AssetType
  name: string
  // video / image: ephemeral object URL (not persisted)
  url?: string
  // shader: GLSL fragment code (persisted)
  shaderCode?: string
  // GIF / animated image
  isAnimated?: boolean
  // uji: generator params (persisted)
  ujiParams?: UjiParams
  // p5js: sketch code and config (persisted)
  p5jsCode?: string
  p5jsMode?: '2D' | 'WEBGL'
}

export const DEFAULT_SHADER = `// Uniforms available:
//   uniform float uTime;        seconds since load
//   uniform vec2  uResolution;  canvas size in px
//   uniform float uAudioLow;    0..1  bass energy (20-300 Hz)
//   uniform float uAudioMid;    0..1  mid energy  (300-4k Hz)
//   uniform float uAudioHigh;   0..1  high energy (4k-20k Hz)
//   uniform float uBeat;        0..1  decaying beat pulse

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float t  = uTime * 0.4;
  vec3 col = 0.5 + 0.5 * cos(t + uv.xyx + vec3(0.0, 2.0, 4.0));
  gl_FragColor = vec4(col, 1.0);
}`

const uid = () => Math.random().toString(36).slice(2, 9)

// ─── Built-in example shaders ─────────────────────────────────────────────────

const EXAMPLES: Omit<Asset, 'id'>[] = [
  {
    type: 'shader',
    name: 'Plasma Wave',
    shaderCode: `void main() {
  vec2 uv = gl_FragCoord.xy / uResolution - 0.5;
  uv.x *= uResolution.x / uResolution.y;
  float t = uTime * 0.5;
  float v = sin(uv.x * 10.0 + t)
          + sin(uv.y * 10.0 + t * 1.3)
          + sin((uv.x + uv.y) * 8.0 + t * 0.7)
          + sin(length(uv) * 12.0 - t * 2.0);
  vec3 col = 0.5 + 0.5 * cos(v + vec3(0.0, 1.047, 2.094));
  gl_FragColor = vec4(col, 1.0);
}`,
  },
  {
    type: 'shader',
    name: 'Tunnel',
    shaderCode: `void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);
  float a = atan(uv.y, uv.x);
  float r = length(uv);
  float t = uTime * 0.5;
  vec2 tc = vec2(a / 3.14159, 0.3 / r + t);
  float stripes = step(0.5, fract(tc.x * 8.0));
  float rings   = step(0.5, fract(tc.y * 4.0));
  float pattern = mix(stripes, rings, 0.5);
  vec3 col = vec3(0.1, 0.4, 0.9) * pattern + vec3(0.9, 0.2, 0.5) * (1.0 - pattern);
  col *= smoothstep(2.0, 0.2, r);
  gl_FragColor = vec4(col, 1.0);
}`,
  },
  {
    type: 'shader',
    name: 'Kaleidoscope',
    shaderCode: `void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);
  float a = atan(uv.y, uv.x);
  float r = length(uv);
  float seg = 6.28318 / 8.0;
  a = mod(a, seg);
  a = abs(a - seg * 0.5);
  vec2 p = vec2(cos(a), sin(a)) * r;
  float t = uTime * 0.3;
  vec3 col = 0.5 + 0.5 * cos(p.x * 5.0 + t * vec3(1.0, 0.7, 0.4)
           + p.y * 5.0 + vec3(0.0, 2.0, 4.0));
  gl_FragColor = vec4(col, 1.0);
}`,
  },
  {
    type: 'shader',
    name: 'Lava Lamp',
    shaderCode: `float n(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = fract(sin(dot(i,            vec2(127.1,311.7))) * 43758.5);
  float b = fract(sin(dot(i+vec2(1,0), vec2(127.1,311.7))) * 43758.5);
  float c = fract(sin(dot(i+vec2(0,1), vec2(127.1,311.7))) * 43758.5);
  float d = fract(sin(dot(i+vec2(1,1), vec2(127.1,311.7))) * 43758.5);
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float t = uTime * 0.3;
  float v = n(uv*4.0+t)*0.5 + n(uv*8.0-t*0.7)*0.25 + n(uv*16.0+t*0.5)*0.125;
  vec3 col = mix(vec3(1.0,0.1,0.0), vec3(1.0,0.8,0.0), v);
  col = mix(col, vec3(0.05,0.0,0.0), smoothstep(0.55, 0.8, v));
  gl_FragColor = vec4(col, 1.0);
}`,
  },
  {
    type: 'shader',
    name: 'Neon Grid',
    shaderCode: `void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float t = uTime * 0.4;
  vec2 g1 = fract(uv * 8.0 + vec2(0.0, t)) - 0.5;
  float l1 = smoothstep(0.45, 0.5, max(abs(g1.x), abs(g1.y)));
  vec2 g2 = fract(uv * 20.0 + vec2(t * 0.5, 0.0)) - 0.5;
  float l2 = smoothstep(0.48, 0.5, max(abs(g2.x), abs(g2.y)));
  vec3 col = vec3(0.0, 0.8, 1.0) * l1 + vec3(1.0, 0.2, 0.8) * l2 * 0.6;
  col = pow(clamp(col, 0.0, 1.0), vec3(0.8));
  gl_FragColor = vec4(col, 1.0);
}`,
  },
  {
    type: 'shader',
    name: 'Starfield',
    shaderCode: `float h(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5); }
void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec3 col = vec3(0.0);
  float t = uTime * 0.08;
  for (int i = 0; i < 3; i++) {
    float sc = 8.0 + float(i) * 12.0;
    vec2 cell = floor(uv * sc + t);
    vec2 off  = fract(uv * sc + t) - 0.5;
    float s = 1.0 - smoothstep(0.0, 0.06, length(off));
    vec3 hue = mix(vec3(0.8,0.9,1.0), vec3(1.0,0.75,0.4), h(cell));
    col += s * hue * (1.0 - float(i) * 0.25);
  }
  gl_FragColor = vec4(col, 1.0);
}`,
  },
  // ── 3D / Raymarching ────────────────────────────────────────────────────────
  {
    type: 'shader',
    name: 'Sphere Field',
    shaderCode: `vec2 rot2(vec2 p, float a) { float c=cos(a),s=sin(a); return vec2(c*p.x-s*p.y,s*p.x+c*p.y); }
float sdSph(vec3 p, float r) { return length(p)-r; }
float mapSF(vec3 p) {
  p.z = mod(p.z + uTime*1.5, 5.0) - 2.5;
  p.xy = mod(p.xy + 2.5, 5.0) - 2.5;
  return sdSph(p, 0.8 + uAudioLow*0.4);
}
void main() {
  vec2 uv = (gl_FragCoord.xy*2.0 - uResolution) / min(uResolution.x, uResolution.y);
  vec3 ro = vec3(0.0), rd = normalize(vec3(uv, 1.5));
  float t = 0.1;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 48; i++) {
    vec3 p = ro + rd*t;
    float d = mapSF(p);
    if (d < 0.002) {
      float e = 0.001;
      vec3 n = normalize(vec3(
        mapSF(p+vec3(e,0,0))-mapSF(p-vec3(e,0,0)),
        mapSF(p+vec3(0,e,0))-mapSF(p-vec3(0,e,0)),
        mapSF(p+vec3(0,0,e))-mapSF(p-vec3(0,0,e))
      ));
      float diff = clamp(dot(n, normalize(vec3(1,2,-1))), 0.0, 1.0);
      float fr   = pow(1.0 - abs(dot(n,-rd)), 4.0);
      vec3 hue = vec3(0.3+uAudioLow, 0.1+uAudioMid*0.5, 0.9);
      col = (hue*diff + fr*vec3(0.8,0.9,1.0) + uBeat*0.4) * exp(-t*0.04);
      break;
    }
    t += max(d*0.7, 0.01);
    if (t > 25.0) break;
  }
  gl_FragColor = vec4(col, 1.0);
}`,
  },
  {
    type: 'shader',
    name: 'Neon Rings',
    shaderCode: `float torus(vec3 p, float R, float r) { return length(vec2(length(p.xy)-R, p.z))-r; }
float mapNR(vec3 p) {
  p.z = mod(p.z + uTime*(1.5+uAudioMid*2.0), 2.5);
  return torus(p, 0.8+uAudioLow*0.25, 0.04);
}
void main() {
  vec2 uv = (gl_FragCoord.xy*2.0 - uResolution) / min(uResolution.x, uResolution.y);
  vec3 ro = vec3(0.0), rd = normalize(vec3(uv, 2.0));
  float t = 0.05;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 64; i++) {
    vec3 p = ro + rd*t;
    float d = mapNR(p);
    if (d < 0.001) {
      float e = 0.001;
      vec3 n = normalize(vec3(
        mapNR(p+vec3(e,0,0))-mapNR(p-vec3(e,0,0)),
        mapNR(p+vec3(0,e,0))-mapNR(p-vec3(0,e,0)),
        mapNR(p+vec3(0,0,e))-mapNR(p-vec3(0,0,e))
      ));
      float fr = pow(1.0 - abs(dot(n,-rd)), 2.0);
      float hue = uTime*0.25 + t*0.07;
      vec3 c = 0.5 + 0.5*cos(hue + vec3(0.0, 2.094, 4.189));
      col = (c*0.6 + fr*0.7 + uBeat*vec3(0.5,0.2,0.0)) * exp(-t*0.07);
      break;
    }
    t += max(d*0.9, 0.005);
    if (t > 20.0) break;
  }
  gl_FragColor = vec4(col, 1.0);
}`,
  },
  {
    type: 'shader',
    name: 'Synthwave Floor',
    shaderCode: `void main() {
  vec2 uv = (gl_FragCoord.xy*2.0 - uResolution) / min(uResolution.x, uResolution.y);
  vec3 ro = vec3(0.0, 1.0, 0.0);
  vec3 rd = normalize(vec3(uv.x, uv.y*0.55 - 0.45, 1.5));
  vec3 sky = mix(vec3(0.3,0.0,0.6), vec3(0.0,0.0,0.15), uv.y*0.6+0.5);
  sky += uBeat*vec3(0.4,0.1,0.0);
  if (rd.y > -0.01) { gl_FragColor = vec4(sky, 1.0); return; }
  float t = -ro.y / rd.y;
  vec2 pos = (ro + rd*t).xz;
  pos.y += uTime*(2.5 + uAudioLow*3.0);
  vec2 gf = abs(fract(pos) - 0.5);
  float lw = clamp(0.06/sqrt(t), 0.01, 0.45);
  float line = max(step(0.5-lw, gf.x), step(0.5-lw, gf.y));
  vec3 lc = mix(vec3(0.0,0.6,1.0), vec3(0.9,0.0,1.0), sin(pos.y*0.25)*0.5+0.5);
  lc += uBeat*0.5*vec3(1.0,0.6,0.0);
  lc *= exp(-t*0.15);
  vec3 col = mix(sky*exp(-t*0.15)*0.12, lc, line);
  gl_FragColor = vec4(clamp(col,0.0,1.0), 1.0);
}`,
  },
  {
    type: 'shader',
    name: 'Crystal Lattice',
    shaderCode: `vec2 rot2(vec2 p, float a) { float c=cos(a),s=sin(a); return vec2(c*p.x-s*p.y,s*p.x+c*p.y); }
float sdOct(vec3 p, float s) { p=abs(p); return (p.x+p.y+p.z-s)*0.57735027; }
float mapCL(vec3 p) {
  p.xz = rot2(p.xz, uTime*0.25);
  p.yz = rot2(p.yz, uTime*0.15);
  p = mod(p+1.5, 3.0) - 1.5;
  return sdOct(p, 0.55+uAudioLow*0.2);
}
void main() {
  vec2 uv = (gl_FragCoord.xy*2.0 - uResolution) / min(uResolution.x, uResolution.y);
  vec3 ro = vec3(0.0,0.5,-3.0), rd = normalize(vec3(uv, 1.5));
  float t = 0.1;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 56; i++) {
    vec3 p = ro + rd*t;
    float d = mapCL(p);
    if (d < 0.002) {
      float e = 0.001;
      vec3 n = normalize(vec3(
        mapCL(p+vec3(e,0,0))-mapCL(p-vec3(e,0,0)),
        mapCL(p+vec3(0,e,0))-mapCL(p-vec3(0,e,0)),
        mapCL(p+vec3(0,0,e))-mapCL(p-vec3(0,0,e))
      ));
      float diff = clamp(dot(n, normalize(vec3(1,2,1))), 0.0, 1.0);
      float fr = pow(1.0 - abs(dot(n,-rd)), 5.0);
      vec3 c = 0.5+0.5*cos(uTime*0.4 + n*2.5 + vec3(0.0,2.094,4.189));
      col = (c*diff*0.7 + fr*1.2 + uBeat*vec3(0.4,0.2,0.1)) * exp(-t*0.07);
      break;
    }
    t += max(d*0.65, 0.01);
    if (t > 20.0) break;
  }
  gl_FragColor = vec4(col, 1.0);
}`,
  },
  {
    type: 'shader',
    name: 'Warp Vortex',
    shaderCode: `void main() {
  vec2 uv = (gl_FragCoord.xy*2.0 - uResolution) / min(uResolution.x, uResolution.y);
  float r = length(uv);
  float a = atan(uv.y, uv.x);
  float spd = 1.0 + uAudioLow*2.5;
  float depth = spd*0.5 / max(r, 0.001);
  vec2 tc = vec2(
    a/3.14159 + uAudioMid*0.15,
    depth - uTime*(0.6 + uAudioLow*0.4)
  );
  float p1 = sin(tc.x*8.0 + sin(tc.y*3.0)*1.5)*0.5+0.5;
  float p2 = sin(tc.y*10.0 + uAudioHigh*3.0)*0.5+0.5;
  float pat = p1*p2;
  vec3 c = 0.5+0.5*cos(uTime*0.2 + depth*0.05 + vec3(0.0,2.094,4.189));
  vec3 col = pat*c;
  col += uBeat*0.5*vec3(1.0,0.5,0.0)*exp(-r*1.5);
  col *= 1.0 - smoothstep(0.7, 1.1, r);
  gl_FragColor = vec4(clamp(col,0.0,1.0), 1.0);
}`,
  },
  {
    type: 'shader',
    name: 'Floating Cubes',
    shaderCode: `vec2 rot2(vec2 p, float a) { float c=cos(a),s=sin(a); return vec2(c*p.x-s*p.y,s*p.x+c*p.y); }
float sdBox(vec3 p, vec3 b) { vec3 q=abs(p)-b; return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0); }
float mapFC(vec3 p) {
  p.xz = rot2(p.xz, uTime*(0.4+uAudioMid*0.3));
  p.yz = rot2(p.yz, uTime*0.3);
  p = mod(p+2.0, 4.0) - 2.0;
  return sdBox(p, vec3(0.5+uAudioLow*0.2));
}
void main() {
  vec2 uv = (gl_FragCoord.xy*2.0 - uResolution) / min(uResolution.x, uResolution.y);
  vec3 ro = vec3(0.0,0.0,-3.5), rd = normalize(vec3(uv, 1.5));
  float t = 0.1;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 48; i++) {
    vec3 p = ro + rd*t;
    float d = mapFC(p);
    if (d < 0.002) {
      float e = 0.001;
      vec3 n = normalize(vec3(
        mapFC(p+vec3(e,0,0))-mapFC(p-vec3(e,0,0)),
        mapFC(p+vec3(0,e,0))-mapFC(p-vec3(0,e,0)),
        mapFC(p+vec3(0,0,e))-mapFC(p-vec3(0,0,e))
      ));
      float diff = clamp(dot(n, normalize(vec3(1,2,-1))),0.0,1.0);
      float fr = pow(1.0-abs(dot(n,-rd)), 3.0);
      vec3 hue = 0.5+0.5*cos(uTime*0.3+vec3(0.0,2.094,4.189));
      col = (hue*(diff*0.7+0.2) + fr*0.8 + uBeat*vec3(0.4,0.2,0.0)) * exp(-t*0.07);
      break;
    }
    t += max(d*0.7, 0.01);
    if (t > 20.0) break;
  }
  gl_FragColor = vec4(col, 1.0);
}`,
  },
  // ── Audio-reactive ──────────────────────────────────────────────────────────
  {
    type: 'shader',
    name: 'Audio Pulse',
    shaderCode: `void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);
  float r = length(uv);
  float t = uTime;

  // Rings that push outward on beat
  float rings = sin(r * 14.0 - t * 5.0 - uBeat * 10.0) * 0.5 + 0.5;

  // Glow that tightens with bass
  float glow = exp(-r * (1.5 + uAudioLow * 5.0));

  // Hue shifts with frequency bands
  vec3 hue = vec3(0.8 + uAudioLow, 0.2 + uAudioMid * 0.6, 0.6 + uAudioHigh * 0.4);
  vec3 col  = hue * rings * glow;
  col      += glow * vec3(uBeat * 0.8, uBeat * 0.3, 0.0);

  gl_FragColor = vec4(col, 1.0);
}`,
  },
  {
    type: 'shader',
    name: 'Bass Impact',
    shaderCode: `void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);
  float r = length(uv);
  float t = uTime;

  // Shockwave ring on beat
  float wave = uBeat * exp(-r * 3.0) * sin(r * 30.0 - t * 20.0);

  // Background slow warp
  float bg = 0.5 + 0.5 * sin(r * 4.0 - t * uAudioLow * 4.0);

  vec3 shockCol = vec3(1.0, 0.4 + uAudioMid, uAudioHigh);
  vec3 bgCol    = vec3(uAudioLow * 0.3, uAudioMid * 0.1, 0.2 + uAudioHigh * 0.3);
  vec3 col = mix(bgCol * bg, shockCol, abs(wave));

  gl_FragColor = vec4(col, 1.0);
}`,
  },
  {
    type: 'shader',
    name: 'Spectrum Bars',
    shaderCode: `float hash(float n) { return fract(sin(n) * 43758.5); }
void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  // Divide into 16 columns, assign audio band
  float cols = 16.0;
  float col  = floor(uv.x * cols);
  float pos  = col / cols;

  // Low = left third, mid = centre, high = right third
  float band = pos < 0.33 ? uAudioLow
             : pos < 0.67 ? uAudioMid
             :               uAudioHigh;
  band += uBeat * 0.2 * (1.0 - pos);

  // Bar height with slight per-column noise
  float barH = band * (0.7 + hash(col) * 0.3);

  // Colour: low=red, mid=yellow, high=cyan
  vec3 loCol = vec3(1.0, 0.1, 0.1);
  vec3 miCol = vec3(1.0, 0.9, 0.0);
  vec3 hiCol = vec3(0.0, 0.9, 1.0);
  vec3 barCol = pos < 0.33 ? loCol : pos < 0.67 ? miCol : hiCol;

  float lit = step(uv.y, barH);
  // Gap between columns
  float gap = step(0.1, fract(uv.x * cols));
  vec3 col3 = barCol * lit * gap;

  // Floor glow
  col3 += barCol * 0.05 * gap;

  gl_FragColor = vec4(col3, 1.0);
}`,
  },
  {
    type: 'shader',
    name: 'Neon Storm',
    shaderCode: `float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }
void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float t  = uTime * (0.5 + uAudioMid * 2.0);

  vec3 col = vec3(0.0);

  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    vec2 grid = uv * (2.0 + fi * 3.0) + vec2(t * (0.1 + fi * 0.07), t * 0.13);
    vec2 cell = floor(grid);
    vec2 off  = fract(grid) - 0.5;

    float h = hash21(cell + fi * 7.3);
    float flicker = step(0.5, sin(h * 100.0 + t * (3.0 + uAudioHigh * 10.0)));
    float star = 1.0 - smoothstep(0.0, 0.15, length(off));

    vec3 hue = mix(
      vec3(0.0, 0.5, 1.0),
      vec3(1.0, 0.0, 0.8),
      h
    );
    col += star * flicker * hue * (uAudioLow * 0.5 + 0.3 + uBeat * 0.5);
  }

  col = pow(clamp(col, 0.0, 1.0), vec3(0.8));
  gl_FragColor = vec4(col, 1.0);
}`,
  },
  {
    type: 'shader',
    name: 'Frequency Wave',
    shaderCode: `float n(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f*f*(3.0-2.0*f);
  float a = fract(sin(dot(i,            vec2(127.1,311.7)))*43758.5);
  float b = fract(sin(dot(i+vec2(1,0), vec2(127.1,311.7)))*43758.5);
  float c = fract(sin(dot(i+vec2(0,1), vec2(127.1,311.7)))*43758.5);
  float d = fract(sin(dot(i+vec2(1,1), vec2(127.1,311.7)))*43758.5);
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  // Waving noise displaced by audio bands
  float warp = n(uv * 3.0 + uTime * 0.2) * uAudioLow * 0.3
             + n(uv * 6.0 - uTime * 0.15) * uAudioMid * 0.2;
  vec2 warped = uv + vec2(warp, warp * 0.7);

  float wave = sin(warped.x * 12.0 + uTime * 2.0 + uAudioLow * 8.0)
             * 0.5 + 0.5;
  wave      *= sin(warped.y * 8.0  - uTime * 1.5 + uAudioMid * 6.0)
             * 0.5 + 0.5;

  vec3 col = mix(
    vec3(0.05, 0.1, 0.4),
    vec3(0.8 + uAudioLow, 0.3 + uAudioMid, uAudioHigh),
    wave
  );
  col += uBeat * vec3(0.4, 0.2, 0.1) * exp(-length(uv - 0.5) * 4.0);

  gl_FragColor = vec4(col, 1.0);
}`,
  },
]

export const BUILTIN_ASSET_IDS = EXAMPLES.map((_, i) => `builtin-${i}`)

export const BUILTIN_ASSETS: Asset[] = EXAMPLES.map((e, i) => ({
  ...e,
  id: `builtin-${i}`,
}))

interface AssetState {
  assets: Asset[]
  addAsset: (asset: Omit<Asset, 'id'>) => string
  removeAsset: (id: string) => void
  updateAsset: (id: string, patch: Partial<Omit<Asset, 'id'>>) => void
}

export const useAssetStore = create<AssetState>()(
  persist(
    (set) => ({
      assets: [],

      addAsset: (asset) => {
        const id = uid()
        set((s) => ({ assets: [...s.assets, { ...asset, id }] }))
        return id
      },

      removeAsset: (id) =>
        set((s) => ({ assets: s.assets.filter((a) => a.id !== id) })),

      updateAsset: (id, patch) =>
        set((s) => ({
          assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),
    }),
    {
      name: 'openvj-assets',
      // Only persist shaders and uji — object URLs are ephemeral
      partialize: (s) => ({
        assets: s.assets.filter((a) => a.type === 'shader' || a.type === 'uji'),
      }),
    }
  )
)
