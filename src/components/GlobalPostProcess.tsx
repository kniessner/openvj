/**
 * Global output post-processing — applies brightness/contrast/hue/saturation/vignette
 * to the entire rendered scene. Uses Three.js EffectComposer with a custom ShaderPass.
 *
 * Must be rendered inside a React Three Fiber Canvas. When mounted it takes over
 * rendering responsibility from R3F (useFrame priority 1 disables R3F's default render).
 */

import { useRef, useMemo, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { useOutputStore } from '../stores/outputStore'

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  precision highp float;
  uniform sampler2D tDiffuse;
  uniform float uBrightness;
  uniform float uContrast;
  uniform float uSaturation;
  uniform float uHue;
  uniform float uVignette;
  varying vec2 vUv;

  vec3 hueRotate(vec3 col, float angle) {
    float c = cos(angle), s = sin(angle);
    return vec3(
      col.r*(0.299+0.701*c+0.168*s) + col.g*(0.587-0.587*c+0.330*s) + col.b*(0.114-0.114*c-0.497*s),
      col.r*(0.299-0.299*c-0.328*s) + col.g*(0.587+0.413*c+0.035*s) + col.b*(0.114-0.114*c+0.292*s),
      col.r*(0.299-0.300*c+1.250*s) + col.g*(0.587-0.588*c-1.050*s) + col.b*(0.114+0.886*c-0.203*s)
    );
  }

  void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    color.rgb += uBrightness;
    color.rgb = (color.rgb - 0.5) * (1.0 + uContrast) + 0.5;
    if (uHue != 0.0) color.rgb = hueRotate(color.rgb, uHue);
    if (uSaturation != 1.0) {
      float lum = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
      color.rgb = mix(vec3(lum), color.rgb, uSaturation);
    }
    if (uVignette > 0.0) {
      float v = 1.0 - length((vUv - 0.5) * 2.0) * uVignette;
      color.rgb *= clamp(v, 0.0, 1.0);
    }
    gl_FragColor = color;
  }
`

const shaderDef = {
  uniforms: {
    tDiffuse:    { value: null as null },
    uBrightness: { value: 0 },
    uContrast:   { value: 0 },
    uSaturation: { value: 1 },
    uHue:        { value: 0 },
    uVignette:   { value: 0 },
  },
  vertexShader,
  fragmentShader,
}

export function GlobalPostProcess() {
  const { gl, scene, camera, size } = useThree()

  const composerRef = useRef<EffectComposer | null>(null)
  const passRef = useRef<ShaderPass | null>(null)

  // Build composer once — torn down and rebuilt if gl/scene/camera changes
  const { composer, fxPass } = useMemo(() => {
    const c = new EffectComposer(gl)
    c.addPass(new RenderPass(scene, camera))
    const pass = new ShaderPass(shaderDef)
    pass.renderToScreen = true
    c.addPass(pass)
    return { composer: c, fxPass: pass }
  }, [gl, scene, camera])

  useEffect(() => {
    composerRef.current = composer
    passRef.current = fxPass
    return () => { composer.dispose() }
  }, [composer, fxPass])

  useEffect(() => {
    composerRef.current?.setSize(size.width, size.height)
  }, [size])

  // Priority 1 = R3F skips its own gl.render; we own rendering.
  useFrame((state) => {
    const { brightness, contrast, saturation, hue, vignette } = useOutputStore.getState()
    const isDefault = brightness === 0 && contrast === 0 && saturation === 1 && hue === 0 && vignette === 0

    if (isDefault || !composerRef.current || !passRef.current) {
      state.gl.render(state.scene, state.camera)
      return
    }

    passRef.current.uniforms.uBrightness.value = brightness
    passRef.current.uniforms.uContrast.value   = contrast
    passRef.current.uniforms.uSaturation.value = saturation
    passRef.current.uniforms.uHue.value        = hue * Math.PI / 180
    passRef.current.uniforms.uVignette.value   = vignette
    composerRef.current.render()
  }, 1)

  return null
}
