import * as THREE from 'three'
import type { BlendMode, MaskShape } from '../stores/surfaceStore'

const vertexShader = `
  varying vec2 vUv;
  uniform vec2 uCorners[4];

  vec2 bilinearUV(vec2 uv) {
    vec2 top    = mix(uCorners[0], uCorners[1], uv.x);
    vec2 bottom = mix(uCorners[3], uCorners[2], uv.x);
    return mix(bottom, top, uv.y);
  }

  void main() {
    vUv = uv;
    vec2 wp = bilinearUV(uv);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(wp.x, wp.y, position.z, 1.0);
  }
`

function buildFragmentShader(customShader: string | null): string {
  const userFn = customShader?.trim()
    ? customShader
    : 'vec4 applyFX(vec4 color, vec2 uv) { return color; }'

  return `
  precision highp float;

  uniform sampler2D uTexture;
  uniform float uOpacity;
  uniform vec3  uTint;
  uniform float uBrightness;
  uniform float uContrast;

  // Color FX
  uniform float uHue;        // radians
  uniform float uSaturation; // 0-2, 1=normal
  uniform float uInvert;     // 0 or 1

  // Transform
  uniform float uFlipH;
  uniform float uFlipV;
  uniform float uRotation;   // radians
  uniform float uZoom;       // 1=normal

  // Distortion
  uniform float uWarpAmp;
  uniform float uWarpFreq;
  uniform float uChromaAb;
  uniform float uPixelate;   // 0=off, else grid count
  uniform float uVignette;
  uniform float uTime;

  // Audio
  uniform float uAudioLow;   // 0-1 bass
  uniform float uAudioMid;   // 0-1 mids
  uniform float uAudioHigh;  // 0-1 highs
  uniform float uBeat;       // 0-1 beat pulse
  uniform float uBpm;        // tapped BPM (0 = not set)

  // Chroma key
  uniform float uChromaKey;        // 0 or 1
  uniform vec3  uChromaColor;      // target colour to remove
  uniform float uChromaThreshold;  // distance threshold
  uniform float uChromaSoftness;   // edge softness

  // Layer mask
  uniform float uMaskShape;    // 0=none 1=ellipse 2=triangle 3=diamond 4=top 5=bottom 6=left 7=right
  uniform float uMaskSoftness; // feather amount 0-0.2
  uniform float uMaskInvert;   // 0 or 1

  varying vec2 vUv;

  float getMaskAlpha(vec2 uv) {
    if (uMaskShape < 0.5) return 1.0;
    vec2 c = uv - 0.5;
    float edge = max(uMaskSoftness, 0.005);
    float m;
    if (uMaskShape < 1.5) {
      // Ellipse inscribed in UV quad
      float d = length(c * 2.0);
      m = 1.0 - smoothstep(1.0 - edge * 4.0, 1.0, d);
    } else if (uMaskShape < 2.5) {
      // Equilateral triangle pointing up (SDF)
      const float k = 1.7320508;
      vec2 p = vec2(abs(c.x) - 0.45, c.y + 0.45 / k);
      if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) * 0.5;
      p.x -= clamp(p.x, -0.9, 0.0);
      float sd = -length(p) * sign(p.y);
      m = smoothstep(edge, -edge, sd);
    } else if (uMaskShape < 3.5) {
      // Diamond (rotated square)
      float sd = abs(c.x) + abs(c.y) - 0.48;
      m = smoothstep(edge, -edge, sd);
    } else if (uMaskShape < 4.5) {
      m = smoothstep(-edge, edge, c.y);   // top half
    } else if (uMaskShape < 5.5) {
      m = smoothstep(edge, -edge, c.y);   // bottom half
    } else if (uMaskShape < 6.5) {
      m = smoothstep(edge, -edge, c.x);   // left half
    } else {
      m = smoothstep(-edge, edge, c.x);   // right half
    }
    return uMaskInvert > 0.5 ? 1.0 - m : m;
  }

  vec3 hueRotate(vec3 col, float angle) {
    float c = cos(angle), s = sin(angle);
    return vec3(
      col.r*(0.299+0.701*c+0.168*s) + col.g*(0.587-0.587*c+0.330*s) + col.b*(0.114-0.114*c-0.497*s),
      col.r*(0.299-0.299*c-0.328*s) + col.g*(0.587+0.413*c+0.035*s) + col.b*(0.114-0.114*c+0.292*s),
      col.r*(0.299-0.300*c+1.250*s) + col.g*(0.587-0.588*c-1.050*s) + col.b*(0.114+0.886*c-0.203*s)
    );
  }

  // ── User post-process (signature: vec4 applyFX(vec4 color, vec2 uv)) ──
  ${userFn}

  void main() {
    vec2 uv = vUv;

    // Pixelate
    if (uPixelate > 0.0) {
      uv = floor(uv * uPixelate) / uPixelate + 0.5 / uPixelate;
    }

    // Flip
    if (uFlipH > 0.5) uv.x = 1.0 - uv.x;
    if (uFlipV > 0.5) uv.y = 1.0 - uv.y;

    // Rotation (around center)
    if (uRotation != 0.0) {
      vec2 c2 = uv - 0.5;
      float rc = cos(uRotation), rs = sin(uRotation);
      uv = vec2(c2.x*rc - c2.y*rs, c2.x*rs + c2.y*rc) + 0.5;
    }

    // Zoom (from center)
    if (uZoom != 1.0) {
      uv = (uv - 0.5) / uZoom + 0.5;
    }

    // Wave warp
    if (uWarpAmp > 0.0) {
      uv.x += sin(uv.y * uWarpFreq + uTime * 2.0) * uWarpAmp;
      uv.y += cos(uv.x * uWarpFreq + uTime * 1.7) * uWarpAmp;
    }

    // Sample with optional chromatic aberration
    vec4 color;
    if (uChromaAb > 0.0) {
      float r = texture2D(uTexture, uv + vec2( uChromaAb, 0.0)).r;
      float g = texture2D(uTexture, uv                        ).g;
      float b = texture2D(uTexture, uv - vec2( uChromaAb, 0.0)).b;
      float a = texture2D(uTexture, uv).a;
      color = vec4(r, g, b, a);
    } else {
      color = texture2D(uTexture, uv);
    }

    // Brightness / contrast
    color.rgb += uBrightness;
    color.rgb  = (color.rgb - 0.5) * (1.0 + uContrast) + 0.5;

    // Hue rotate
    if (uHue != 0.0) color.rgb = hueRotate(color.rgb, uHue);

    // Saturation
    if (uSaturation != 1.0) {
      float lum = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
      color.rgb = mix(vec3(lum), color.rgb, uSaturation);
    }

    // Invert
    if (uInvert > 0.5) color.rgb = 1.0 - color.rgb;

    // Vignette
    if (uVignette > 0.0) {
      float v = 1.0 - length((vUv - 0.5) * 2.0) * uVignette;
      color.rgb *= clamp(v, 0.0, 1.0);
    }

    // Chroma key
    if (uChromaKey > 0.5) {
      float dist = distance(color.rgb, uChromaColor);
      float mask = 1.0 - smoothstep(uChromaThreshold - uChromaSoftness, uChromaThreshold + uChromaSoftness, dist);
      color.a *= (1.0 - mask);
    }

    // User post-process
    color = applyFX(color, uv);

    // Layer mask
    color.a *= getMaskAlpha(vUv);

    // Tint + opacity
    color.rgb *= uTint;
    color.a   *= uOpacity;

    gl_FragColor = color;
  }
`
}

