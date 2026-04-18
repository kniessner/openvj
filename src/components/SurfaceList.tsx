import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three'
import { useSurfaceStore, Surface, Corner, MaskShape, defaultUVForIndex } from '../stores/surfaceStore'
import { assetTextureManager } from '../lib/assetTextureManager'
import { ProjectedMaterial } from '../shaders/ProjectedMaterial'

// ─── 3D Layout Presets ───────────────────────────────────────────────────────

type C4 = [[number,number],[number,number],[number,number],[number,number]]

interface PresetSurface { name: string; corners: C4 }
interface SurfacePreset {
  id: string
  name: string
  desc: string
  surfaces: PresetSurface[]
}

const PRESETS: SurfacePreset[] = [
  {
    id: 'single', name: 'Single', desc: '1 surface',
    surfaces: [
      { name: 'Screen', corners: [[-2,2],[2,2],[2,-2],[-2,-2]] },
    ],
  },
  {
    id: 'wide', name: 'Wide 16:9', desc: '1 widescreen',
    surfaces: [
      { name: 'Screen', corners: [[-3.56,2],[3.56,2],[3.56,-2],[-3.56,-2]] },
    ],
  },
  {
    id: 'banner', name: 'Banner', desc: '1 ultra-wide strip',
    surfaces: [
      { name: 'Banner', corners: [[-5.5,0.75],[5.5,0.75],[5.5,-0.75],[-5.5,-0.75]] },
    ],
  },
  {
    id: 'column', name: 'Column', desc: '1 tall vertical',
    surfaces: [
      { name: 'Column', corners: [[-0.7,4.5],[0.7,4.5],[0.7,-4.5],[-0.7,-4.5]] },
    ],
  },
  {
    id: 'diptych', name: 'Diptych', desc: '2 equal panels',
    surfaces: [
      { name: 'Left',  corners: [[-4.1,2],[-0.1,2],[-0.1,-2],[-4.1,-2]] },
      { name: 'Right', corners: [[0.1,2],[4.1,2],[4.1,-2],[0.1,-2]] },
    ],
  },
  {
    id: 'triptych', name: 'Triptych', desc: '3 equal panels',
    surfaces: [
      { name: 'Left',   corners: [[-6.3,2],[-2.1,2],[-2.1,-2],[-6.3,-2]] },
      { name: 'Center', corners: [[-2,2],[2,2],[2,-2],[-2,-2]] },
      { name: 'Right',  corners: [[2.1,2],[6.3,2],[6.3,-2],[2.1,-2]] },
    ],
  },
  {
    id: 'quad', name: 'Quad', desc: '2×2 grid',
    surfaces: [
      { name: 'Top Left',     corners: [[-4.1,4.1],[-0.1,4.1],[-0.1,0.1],[-4.1,0.1]] },
      { name: 'Top Right',    corners: [[0.1,4.1],[4.1,4.1],[4.1,0.1],[0.1,0.1]] },
      { name: 'Bottom Left',  corners: [[-4.1,-0.1],[-0.1,-0.1],[-0.1,-4.1],[-4.1,-4.1]] },
      { name: 'Bottom Right', corners: [[0.1,-0.1],[4.1,-0.1],[4.1,-4.1],[0.1,-4.1]] },
    ],
  },
  {
    id: 'stage', name: 'Stage', desc: 'Center tall + 2 sides',
    surfaces: [
      { name: 'Left',   corners: [[-6.2,1.6],[-2.2,1.6],[-2.2,-1.6],[-6.2,-1.6]] },
      { name: 'Center', corners: [[-2,2.4],[2,2.4],[2,-2.4],[-2,-2.4]] },
      { name: 'Right',  corners: [[2.2,1.6],[6.2,1.6],[6.2,-1.6],[2.2,-1.6]] },
    ],
  },
  {
    id: 'cross', name: 'Cross', desc: '5 surfaces, plus pattern',
    surfaces: [
      { name: 'Center', corners: [[-2,2],[2,2],[2,-2],[-2,-2]] },
      { name: 'Top',    corners: [[-2,2.2],[2,2.2],[2,4.2],[-2,4.2]] },
      { name: 'Bottom', corners: [[-2,-2.2],[2,-2.2],[2,-4.2],[-2,-4.2]] },
      { name: 'Left',   corners: [[-4.2,2],[-2.2,2],[-2.2,-2],[-4.2,-2]] },
      { name: 'Right',  corners: [[2.2,2],[4.2,2],[4.2,-2],[2.2,-2]] },
    ],
  },
  {
    id: 'hex', name: 'Hexagon', desc: '6 surfaces, radial ring',
    surfaces: (() => {
      const r = 3.6, w = 1.9, h = 1.9
      return [0,1,2,3,4,5].map((i) => {
        const angle = (i / 6) * 2 * Math.PI - Math.PI / 2
        const cx = r * Math.cos(angle), cy = r * Math.sin(angle)
        const a = angle + Math.PI / 2
        const cos = Math.cos(a), sin = Math.sin(a)
        const corners: C4 = [
          [cx + (-w/2)*cos - (h/2)*sin, cy + (-w/2)*sin + (h/2)*cos],
          [cx + ( w/2)*cos - (h/2)*sin, cy + ( w/2)*sin + (h/2)*cos],
          [cx + ( w/2)*cos + (h/2)*sin, cy + ( w/2)*sin - (h/2)*cos],
          [cx + (-w/2)*cos + (h/2)*sin, cy + (-w/2)*sin - (h/2)*cos],
        ]
        const names = ['Top', 'Top Right', 'Bot Right', 'Bottom', 'Bot Left', 'Top Left']
        return { name: names[i], corners }
      })
    })(),
  },
]

// ─── Preset Thumbnail ─────────────────────────────────────────────────────────