export interface ProjectedMaterialOptions {
  texture?: THREE.Texture
  opacity?: number
  tint?: THREE.Color
  brightness?: number
  contrast?: number
  transparent?: boolean
  side?: THREE.Side
  customShader?: string | null
}

export class ProjectedMaterial extends THREE.ShaderMaterial {
  constructor(options: ProjectedMaterialOptions = {}) {
    const {
      texture,
      opacity = 1,
      tint = new THREE.Color(1, 1, 1),
      brightness = 0,
      contrast = 0,
      transparent = true,
      side = THREE.DoubleSide,
      customShader = null,
    } = options

    super({
      vertexShader,
      fragmentShader: buildFragmentShader(customShader),
      uniforms: {
        uTexture:    { value: texture || new THREE.Texture() },
        uOpacity:    { value: opacity },
        uTint:       { value: tint },
        uBrightness: { value: brightness },
        uContrast:   { value: contrast },
        uCorners: {
          value: [
            new THREE.Vector2(-2,  2),
            new THREE.Vector2( 2,  2),
            new THREE.Vector2( 2, -2),
            new THREE.Vector2(-2, -2),
          ],
        },
        uTime:       { value: 0 },
        // Color FX
        uHue:        { value: 0 },
        uSaturation: { value: 1 },
        uInvert:     { value: 0 },
        // Transform
        uFlipH:      { value: 0 },
        uFlipV:      { value: 0 },
        uRotation:   { value: 0 },
        uZoom:       { value: 1 },
        // Distortion
        uWarpAmp:    { value: 0 },
        uWarpFreq:   { value: 5 },
        uChromaAb:   { value: 0 },
        uPixelate:   { value: 0 },
        uVignette:   { value: 0 },
        // Audio
        uAudioLow:        { value: 0 },
        uAudioMid:        { value: 0 },
        uAudioHigh:       { value: 0 },
        uBeat:            { value: 0 },
        uBpm:             { value: 0 },
        // Chroma key
        uChromaKey:       { value: 0 },
        uChromaColor:     { value: new THREE.Vector3(0, 1, 0) },
        uChromaThreshold: { value: 0.3 },
        uChromaSoftness:  { value: 0.1 },
        // Layer mask
        uMaskShape:       { value: 0 },
        uMaskSoftness:    { value: 0.02 },
        uMaskInvert:      { value: 0 },
      },
      transparent,
      side,
    })
  }