function PresetThumbnail({ preset }: { preset: SurfacePreset }) {
  const allX = preset.surfaces.flatMap(s => s.corners.map(c => c[0]))
  const allY = preset.surfaces.flatMap(s => s.corners.map(c => c[1]))
  const minX = Math.min(...allX), maxX = Math.max(...allX)
  const minY = Math.min(...allY), maxY = Math.max(...allY)
  const span = Math.max(maxX - minX, maxY - minY, 0.01)
  const pad = span * 0.08
  const vw = maxX - minX + pad * 2, vh = maxY - minY + pad * 2
  const W = 56, H = 36

  const sx = (x: number) => ((x - minX + pad) / vw) * W
  const sy = (y: number) => ((maxY - y + pad) / vh) * H

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="flex-shrink-0">
      {preset.surfaces.map((s, i) => {
        const pts = s.corners.map(([x, y]) => `${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(' ')
        return (
          <polygon key={i}
            points={pts}
            fill={`rgba(212,245,66,${0.25 + i * 0.07})`}
            stroke="#d4f542"
            strokeWidth="1"
          />
        )
      })}
    </svg>
  )
}

// ─── Preset Picker ────────────────────────────────────────────────────────────

interface PresetPickerProps {
  onClose: () => void
}

function PresetPicker({ onClose }: PresetPickerProps) {
  const { importConfig, setActiveSurface } = useSurfaceStore()

  const apply = (preset: SurfacePreset) => {
    const genId = () => Math.random().toString(36).slice(2, 11)
    const newSurfaces: Surface[] = preset.surfaces.map((ps) => ({
      id: genId(),
      name: ps.name,
      corners: ps.corners.map(([x, y], i) => ({ x, y, ...defaultUVForIndex(i, ps.corners.length) })) as Corner[],
      visible: true,
      locked: false,
      opacity: 0.95,
      brightness: 0,
      contrast: 0,
      blendMode: 'normal' as const,
      assetId: null,
      hue: 0,
      saturation: 1,
      invert: false,
      flipH: false,
      flipV: false,
      rotation: 0,
      zoom: 1,
      warpAmp: 0,
      warpFreq: 5,
      chromaAb: 0,
      pixelate: 0,
      vignette: 0,
      chromaKey: false,
      chromaColor: [0, 1, 0] as [number, number, number],
      chromaThreshold: 0.3,
      chromaSoftness: 0.1,
      customShader: null,
      maskShape: 'none' as MaskShape,
      maskSoftness: 0.02,
      maskInvert: false,
      edgeBlendLeft:   0,
      edgeBlendRight:  0,
      edgeBlendTop:    0,
      edgeBlendBottom: 0,
      groupId: null,
    }))
    importConfig(newSurfaces)
    setActiveSurface(newSurfaces[0].id)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      {/* Panel */}
      <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-3">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Layout Presets</span>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 cursor-pointer p-0.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => apply(preset)}
              className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700/60 hover:border-[#d4f542]/50 transition-colors cursor-pointer text-left group"
            >
              <div className="flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                <PresetThumbnail preset={preset} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-gray-200 group-hover:text-white transition-colors">{preset.name}</div>
                <div className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors mt-0.5">{preset.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconEye({ crossed = false }: { crossed?: boolean }) {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {crossed ? (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
        </>
      ) : (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </>
      )}
    </svg>
  )
}

function IconLock({ locked = false }: { locked?: boolean }) {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {locked ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
      )}
    </svg>
  )
}

function IconTrash() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

// ─── Surface Shader Editor ───────────────────────────────────────────────────

const DEFAULT_SURFACE_SHADER = `vec4 applyFX(vec4 color, vec2 uv) {
  // color = processed RGBA after all surface FX (brightness/contrast/hue/etc)
  // uv    = texture coordinates 0-1
  // Available uniforms (pre-declared):
  //   uTime (float)  - seconds elapsed
  //   uAudioLow / uAudioMid / uAudioHigh (float 0-1)
  //   uBeat (float 0-1) - decaying beat pulse
  return color;
}`

const SURFACE_SHADER_SYSTEM_PROMPT = `You are a GLSL ES 1.0 post-processor for a VJ projection mapping tool. Write ONLY the vec4 applyFX(vec4 color, vec2 uv) function and any helper functions it needs. Do NOT include precision declarations, uniform declarations, or void main() — they are provided automatically. The color parameter is the processed RGBA from the surface pipeline. The uv parameter is the texture UV coordinates 0-1. Available pre-declared uniforms: uTime (float, seconds), uAudioLow, uAudioMid, uAudioHigh, uBeat (all float 0-1). The function must return a vec4. Keep it under 40 lines. Output ONLY raw GLSL — no markdown fences, no explanations.`

// GLSL syntax highlighter (same tokenizer as MediaBrowser ShaderEditor)
function highlightGLSL(raw: string): string {
  const BLOCK_CMT = /^\/\*[\s\S]*?\*\//
  const LINE_CMT  = /^\/\/.*/
  const PREPROC   = /^#\w+/
  const NUM       = /^\d+\.?\d*(?:[eE][+-]?\d+)?f?\b/
  const GL_VAR    = /^gl_\w+/
  const IDENT     = /^[a-zA-Z_]\w*/
  const TYPES_RE  = /^(?:void|float|int|uint|bool|vec[234]|ivec[234]|bvec[234]|mat[234]|mat[234]x[234]|sampler2D|sampler3D|samplerCube|sampler2DShadow)$/
  const KW_RE     = /^(?:if|else|for|while|do|return|break|continue|discard|struct|const|uniform|in|out|inout|attribute|varying|precision|highp|mediump|lowp|layout|flat|smooth|invariant)$/
  const FN_RE     = /^(?:abs|sign|floor|ceil|round|trunc|fract|mod|modf|min|max|clamp|mix|step|smoothstep|length|distance|dot|cross|normalize|reflect|refract|faceforward|pow|exp|exp2|log|log2|sqrt|inversesqrt|sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|radians|degrees|fwidth|dFdx|dFdy|texture2D|textureCube|texture|all|any|not|equal|notEqual|lessThan|greaterThan|lessThanEqual|greaterThanEqual|outerProduct|transpose|determinant|inverse|isnan|isinf)$/
  const C = { cmt:'#6b7280', kw:'#c084fc', type:'#67e8f9', fn:'#fbbf24', num:'#86efac', gl:'#a78bfa', prep:'#fb923c' }
  const esc  = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const span = (col: string, s: string, italic = false) =>
    `<span style="color:${col}${italic?';font-style:italic':''}">${esc(s)}</span>`
  const out: string[] = []
  let i = 0
  while (i < raw.length) {
    const rest = raw.slice(i)
    let m: RegExpExecArray | null = null
    if      ((m = BLOCK_CMT.exec(rest)))  { out.push(span(C.cmt,  m[0], true)); i += m[0].length }
    else if ((m = LINE_CMT.exec(rest)))   { out.push(span(C.cmt,  m[0], true)); i += m[0].length }
    else if ((m = PREPROC.exec(rest)))    { out.push(span(C.prep, m[0]));        i += m[0].length }
    else if ((m = NUM.exec(rest)))        { out.push(span(C.num,  m[0]));        i += m[0].length }
    else if ((m = GL_VAR.exec(rest)))     { out.push(span(C.gl,   m[0]));        i += m[0].length }
    else if ((m = IDENT.exec(rest))) {
      if      (TYPES_RE.test(m[0])) out.push(span(C.type, m[0]))
      else if (KW_RE.test(m[0]))    out.push(span(C.kw,   m[0]))
      else if (FN_RE.test(m[0]))    out.push(span(C.fn,   m[0]))
      else                           out.push(esc(m[0]))
      i += m[0].length
    } else {
      const ch = raw[i]
      out.push(ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch)
      i++
    }
  }
  return out.join('')
}

interface SurfaceShaderEditorProps {
  surface: Surface
  onClose: () => void
}

function SurfaceShaderEditor({ surface, onClose }: SurfaceShaderEditorProps) {
  const { updateSurfaceProps } = useSurfaceStore()
  const [code, setCode] = useState(surface.customShader ?? DEFAULT_SURFACE_SHADER)
  const [error, setError] = useState<string | null>(null)
  const [compiling, setCompiling] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiKey, setAiKey] = useState(() => localStorage.getItem('openvj-anthropic-key') ?? '')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const preRef     = useRef<HTMLPreElement>(null)
  const taRef      = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rendererRef = useRef<any>(null)

  const highlighted = useMemo(() => highlightGLSL(code), [code])

  // Live preview — debounced re-render with current shader code
  useEffect(() => {
    if (!previewRef.current) return
    const timer = setTimeout(async () => {
      const canvas = previewRef.current
      if (!canvas) return
      try {
        if (!rendererRef.current) {
          rendererRef.current = new WebGLRenderer({ canvas, antialias: false, alpha: true })
          rendererRef.current.setSize(canvas.offsetWidth || 256, canvas.offsetHeight || 144, false)
        }
        const renderer = rendererRef.current
        const texture = surface.assetId ? assetTextureManager.getTexture(surface.assetId) : null
        const mat = new ProjectedMaterial({
          customShader: code.trim() || null,
          texture: texture ?? undefined,
        })
        mat.tick(performance.now() / 1000)
        const cam = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
        const scene = new Scene()
        const geo = new PlaneGeometry(2, 2, 4, 4)
        scene.add(new Mesh(geo, mat))
        renderer.render(scene, cam)
        geo.dispose()
        mat.dispose()
      } catch {
        // shader compile error — keep last good frame
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [code, surface.assetId])

  // Dispose renderer on unmount
  useEffect(() => {
    return () => {
      if (rendererRef.current) { rendererRef.current.dispose(); rendererRef.current = null }
    }
  }, [])

  const syncScroll = () => {
    if (preRef.current && taRef.current) {
      preRef.current.scrollTop  = taRef.current.scrollTop
      preRef.current.scrollLeft = taRef.current.scrollLeft
    }
  }

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    setAiError(null)
    try {
      const key = aiKey.trim()
      if (!key) { setAiError('Enter your Anthropic API key'); setAiLoading(false); return }
      localStorage.setItem('openvj-anthropic-key', key)
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: SURFACE_SHADER_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: aiPrompt }],
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`)
      }
      const data = await res.json() as { content?: Array<{ text?: string }> }
      const generated = data.content?.[0]?.text ?? ''
      if (!generated.trim()) throw new Error('Empty response from API')
      setCode(generated.trim())
      setAiOpen(false)
      setAiPrompt('')
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setAiLoading(false)
    }
  }

  const handleApply = async () => {
    setCompiling(true)
    setError(null)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 64; canvas.height = 64
      const renderer = new WebGLRenderer({ canvas })
      const testFrag = `precision highp float;
uniform float uTime;
uniform float uAudioLow;
uniform float uAudioMid;
uniform float uAudioHigh;
uniform float uBeat;
${code}
void main() {
  vec4 c = vec4(0.5, 0.5, 0.5, 1.0);
  gl_FragColor = applyFX(c, vec2(0.5, 0.5));
}`
      const mat = new ShaderMaterial({
        vertexShader: `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
        fragmentShader: testFrag,
        uniforms: {
          uTime: { value: 0 },
          uAudioLow: { value: 0 },
          uAudioMid: { value: 0 },
          uAudioHigh: { value: 0 },
          uBeat: { value: 0 },
        },
      })
      const scene = new Scene()
      const geo   = new PlaneGeometry(2, 2)
      const cam   = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
      scene.add(new Mesh(geo, mat))
      renderer.render(scene, cam)
      renderer.dispose(); geo.dispose(); mat.dispose()
      updateSurfaceProps(surface.id, { customShader: code.trim() || null })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Shader compilation failed')
    } finally {
      setCompiling(false)
    }
  }

  const MONO = '"ui-monospace","Cascadia Code","JetBrains Mono",Consolas,monospace'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col bg-gray-950 rounded-xl border border-gray-700 shadow-2xl overflow-hidden"
        style={{ width: 'min(1060px, 96vw)', height: 'min(740px, 92vh)' }}
      >
        {/* Header */}
        <div className="h-11 border-b border-gray-700 flex items-center gap-3 px-4 flex-shrink-0">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <span className="text-sm font-medium text-gray-200">{surface.name}</span>
          <span className="text-xs text-gray-600 font-mono">— Surface Post-Process Shader</span>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — 2 columns */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── Code editor (left) ── */}
          <div className="flex-1 min-w-0 relative" style={{ background: '#07090f' }}>
            <pre
              ref={preRef}
              aria-hidden="true"
              className="absolute inset-0 m-0 p-5 overflow-hidden pointer-events-none select-none"
              style={{
                fontFamily: MONO, fontSize: '13px', lineHeight: '1.7',
                tabSize: 2, whiteSpace: 'pre', color: '#d1d5db',
                overflowWrap: 'normal',
              }}
              dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
            />
            <textarea
              ref={taRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={syncScroll}
              spellCheck={false}
              wrap="off"
              className="absolute inset-0 resize-none outline-none p-5"
              style={{
                fontFamily: MONO, fontSize: '13px', lineHeight: '1.7',
                tabSize: 2, whiteSpace: 'pre',
                background: 'transparent',
                color: 'transparent',
                caretColor: '#86efac',
                WebkitTextFillColor: 'transparent',
                overflowWrap: 'normal',
                overflow: 'auto',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault()
                  const t = e.currentTarget
                  const s = t.selectionStart, end = t.selectionEnd
                  const nv = t.value.substring(0, s) + '  ' + t.value.substring(end)
                  setCode(nv)
                  requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = s + 2 })
                }
              }}
            />
          </div>

          {/* ── Right panel ── */}
          <div className="w-72 border-l border-gray-700/80 flex flex-col flex-shrink-0 bg-gray-900/40">

            {/* Function contract */}
            <div className="p-4 border-b border-gray-800 flex-shrink-0">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Signature</p>
              <div className="bg-gray-900 rounded p-2.5 font-mono text-xs leading-relaxed mb-3">
                <span style={{ color: '#67e8f9' }}>vec4</span>
                {' '}<span style={{ color: '#fbbf24' }}>applyFX</span>
                {'('}
                <span style={{ color: '#67e8f9' }}>vec4</span>
                {' color, '}
                <span style={{ color: '#67e8f9' }}>vec2</span>
                {' uv)'}
              </div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Uniforms</p>
              <div className="space-y-1.5">
                {([
                  { name: 'uTime',      type: 'float', col: '#c084fc', desc: 'seconds' },
                  { name: 'uAudioLow',  type: 'float', col: '#fbbf24', desc: 'bass 0–1' },
                  { name: 'uAudioMid',  type: 'float', col: '#fbbf24', desc: 'mids 0–1' },
                  { name: 'uAudioHigh', type: 'float', col: '#fbbf24', desc: 'highs 0–1' },
                  { name: 'uBeat',      type: 'float', col: '#fbbf24', desc: 'beat 0–1' },
                ] as const).map(({ name, type, col, desc }) => (
                  <div key={name} className="flex items-baseline gap-2 text-xs font-mono">
                    <span style={{ color: col }}>{name}</span>
                    <span style={{ color: '#67e8f9' }}>{type}</span>
                    <span className="text-gray-600 ml-auto">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live preview */}
            <div className="p-3 border-b border-gray-800 flex-shrink-0">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Preview</p>
              <div className="relative rounded overflow-hidden bg-gray-900" style={{ aspectRatio: '16/9' }}>
                <canvas
                  ref={previewRef}
                  className="w-full h-full block"
                  width={256}
                  height={144}
                />
                {!surface.assetId && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs text-gray-600">No asset assigned</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-700 mt-1.5 text-center">Updates 350ms after you stop typing</p>
            </div>

            {/* AI generate — collapsible */}
            <div className="p-4 border-b border-gray-800 flex-shrink-0">
              <button
                onClick={() => setAiOpen((o) => !o)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition-colors cursor-pointer ${
                  aiOpen
                    ? 'bg-violet-600/20 text-violet-300 border-violet-500/40'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700 border-gray-700'
                }`}
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>AI Generate</span>
                <svg className={`w-3 h-3 ml-auto transition-transform duration-150 ${aiOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {aiOpen && (
                <div className="mt-3 space-y-2.5">
                  <input
                    type="password"
                    placeholder="Anthropic API key"
                    value={aiKey}
                    onChange={(e) => setAiKey(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-violet-500"
                  />
                  <textarea
                    rows={3}
                    placeholder="e.g. glitch effect using audio beat, invert colors on loud bass..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAiGenerate() }}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-violet-500 resize-none"
                  />
                  {aiError && <p className="text-xs text-red-400">{aiError}</p>}
                  <button
                    onClick={handleAiGenerate}
                    disabled={aiLoading || !aiPrompt.trim()}
                    className="w-full py-1.5 text-xs bg-violet-600 hover:bg-violet-500 text-white rounded transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {aiLoading ? 'Generating…' : 'Generate (⌘↵)'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1" />

            {/* Error + footer */}
            <div className="p-4 border-t border-gray-800 flex-shrink-0 space-y-2">
              {error && (
                <p className="text-xs text-red-400 font-mono break-all leading-relaxed">{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 text-xs text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={compiling}
                  className="flex-1 py-2 text-xs bg-green-700 hover:bg-green-600 text-white rounded transition-colors disabled:opacity-50 cursor-pointer font-medium"
                >
                  {compiling ? 'Compiling…' : 'Apply Shader'}
                </button>
              </div>
              {surface.customShader && (
                <button
                  onClick={() => { updateSurfaceProps(surface.id, { customShader: null }); onClose() }}
                  className="w-full py-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Remove shader
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Slider ──────────────────────────────────────────────────────────────────

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  displayValue?: string
  onChange: (v: number) => void
  disabled?: boolean
}

function Slider({ label, value, min, max, step = 0.01, displayValue, onChange, disabled }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline gap-2">
        <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide leading-none select-none">{label}</span>
        <span className="text-sm font-semibold font-mono text-[#d4f542] tabular-nums leading-none shrink-0">
          {displayValue ?? value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: `linear-gradient(to right, #d4f542 ${pct}%, #2d3748 ${pct}%)`,
        }}
      />
    </div>
  )
}

// ─── Corner Nudge ────────────────────────────────────────────────────────────

const QUAD_CORNER_NAMES = ['Top Left', 'Top Right', 'Bottom Right', 'Bottom Left']

interface CornerNudgeProps {
  surface: Surface
  disabled?: boolean
}

function CornerNudge({ surface, disabled }: CornerNudgeProps) {
  const { updateCorner, removeCorner } = useSurfaceStore()
  const N = surface.corners.length
  const nudge = (index: number, axis: 'x' | 'y', delta: number) => {
    const c = surface.corners[index]
    updateCorner(surface.id, index, { ...c, [axis]: c[axis] + delta })
  }

  const label = (i: number) =>
    N === 4 ? QUAD_CORNER_NAMES[i] : `Corner ${i + 1}`

  return (
    <div className="space-y-2">
      {surface.corners.map((corner, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{label(i)}</span>
            {N > 3 && (
              <button
                disabled={disabled}
                onClick={() => removeCorner(surface.id, i)}
                className="text-xs text-gray-600 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-40 px-1"
                title="Remove corner"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex gap-1.5">
            <input
              type="number"
              value={corner.x.toFixed(2)}
              step="0.1"
              disabled={disabled}
              onChange={(e) =>
                updateCorner(surface.id, i, { ...corner, x: parseFloat(e.target.value) || 0 })
              }
              className="w-20 bg-gray-900 border border-gray-600 rounded px-1.5 py-0.5 text-xs font-mono text-gray-200 disabled:opacity-40"
            />
            <input
              type="number"
              value={corner.y.toFixed(2)}
              step="0.1"
              disabled={disabled}
              onChange={(e) =>
                updateCorner(surface.id, i, { ...corner, y: parseFloat(e.target.value) || 0 })
              }
              className="w-20 bg-gray-900 border border-gray-600 rounded px-1.5 py-0.5 text-xs font-mono text-gray-200 disabled:opacity-40"
            />
            <div className="flex gap-0.5 ml-auto">
              {([['←', 'x', -0.05], ['→', 'x', 0.05], ['↓', 'y', -0.05], ['↑', 'y', 0.05]] as const).map(
                ([lbl, axis, delta]) => (
                  <button
                    key={lbl}
                    disabled={disabled}
                    onClick={() => nudge(i, axis, delta)}
                    className="w-6 h-6 bg-gray-800 hover:bg-gray-600 rounded text-xs text-gray-300 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {lbl}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Surface Inspector ───────────────────────────────────────────────────────

interface InspectorProps {
  surface: Surface
  onEditShader: () => void
}

function SurfaceInspector({ surface, onEditShader }: InspectorProps) {
  const { updateSurfaceProps, resetSurface, setActiveSurface } = useSurfaceStore()
  const [cornersOpen, setCornersOpen] = useState(() => localStorage.getItem('openvj-insp-corners') === 'true')
  const [colorOpen, setColorOpen] = useState(() => localStorage.getItem('openvj-insp-color') === 'true')
  const [transformOpen, setTransformOpen] = useState(() => localStorage.getItem('openvj-insp-transform') === 'true')
  const [fxOpen, setFxOpen] = useState(() => localStorage.getItem('openvj-insp-fx') === 'true')
  const [maskOpen, setMaskOpen] = useState(() => localStorage.getItem('openvj-insp-mask') === 'true')

  const update = useCallback(
    (props: Parameters<typeof updateSurfaceProps>[1]) => updateSurfaceProps(surface.id, props),
    [surface.id, updateSurfaceProps]
  )

  const hue        = surface.hue        ?? 0
  const saturation = surface.saturation ?? 1
  const invert     = surface.invert     ?? false
  const flipH      = surface.flipH      ?? false
  const flipV      = surface.flipV      ?? false
  const rotation   = surface.rotation   ?? 0
  const zoom       = surface.zoom       ?? 1
  const warpAmp    = surface.warpAmp    ?? 0
  const warpFreq   = surface.warpFreq   ?? 5
  const chromaAb   = surface.chromaAb   ?? 0
  const pixelate   = surface.pixelate   ?? 0
  const vignette   = surface.vignette   ?? 0

  const maskShape    = surface.maskShape    ?? 'none'
  const maskSoftness = surface.maskSoftness ?? 0.02
  const maskInvert   = surface.maskInvert   ?? false

  const hasEdgeBlend = (surface.edgeBlendLeft ?? 0) > 0 || (surface.edgeBlendRight ?? 0) > 0 || (surface.edgeBlendTop ?? 0) > 0 || (surface.edgeBlendBottom ?? 0) > 0
  const hasFx   = warpAmp > 0 || chromaAb > 0 || pixelate > 0 || vignette > 0 || hasEdgeBlend
  const hasClr  = hue !== 0 || saturation !== 1 || invert
  const hasTfm  = flipH || flipV || rotation !== 0 || zoom !== 1
  const hasMask = maskShape !== 'none'

  return (
    <div className="border-t-2 border-[#d4f542]/50 flex flex-col overflow-hidden" style={{ minHeight: 0, maxHeight: '60vh' }}>
      {/* Inspector header — shows clearly which surface is active */}
      <div className="px-3 py-2.5 bg-gray-900 border-b border-gray-700/60 flex items-center gap-2.5 flex-shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-[#d4f542] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold leading-none mb-0.5">Inspector</div>
          <div className="text-sm font-semibold text-gray-100 truncate leading-tight">{surface.name}</div>
        </div>
        <button
          onClick={() => setActiveSurface(null)}
          className="p-1 rounded text-gray-500 hover:text-gray-200 hover:bg-gray-700 transition-colors cursor-pointer flex-shrink-0"
          title="Deselect surface (Esc)"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="overflow-y-auto flex-1 min-h-0">
        {/* ── Primary controls ── */}
        <div className="px-4 pt-4 pb-5 space-y-5 border-b border-gray-800">
          <Slider label="Opacity"    value={surface.opacity ?? 0.95} min={0} max={1}
            displayValue={`${Math.round((surface.opacity ?? 0.95) * 100)}%`}
            onChange={(v) => update({ opacity: v })} disabled={surface.locked} />
          <Slider label="Brightness" value={surface.brightness ?? 0} min={-0.5} max={0.5}
            displayValue={(surface.brightness ?? 0) >= 0 ? `+${(surface.brightness ?? 0).toFixed(2)}` : (surface.brightness ?? 0).toFixed(2)}
            onChange={(v) => update({ brightness: v })} disabled={surface.locked} />
          <Slider label="Contrast"   value={surface.contrast ?? 0}   min={-0.5} max={0.5}
            displayValue={(surface.contrast ?? 0) >= 0 ? `+${(surface.contrast ?? 0).toFixed(2)}` : (surface.contrast ?? 0).toFixed(2)}
            onChange={(v) => update({ contrast: v })} disabled={surface.locked} />
          {/* Blend mode — segmented control style */}
          <div className="space-y-2">
            <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Blend Mode</span>
            <div className="grid grid-cols-4 gap-1 p-0.5 bg-gray-800/60 rounded-lg">
              {(['normal','add','screen','multiply'] as const).map((mode) => (
                <button key={mode} onClick={() => update({ blendMode: mode })} disabled={surface.locked}
                  title={{ normal: 'Normal blending', add: 'Additive — glows and neon', screen: 'Screen — bright highlights', multiply: 'Multiply — dark textures' }[mode]}
                  className={`py-1.5 text-[11px] font-medium rounded-md transition-all cursor-pointer disabled:opacity-40 capitalize ${
                    (surface.blendMode ?? 'normal') === mode
                      ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                  }`}
                >{mode}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Color FX ── */}
        <div className="border-b border-gray-800/60">
          <button
            onClick={() => setColorOpen(o => { localStorage.setItem('openvj-insp-color', String(!o)); return !o })}
            title="Color adjustments — hue, saturation, invert"
            className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-all cursor-pointer border-l-2 ${
              colorOpen ? 'border-[#d4f542]/60 bg-gray-800/50 text-white' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
            }`}
          >
            <IconChevron open={colorOpen} />
            <span>Color</span>
            {hasClr && <span className="ml-auto w-2 h-2 bg-violet-400 rounded-full" />}
          </button>
          {colorOpen && (
            <div className="px-3 pb-4 space-y-4">
              <Slider label="Hue Shift" value={hue} min={-180} max={180} step={1}
                displayValue={`${hue > 0 ? '+' : ''}${hue}°`}
                onChange={(v) => update({ hue: v })} disabled={surface.locked} />
              <Slider label="Saturation" value={saturation} min={0} max={2} step={0.01}
                displayValue={saturation.toFixed(2)}
                onChange={(v) => update({ saturation: v })} disabled={surface.locked} />
              <div className="flex items-center justify-between py-0.5">
                <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Invert Colors</span>
                <button
                  onClick={() => update({ invert: !invert })}
                  disabled={surface.locked}
                  title="Invert all colors in this surface"
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer disabled:opacity-40 relative flex-shrink-0 ${invert ? 'bg-violet-600' : 'bg-gray-700'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${invert ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Transform ── */}
        <div className="border-b border-gray-800/60">
          <button
            onClick={() => setTransformOpen(o => { localStorage.setItem('openvj-insp-transform', String(!o)); return !o })}
            title="Transform — flip, rotate, zoom"
            className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-all cursor-pointer border-l-2 ${
              transformOpen ? 'border-[#d4f542]/60 bg-gray-800/50 text-white' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
            }`}
          >
            <IconChevron open={transformOpen} />
            <span>Transform</span>
            {hasTfm && <span className="ml-auto w-2 h-2 bg-[#d4f542]/80 rounded-full" />}
          </button>
          {transformOpen && (
            <div className="px-3 pb-4 space-y-4">
              {/* Flip buttons */}
              <div className="space-y-1">
                <span className="text-xs text-gray-400">Flip</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => update({ flipH: !flipH })}
                    disabled={surface.locked}
                    title="Mirror image left ↔ right"
                    className={`flex-1 py-1 text-xs rounded transition-colors cursor-pointer disabled:opacity-40 ${flipH ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                  >⟷ Horizontal</button>
                  <button
                    onClick={() => update({ flipV: !flipV })}
                    disabled={surface.locked}
                    title="Mirror image top ↔ bottom"
                    className={`flex-1 py-1 text-xs rounded transition-colors cursor-pointer disabled:opacity-40 ${flipV ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                  >↕ Vertical</button>
                </div>
              </div>
              <Slider label="Zoom" value={zoom} min={0.25} max={4} step={0.01}
                displayValue={`${zoom.toFixed(2)}×`}
                onChange={(v) => update({ zoom: v })} disabled={surface.locked} />
              <Slider label="Rotation" value={rotation} min={-180} max={180} step={1}
                displayValue={`${rotation > 0 ? '+' : ''}${rotation}°`}
                onChange={(v) => update({ rotation: v })} disabled={surface.locked} />
            </div>
          )}
        </div>

        {/* ── FX ── */}
        <div className="border-b border-gray-800/60">
          <button
            onClick={() => setFxOpen(o => { localStorage.setItem('openvj-insp-fx', String(!o)); return !o })}
            title="FX — warp, RGB split, pixelate, vignette, edge blend"
            className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-all cursor-pointer border-l-2 ${
              fxOpen ? 'border-[#d4f542]/60 bg-gray-800/50 text-white' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
            }`}
          >
            <IconChevron open={fxOpen} />
            <span>FX</span>
            {hasFx && <span className="ml-auto w-2 h-2 bg-orange-400 rounded-full" />}
          </button>
          {fxOpen && (
            <div className="px-3 pb-4 space-y-4">
              <Slider label="Wave Warp" value={warpAmp} min={0} max={0.15} step={0.001}
                displayValue={warpAmp === 0 ? 'Off' : warpAmp.toFixed(3)}
                onChange={(v) => update({ warpAmp: v })} disabled={surface.locked} />
              {warpAmp > 0 && (
                <Slider label="Warp Freq" value={warpFreq} min={0.5} max={30} step={0.5}
                  displayValue={warpFreq.toFixed(1)}
                  onChange={(v) => update({ warpFreq: v })} disabled={surface.locked} />
              )}
              <Slider label="RGB Split" value={chromaAb} min={0} max={0.04} step={0.001}
                displayValue={chromaAb === 0 ? 'Off' : chromaAb.toFixed(3)}
                onChange={(v) => update({ chromaAb: v })} disabled={surface.locked} />
              <Slider label="Pixelate" value={pixelate} min={0} max={128} step={1}
                displayValue={pixelate === 0 ? 'Off' : `${pixelate}px`}
                onChange={(v) => update({ pixelate: v })} disabled={surface.locked} />
              <Slider label="Vignette" value={vignette} min={0} max={1} step={0.01}
                displayValue={vignette === 0 ? 'Off' : vignette.toFixed(2)}
                onChange={(v) => update({ vignette: v })} disabled={surface.locked} />

              {/* Edge blend */}
              <div className="pt-1 border-t border-gray-800/40 space-y-2">
                <span className="text-xs text-gray-500 block">Edge Blend</span>
                {([
                  { key: 'edgeBlendTop',    label: 'Top' },
                  { key: 'edgeBlendBottom', label: 'Bottom' },
                  { key: 'edgeBlendLeft',   label: 'Left' },
                  { key: 'edgeBlendRight',  label: 'Right' },
                ] as { key: 'edgeBlendTop' | 'edgeBlendBottom' | 'edgeBlendLeft' | 'edgeBlendRight'; label: string }[]).map(({ key, label }) => (
                  <Slider key={key} label={label} value={surface[key] ?? 0} min={0} max={0.5} step={0.005}
                    displayValue={(surface[key] ?? 0) === 0 ? 'Off' : ((surface[key] ?? 0) * 100).toFixed(0) + '%'}
                    onChange={(v) => update({ [key]: v })} disabled={surface.locked} />
                ))}</div>
            </div>
          )}
        </div>

        {/* ── Mask ── */}
        <div className="border-b border-gray-800/60">
          <button
            onClick={() => setMaskOpen(o => { localStorage.setItem('openvj-insp-mask', String(!o)); return !o })}
            title="Mask — shape-based transparency overlay"
            className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-all cursor-pointer border-l-2 ${
              maskOpen ? 'border-[#d4f542]/60 bg-gray-800/50 text-white' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
            }`}
          >
            <IconChevron open={maskOpen} />
            <span>Mask</span>
            {hasMask && <span className="ml-auto w-2 h-2 bg-amber-400 rounded-full" />}
          </button>
          {maskOpen && (
            <div className="px-3 pb-4 space-y-4">
              {/* Shape picker */}
              <div className="space-y-1.5">
                <span className="text-xs text-gray-400">Shape</span>
                <div className="grid grid-cols-4 gap-1">
                  {([
                    { id: 'none',     label: 'None',    icon: '○' },
                    { id: 'ellipse',  label: 'Ellipse', icon: '⬤' },
                    { id: 'triangle', label: 'Tri',     icon: '▲' },
                    { id: 'diamond',  label: 'Diamond', icon: '◆' },
                    { id: 'top',      label: 'Top',     icon: '▀' },
                    { id: 'bottom',   label: 'Bot',     icon: '▄' },
                    { id: 'left',     label: 'Left',    icon: '◧' },
                    { id: 'right',    label: 'Right',   icon: '◨' },
                  ] as { id: MaskShape; label: string; icon: string }[]).map(({ id, label, icon }) => (
                    <button
                      key={id}
                      onClick={() => update({ maskShape: id })}
                      disabled={surface.locked}
                      title={label}
                      className={`py-1 text-xs rounded transition-colors cursor-pointer disabled:opacity-40 flex flex-col items-center gap-0.5 ${
                        maskShape === id
                          ? 'bg-amber-600/80 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                      }`}
                    >
                      <span className="text-base leading-none">{icon}</span>
                      <span className="text-[9px] leading-none">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {maskShape !== 'none' && (
                <>
                  <Slider
                    label="Softness"
                    value={maskSoftness}
                    min={0}
                    max={0.15}
                    step={0.005}
                    displayValue={maskSoftness === 0 ? 'Hard' : maskSoftness.toFixed(3)}
                    onChange={(v) => update({ maskSoftness: v })}
                    disabled={surface.locked}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Invert</span>
                    <button
                      onClick={() => update({ maskInvert: !maskInvert })}
                      disabled={surface.locked}
                      className={`w-10 h-5 rounded-full transition-colors cursor-pointer disabled:opacity-40 relative ${maskInvert ? 'bg-amber-600' : 'bg-gray-700'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${maskInvert ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Chroma Key ── */}
        <div className="border-b border-gray-800/60">
          <div className="flex items-center gap-2 px-3 py-2">
            <button
              onClick={() => update({ chromaKey: !surface.chromaKey })}
              disabled={surface.locked}
              className={`flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium transition-colors cursor-pointer disabled:opacity-40 ${
                surface.chromaKey ? 'text-green-400' : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Toggle chroma key"
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${surface.chromaKey ? 'bg-green-400' : 'bg-gray-700'}`} />
              Chroma Key
            </button>
            {surface.chromaKey && (
              <div className="flex items-center gap-2 ml-auto">
                {/* Color picker swatch */}
                <label className="cursor-pointer" title="Pick key colour">
                  <div
                    className="w-5 h-5 rounded border border-gray-600"
                    style={{
                      background: `rgb(${Math.round((surface.chromaColor?.[0] ?? 0) * 255)},${Math.round((surface.chromaColor?.[1] ?? 1) * 255)},${Math.round((surface.chromaColor?.[2] ?? 0) * 255)})`,
                    }}
                  />
                  <input
                    type="color"
                    className="hidden"
                    value={`#${Math.round((surface.chromaColor?.[0] ?? 0) * 255).toString(16).padStart(2, '0')}${Math.round((surface.chromaColor?.[1] ?? 1) * 255).toString(16).padStart(2, '0')}${Math.round((surface.chromaColor?.[2] ?? 0) * 255).toString(16).padStart(2, '0')}`}
                    onChange={(e) => {
                      const hex = e.target.value
                      const r = parseInt(hex.slice(1, 3), 16) / 255
                      const g = parseInt(hex.slice(3, 5), 16) / 255
                      const b = parseInt(hex.slice(5, 7), 16) / 255
                      update({ chromaColor: [r, g, b] })
                    }}
                  />
                </label>
              </div>
            )}
          </div>
          {surface.chromaKey && (
            <div className="px-3 pb-3 space-y-2">
              <Slider label="Threshold" value={surface.chromaThreshold ?? 0.3} min={0} max={1} step={0.01}
                displayValue={(surface.chromaThreshold ?? 0.3).toFixed(2)}
                onChange={(v) => update({ chromaThreshold: v })} disabled={surface.locked} />
              <Slider label="Softness" value={surface.chromaSoftness ?? 0.1} min={0} max={0.5} step={0.01}
                displayValue={(surface.chromaSoftness ?? 0.1).toFixed(2)}
                onChange={(v) => update({ chromaSoftness: v })} disabled={surface.locked} />
            </div>
          )}
        </div>

        {/* ── Corners ── */}
        <div className="border-b border-gray-800/60">
          <button
            onClick={() => setCornersOpen(o => { localStorage.setItem('openvj-insp-corners', String(!o)); return !o })}
            title="Fine-tune corner positions numerically"
            className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-all cursor-pointer border-l-2 ${
              cornersOpen ? 'border-[#d4f542]/60 bg-gray-800/50 text-white' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
            }`}
          >
            <IconChevron open={cornersOpen} />
            <span>Corners</span>
          </button>
          {cornersOpen && (
            <div className="px-3 pb-3">
              <CornerNudge surface={surface} disabled={surface.locked} />
            </div>
          )}
        </div>

        {/* ── Custom Shader ── */}
        <div className="border-b border-gray-800/60">
          <div className="w-full flex items-center gap-2 px-3 py-2">
            <svg className="w-3 h-3 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Shader</span>
            {surface.customShader && (
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" title="Custom shader active" />
            )}
            <div className="ml-auto flex gap-1">
              {surface.customShader && (
                <button
                  onClick={() => updateSurfaceProps(surface.id, { customShader: null })}
                  disabled={surface.locked}
                  className="text-xs text-gray-600 hover:text-red-400 px-1 py-0.5 transition-colors cursor-pointer disabled:opacity-40"
                  title="Remove custom shader"
                >
                  Clear
                </button>
              )}
              <button
                onClick={onEditShader}
                disabled={surface.locked}
                title={surface.customShader ? 'Edit the GLSL shader for this surface' : 'Add a custom GLSL post-process shader'}
                className="px-2 py-0.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded border border-gray-700 hover:border-gray-500 transition-colors cursor-pointer disabled:opacity-40"
              >
                {surface.customShader ? 'Edit' : '+ Add'}
              </button>
            </div>
          </div>
        </div>

        {/* Reset */}
        <div className="p-3">
          <button
            onClick={() => resetSurface(surface.id)}
            disabled={surface.locked}
            title="Reset all inspector values to defaults (can't undo this one)"
            className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors border border-gray-700 hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Surface List Item ───────────────────────────────────────────────────────

interface SurfaceItemProps {
  surface: Surface
  index: number
  isActive: boolean
  onSelect: () => void
  onEditShader: () => void
  onDragStart: (index: number) => void
  onDragOver: (index: number) => void
  onDrop: () => void
  isDragTarget: boolean
  indented?: boolean
}

function SurfaceItem({ surface, index, isActive, onSelect, onEditShader, onDragStart, onDragOver, onDrop, isDragTarget, indented = false }: SurfaceItemProps) {
  const { toggleVisibility, toggleLock, removeSurface, renameSurface, cloneSurface, groups, setSurfaceGroup } = useSurfaceStore()
  const [editing, setEditing] = useState(false)
  const [nameValue, setNameValue] = useState(surface.name)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [groupMenuOpen, setGroupMenuOpen] = useState(false)

  const commitRename = () => {
    renameSurface(surface.id, nameValue)
    setEditing(false)
  }

  return (
    <div className={indented ? 'pl-3' : ''}>
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDragging(true); onDragStart(index) }}
      onDragEnd={() => setDragging(false)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index) }}
      onDrop={(e) => { e.preventDefault(); onDrop() }}
      onClick={onSelect}
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors select-none ${
        dragging ? 'opacity-40' : ''
      } ${
        isDragTarget ? 'border border-[#d4f542]/70 bg-[#d4f542]/10' :
        isActive
          ? 'bg-[#d4f542]/10 border border-[#d4f542]/50'
          : 'border border-transparent hover:bg-gray-700/60'
      }`}
    >
      {/* Drag handle */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing transition-opacity">
        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="9" cy="7" r="1.5" /><circle cx="15" cy="7" r="1.5" />
          <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="17" r="1.5" /><circle cx="15" cy="17" r="1.5" />
        </svg>
      </div>
      {/* Active indicator dot */}
      <div
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
          isActive ? 'bg-[#d4f542]' : 'bg-gray-600 group-hover:bg-gray-400'
        }`}
      />

      {/* Name (editable on double-click) */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') { setNameValue(surface.name); setEditing(false) }
              e.stopPropagation()
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="w-full bg-gray-900 border border-gray-600 rounded px-1.5 py-0.5 text-xs text-gray-100 outline-none"
          />
        ) : (
          <span
            className="text-xs text-gray-200 truncate block"
            onDoubleClick={(e) => {
              e.stopPropagation()
              setNameValue(surface.name)
              setEditing(true)
            }}
            title="Double-click to rename"
          >
            {surface.name}
          </span>
        )}
      </div>

      {/* Custom shader indicator */}
      {surface.customShader && (
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 opacity-70" title="Custom shader" />
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onEditShader() }}
          className="p-1 rounded text-gray-400 hover:text-green-400 hover:bg-gray-600 transition-colors cursor-pointer"
          title="Edit surface shader"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); toggleVisibility(surface.id) }}
          className={`p-1 rounded transition-colors cursor-pointer ${
            surface.visible
              ? 'text-gray-400 hover:text-gray-100 hover:bg-gray-600'
              : 'text-gray-600 hover:text-gray-300 hover:bg-gray-600'
          }`}
          title={surface.visible ? 'Hide' : 'Show'}
        >
          <IconEye crossed={!surface.visible} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); toggleLock(surface.id) }}
          className={`p-1 rounded transition-colors cursor-pointer ${
            surface.locked
              ? 'text-amber-400 hover:text-amber-300 hover:bg-gray-600'
              : 'text-gray-400 hover:text-gray-100 hover:bg-gray-600'
          }`}
          title={surface.locked ? 'Unlock' : 'Lock'}
        >
          <IconLock locked={surface.locked} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); cloneSurface(surface.id) }}
          className="p-1 rounded text-gray-400 hover:text-[#d4f542] hover:bg-gray-600 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
          title="Duplicate surface"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); removeSurface(surface.id) }}
          className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-gray-600 transition-colors cursor-pointer"
          title="Delete"
        >
          <IconTrash />
        </button>
      </div>

      {/* Group assignment pill (always visible when in a group; hover to change) */}
      {groups.length > 0 && (
        <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setGroupMenuOpen((o) => !o)}
            title="Assign to group"
            className={`p-1 rounded transition-colors cursor-pointer text-xs ${
              surface.groupId
                ? 'text-violet-400 hover:text-violet-300 hover:bg-gray-600'
                : 'opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-300 hover:bg-gray-600'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </button>
          {groupMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setGroupMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 min-w-32">
                {surface.groupId && (
                  <button
                    className="w-full px-3 py-1.5 text-xs text-left text-gray-400 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => { setSurfaceGroup(surface.id, null); setGroupMenuOpen(false) }}
                  >
                    Remove from group
                  </button>
                )}
                {groups.map((g) => (
                  <button
                    key={g.id}
                    className={`w-full px-3 py-1.5 text-xs text-left hover:bg-gray-700 transition-colors cursor-pointer ${
                      surface.groupId === g.id ? 'text-violet-400' : 'text-gray-300 hover:text-white'
                    }`}
                    onClick={() => { setSurfaceGroup(surface.id, g.id); setGroupMenuOpen(false) }}
                  >
                    {surface.groupId === g.id ? '✓ ' : ''}{g.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
    </div>
  )
}

// ─── Main Export ─────────────────────────────────────────────────────────────

interface SurfaceListProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function SurfaceList({ collapsed = false, onToggle }: SurfaceListProps = {}) {
  const {
    surfaces,
    groups,
    activeSurfaceId,
    addSurface,
    addGroup,
    removeGroup,
    renameGroup,
    toggleGroupCollapsed,
    toggleGroupVisibility,
    setActiveSurface,
    exportConfig,
    importConfig,
    reorderSurface,
  } = useSurfaceStore()
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null)
  const [renameGroupVal, setRenameGroupVal] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeSurface = surfaces.find((s) => s.id === activeSurfaceId) ?? null
  const [presetsOpen, setPresetsOpen] = useState(false)
  const [editingSurfaceId, setEditingSurfaceId] = useState<string | null>(null)
  const editingSurface = surfaces.find((s) => s.id === editingSurfaceId) ?? null
  const dragFrom = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleExport = () => {
    const data = JSON.stringify(exportConfig(), null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `openvj-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const config = JSON.parse(ev.target?.result as string)
        importConfig(config)
      } catch {
        alert('Invalid config file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-700 flex items-center justify-between flex-shrink-0 relative">
        <div className="flex items-center gap-2">
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-0.5 text-gray-600 hover:text-gray-300 transition-colors cursor-pointer"
              title={collapsed ? 'Expand Surfaces' : 'Collapse Surfaces'}
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-150 ${collapsed ? '' : 'rotate-90'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Surfaces</span>
          <span className="text-xs text-gray-500 font-mono bg-gray-800 px-1.5 py-0.5 rounded">
            {surfaces.length}
          </span>
        </div>
        {!collapsed && (
          <div className="flex items-center gap-1.5">
            {/* Presets button */}
            <button
              onClick={() => setPresetsOpen((o) => !o)}
              title="Layout presets"
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors cursor-pointer ${
                presetsOpen
                  ? 'bg-[#d4f542]/15 border-[#d4f542]/50 text-[#d4f542]'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500'
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Presets
            </button>
            {/* Group button */}
            <button
              onClick={addGroup}
              title="Create layer group"
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200 rounded transition-colors cursor-pointer"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Group
            </button>
            {/* Add button */}
            <button
              onClick={addSurface}
              title="Add a new blank surface — drag it wherever you want"
              className="flex items-center gap-1 px-2 py-1 text-xs bg-[#d4f542] hover:bg-[#b8d930] text-black rounded transition-colors cursor-pointer"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          </div>
        )}

        {/* Preset picker dropdown */}
        {presetsOpen && !collapsed && <PresetPicker onClose={() => setPresetsOpen(false)} />}
      </div>

      {!collapsed && (
        <>
          {/* Surface list with groups */}
          <div className="flex-1 overflow-y-auto py-1.5 px-1.5 space-y-0.5 min-h-0">
            {surfaces.length === 0 && groups.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500">
                No surfaces yet — click Add
              </div>
            ) : (() => {
              // Build display items preserving z-order (reversed for top-of-list = front)
              const reversedSurfaces = [...surfaces].map((s, i) => ({ s, origIdx: i })).reverse()
              const seenGroupIds = new Set<string>()
              const items: JSX.Element[] = []

              for (const { s: surface, origIdx } of reversedSurfaces) {
                const gid = surface.groupId ?? null

                if (gid) {
                  if (!seenGroupIds.has(gid)) {
                    seenGroupIds.add(gid)
                    const group = groups.find((g) => g.id === gid)
                    if (group) {
                      const groupSurfaces = reversedSurfaces.filter((x) => (x.s.groupId ?? null) === gid)
                      const allVisible = groupSurfaces.every((x) => x.s.visible)
                      items.push(
                        <div key={`group-${gid}`} className="rounded-lg border border-gray-700/60 overflow-hidden">
                          {/* Group header */}
                          <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-800/60">
                            <button
                              onClick={() => toggleGroupCollapsed(gid)}
                              className="p-0.5 text-gray-500 hover:text-gray-200 transition-colors cursor-pointer flex-shrink-0"
                              title={group.collapsed ? 'Expand' : 'Collapse'}
                            >
                              <svg className={`w-3 h-3 transition-transform ${group.collapsed ? '' : 'rotate-90'}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>

                            {renamingGroupId === gid ? (
                              <input
                                autoFocus
                                value={renameGroupVal}
                                onChange={(e) => setRenameGroupVal(e.target.value)}
                                onBlur={() => { renameGroup(gid, renameGroupVal); setRenamingGroupId(null) }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') { renameGroup(gid, renameGroupVal); setRenamingGroupId(null) }
                                  if (e.key === 'Escape') setRenamingGroupId(null)
                                  e.stopPropagation()
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 min-w-0 bg-gray-700 text-gray-100 text-xs rounded px-1 py-0.5 outline-none"
                              />
                            ) : (
                              <span
                                className="flex-1 min-w-0 text-xs font-medium text-gray-300 truncate cursor-text"
                                onDoubleClick={() => { setRenameGroupVal(group.name); setRenamingGroupId(gid) }}
                                title="Double-click to rename"
                              >
                                {group.name}
                              </span>
                            )}

                            <span className="text-[10px] text-gray-600 font-mono flex-shrink-0">
                              {groupSurfaces.length}
                            </span>

                            <button
                              onClick={() => toggleGroupVisibility(gid)}
                              className={`p-0.5 rounded transition-colors cursor-pointer flex-shrink-0 ${
                                allVisible ? 'text-gray-500 hover:text-gray-200' : 'text-gray-700 hover:text-gray-400'
                              }`}
                              title={allVisible ? 'Hide group' : 'Show group'}
                            >
                              <IconEye crossed={!allVisible} />
                            </button>
                            <button
                              onClick={() => removeGroup(gid)}
                              className="p-0.5 rounded text-gray-700 hover:text-red-400 transition-colors cursor-pointer flex-shrink-0"
                              title="Delete group (surfaces become ungrouped)"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          {/* Group surfaces */}
                          {!group.collapsed && (
                            <div className="py-0.5 space-y-0.5 bg-gray-900/30">
                              {groupSurfaces.map(({ s: gs, origIdx: gi }) => (
                                <SurfaceItem
                                  key={gs.id}
                                  surface={gs}
                                  index={gi}
                                  isActive={activeSurfaceId === gs.id}
                                  isDragTarget={dragOverIndex === gi && dragFrom.current !== null && dragFrom.current !== gi}
                                  onSelect={() => setActiveSurface(gs.id)}
                                  onEditShader={() => { setActiveSurface(gs.id); setEditingSurfaceId(gs.id) }}
                                  onDragStart={(i) => { dragFrom.current = i; setDragOverIndex(null) }}
                                  onDragOver={(i) => setDragOverIndex(i)}
                                  onDrop={() => {
                                    if (dragFrom.current !== null && dragFrom.current !== dragOverIndex && dragOverIndex !== null) {
                                      reorderSurface(dragFrom.current, dragOverIndex)
                                    }
                                    dragFrom.current = null
                                    setDragOverIndex(null)
                                  }}
                                  indented
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    }
                  }
                } else {
                  items.push(
                    <SurfaceItem
                      key={surface.id}
                      surface={surface}
                      index={origIdx}
                      isActive={activeSurfaceId === surface.id}
                      isDragTarget={dragOverIndex === origIdx && dragFrom.current !== null && dragFrom.current !== origIdx}
                      onSelect={() => setActiveSurface(surface.id)}
                      onEditShader={() => { setActiveSurface(surface.id); setEditingSurfaceId(surface.id) }}
                      onDragStart={(i) => { dragFrom.current = i; setDragOverIndex(null) }}
                      onDragOver={(i) => setDragOverIndex(i)}
                      onDrop={() => {
                        if (dragFrom.current !== null && dragFrom.current !== dragOverIndex && dragOverIndex !== null) {
                          reorderSurface(dragFrom.current, dragOverIndex)
                        }
                        dragFrom.current = null
                        setDragOverIndex(null)
                      }}
                    />
                  )
                }
              }

              // Render empty groups (no surfaces assigned yet)
              for (const group of groups) {
                if (!seenGroupIds.has(group.id)) {
                  items.push(
                    <div key={`group-empty-${group.id}`} className="rounded-lg border border-gray-700/60 overflow-hidden">
                      <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-800/60">
                        <span className="w-4 flex-shrink-0" />
                        {renamingGroupId === group.id ? (
                          <input
                            autoFocus
                            value={renameGroupVal}
                            onChange={(e) => setRenameGroupVal(e.target.value)}
                            onBlur={() => { renameGroup(group.id, renameGroupVal); setRenamingGroupId(null) }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { renameGroup(group.id, renameGroupVal); setRenamingGroupId(null) }
                              if (e.key === 'Escape') setRenamingGroupId(null)
                              e.stopPropagation()
                            }}
                            className="flex-1 min-w-0 bg-gray-700 text-gray-100 text-xs rounded px-1 py-0.5 outline-none"
                          />
                        ) : (
                          <span
                            className="flex-1 min-w-0 text-xs font-medium text-gray-500 truncate cursor-text"
                            onDoubleClick={() => { setRenameGroupVal(group.name); setRenamingGroupId(group.id) }}
                          >
                            {group.name}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-700 font-mono flex-shrink-0">0</span>
                        <button
                          onClick={() => removeGroup(group.id)}
                          className="p-0.5 rounded text-gray-700 hover:text-red-400 transition-colors cursor-pointer flex-shrink-0"
                          title="Delete group"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="px-3 py-2 text-xs text-gray-700 text-center">
                        Assign surfaces via the group button on each surface
                      </div>
                    </div>
                  )
                }
              }

              return items
            })()}
          </div>

          {/* Import / Export */}
          <div className="px-3 py-2 border-t border-gray-700 flex gap-2 flex-shrink-0">
            <button
              onClick={handleExport}
              className="flex-1 py-1.5 text-xs text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 rounded transition-colors cursor-pointer"
            >
              Export
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-1.5 text-xs text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 rounded transition-colors cursor-pointer"
            >
              Import
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </div>

          {/* Inspector — shown when a surface is selected */}
          {activeSurface && (
            <SurfaceInspector
              surface={activeSurface}
              onEditShader={() => setEditingSurfaceId(activeSurface.id)}
            />
          )}
        </>
      )}

      {/* Surface shader editor modal */}
      {editingSurface && (
        <SurfaceShaderEditor
          surface={editingSurface}
          onClose={() => setEditingSurfaceId(null)}
        />
      )}
    </div>
  )
}

export default SurfaceList