  setCorners(corners: { x: number; y: number }[]) {
    if (corners.length >= 4) {
      this.uniforms.uCorners.value = corners.slice(0, 4).map(c => new THREE.Vector2(c.x, c.y))
    }
  }
  setTexture(texture: THREE.Texture) { this.uniforms.uTexture.value = texture; texture.needsUpdate = true }
  setOpacity(v: number)    { this.uniforms.uOpacity.value    = v }
  setBrightness(v: number) { this.uniforms.uBrightness.value = v }
  setContrast(v: number)   { this.uniforms.uContrast.value   = v }
  setTint(v: THREE.Color)  { this.uniforms.uTint.value       = v }
  setBlendMode(mode: BlendMode) {
    switch (mode) {
      case 'add':      this.blending = THREE.AdditiveBlending; break
      case 'multiply': this.blending = THREE.MultiplyBlending; break
      case 'screen':
        this.blending = THREE.CustomBlending
        this.blendEquation = THREE.AddEquation
        this.blendSrc = THREE.OneFactor
        this.blendDst = THREE.OneMinusSrcColorFactor
        break
      default: this.blending = THREE.NormalBlending
    }
    this.needsUpdate = true
  }
  // FX setters
  setHue(radians: number)     { this.uniforms.uHue.value        = radians }
  setSaturation(v: number)    { this.uniforms.uSaturation.value = v }
  setInvert(on: boolean)      { this.uniforms.uInvert.value     = on ? 1 : 0 }
  setFlipH(on: boolean)       { this.uniforms.uFlipH.value      = on ? 1 : 0 }
  setFlipV(on: boolean)       { this.uniforms.uFlipV.value      = on ? 1 : 0 }
  setRotation(radians: number){ this.uniforms.uRotation.value   = radians }
  setZoom(v: number)          { this.uniforms.uZoom.value       = v }
  setWarpAmp(v: number)       { this.uniforms.uWarpAmp.value    = v }
  setWarpFreq(v: number)      { this.uniforms.uWarpFreq.value   = v }
  setChromaAb(v: number)      { this.uniforms.uChromaAb.value   = v }
  setPixelate(v: number)      { this.uniforms.uPixelate.value   = v }
  setVignette(v: number)      { this.uniforms.uVignette.value   = v }
  tick(time: number)          { this.uniforms.uTime.value       = time }
  // Audio setters
  setAudioLow(v: number)      { this.uniforms.uAudioLow.value   = v }
  setAudioMid(v: number)      { this.uniforms.uAudioMid.value   = v }
  setAudioHigh(v: number)     { this.uniforms.uAudioHigh.value  = v }
  setAudioBeat(v: number)     { this.uniforms.uBeat.value            = v }
  setBpm(v: number)           { this.uniforms.uBpm.value             = v }
  // Chroma key
  setChromaKey(on: boolean)   { this.uniforms.uChromaKey.value       = on ? 1 : 0 }
  setChromaColor(r: number, g: number, b: number) {
    this.uniforms.uChromaColor.value.set(r, g, b)
  }
  setChromaThreshold(v: number) { this.uniforms.uChromaThreshold.value = v }
  setChromaSoftness(v: number)  { this.uniforms.uChromaSoftness.value  = v }
  // Mask setters
  setMaskShape(shape: MaskShape) {
    const idx: Record<MaskShape, number> = {
      none: 0, ellipse: 1, triangle: 2, diamond: 3,
      top: 4, bottom: 5, left: 6, right: 7,
    }
    this.uniforms.uMaskShape.value = idx[shape] ?? 0
  }
  setMaskSoftness(v: number)  { this.uniforms.uMaskSoftness.value = v }
  setMaskInvert(on: boolean)  { this.uniforms.uMaskInvert.value   = on ? 1 : 0 }
}

export default ProjectedMaterial
