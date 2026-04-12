import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useAssetStore, Asset, AssetType, DEFAULT_SHADER, BUILTIN_ASSETS } from '../stores/assetStore'
import { useSurfaceStore } from '../stores/surfaceStore'
import { assetTextureManager } from '../lib/assetTextureManager'

// ─── Type icons ───────────────────────────────────────────────────────────────

function AssetIcon({ type, className = 'w-3.5 h-3.5' }: { type: AssetType; className?: string }) {
  switch (type) {
    case 'video':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    case 'image':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    case 'shader':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    case 'webcam':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        </svg>
      )
    case 'screencapture':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    case 'uji':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 3c-1.2 5.4-5 8-5 12a5 5 0 0010 0c0-4-3.8-6.6-5-12z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 3c1.2 5.4 5 8 5 12" />
        </svg>
      )
  }
}

// ─── GLSL syntax highlighter ─────────────────────────────────────────────────

function highlightGLSL(raw: string): string {
  const BLOCK_CMT = /^\/\*[\s\S]*?\*\//
  const LINE_CMT  = /^\/\/.*/
  const PREPROC   = /^#\w+/
  const NUM       = /^\d+\.?\d*(?:[eE][+-]?\d+)?f?\b/
  const GL_VAR    = /^gl_\w+/
  const IDENT     = /^[a-zA-Z_]\w*/
  const TYPES_RE  = /^(?:void|float|int|uint|bool|vec[234]|ivec[234]|bvec[234]|mat[234]|mat[234]x[234]|sampler2D|sampler3D|samplerCube|sampler2DShadow)$/
  const KW_RE     = /^(?:if|else|for|while|do|return|break|continue|discard|struct|const|uniform|in|out|inout|attribute|varying|precision|highp|mediump|lowp|layout|flat|smooth|invariant)$/
  const FN_RE     = /^(?:abs|sign|floor|ceil|round|trunc|fract|mod|modf|min|max|clamp|mix|step|smoothstep|length|distance|dot|cross|normalize|reflect|refract|faceforward|pow|exp|exp2|log|log2|sqrt|inversesqrt|sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|radians|degrees|fwidth|dFdx|dFdy|texture2D|textureCube|texture2DLod|texture2DProj|texture2DProjLod|textureCubeLod|texture|all|any|not|equal|notEqual|lessThan|greaterThan|lessThanEqual|greaterThanEqual|outerProduct|transpose|determinant|inverse|isnan|isinf|floatBitsToInt|intBitsToFloat|noise1|noise2|noise3|noise4)$/
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

// ─── Shader editor modal ──────────────────────────────────────────────────────

interface ShaderEditorProps {
  asset: Asset
  onClose: () => void
}

const GLSL_SYSTEM_PROMPT = `You are a GLSL ES 1.0 fragment shader writer for a realtime VJ projection tool. Output ONLY raw GLSL code — no markdown fences, no explanations. Write the void main() function and any required helper functions. Do NOT include precision declarations or uniform declarations — they are prepended automatically. Available uniforms: uTime (float, seconds elapsed), uResolution (vec2, canvas size in px), uAudioLow (float 0-1, bass 20-300Hz), uAudioMid (float 0-1, mids 300-4kHz), uAudioHigh (float 0-1, highs 4-20kHz), uBeat (float 0-1, decaying beat pulse). The output must set gl_FragColor. Keep it under 60 lines.`

export function ShaderEditor({ asset, onClose }: ShaderEditorProps) {
  const { updateAsset } = useAssetStore()
  const [code, setCode] = useState(asset.shaderCode ?? DEFAULT_SHADER)
  const [error, setError] = useState<string | null>(null)
  const [compiling, setCompiling] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiKey, setAiKey] = useState(() => localStorage.getItem('openvj-anthropic-key') ?? '')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const taRef  = useRef<HTMLTextAreaElement>(null)

  const highlighted = useMemo(() => highlightGLSL(code), [code])

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
          system: GLSL_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: aiPrompt }],
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? `HTTP ${res.status}`)
      }
      const data = await res.json()
      const generated: string = data.content?.[0]?.text ?? ''
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

  const handleCompile = async () => {
    setCompiling(true)
    setError(null)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 64; canvas.height = 64
      const renderer = new (await import('three')).WebGLRenderer({ canvas })
      const mat = new (await import('three')).ShaderMaterial({
        vertexShader: `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
        fragmentShader: `precision highp float;\nuniform float uTime;\nuniform vec2 uResolution;\n${code}`,
        uniforms: { uTime: { value: 0 }, uResolution: { value: new (await import('three')).Vector2(64, 64) } },
      })
      const scene = new (await import('three')).Scene()
      const geo   = new (await import('three')).PlaneGeometry(2, 2)
      const cam   = new (await import('three')).OrthographicCamera(-1, 1, 1, -1, 0, 1)
      scene.add(new (await import('three')).Mesh(geo, mat))
      renderer.render(scene, cam)
      renderer.dispose(); geo.dispose(); mat.dispose()
      updateAsset(asset.id, { shaderCode: code })
      await assetTextureManager.reload({ ...asset, shaderCode: code })
      setError(null)
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
          <AssetIcon type="shader" className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-gray-200">{asset.name}</span>
          <span className="text-xs text-gray-600 font-mono">— GLSL Fragment Shader</span>
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
            {/* Highlighted backdrop */}
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
            {/* Transparent editable textarea on top */}
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

            {/* Uniform reference */}
            <div className="p-4 border-b border-gray-800 flex-shrink-0">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Uniforms</p>
              <div className="space-y-2">
                {([
                  { name: 'uTime',       type: 'float', col: '#c084fc', desc: 'seconds elapsed' },
                  { name: 'uResolution', type: 'vec2',  col: '#c084fc', desc: 'canvas size px' },
                  { name: 'uAudioLow',   type: 'float', col: '#fbbf24', desc: 'bass  0–1' },
                  { name: 'uAudioMid',   type: 'float', col: '#fbbf24', desc: 'mids  0–1' },
                  { name: 'uAudioHigh',  type: 'float', col: '#fbbf24', desc: 'highs 0–1' },
                  { name: 'uBeat',       type: 'float', col: '#fbbf24', desc: 'beat pulse 0–1' },
                ] as const).map(({ name, type, col, desc }) => (
                  <div key={name} className="flex items-baseline gap-2 text-xs font-mono">
                    <span style={{ color: col }}>{name}</span>
                    <span style={{ color: '#67e8f9' }}>{type}</span>
                    <span className="text-gray-600 ml-auto">{desc}</span>
                  </div>
                ))}
              </div>
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
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe the effect… e.g. 'galaxy of dots pulsing with bass'"
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 resize-none outline-none focus:border-violet-500 transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAiGenerate()
                    }}
                  />
                  <input
                    type="password"
                    value={aiKey}
                    onChange={(e) => setAiKey(e.target.value)}
                    placeholder="Anthropic API key (sk-ant-…)"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 outline-none focus:border-violet-500 transition-colors font-mono"
                  />
                  {aiError && <p className="text-xs text-red-400">{aiError}</p>}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-700">⌘↵ to generate</p>
                    <button
                      onClick={handleAiGenerate}
                      disabled={aiLoading || !aiPrompt.trim()}
                      className="px-3 py-1.5 text-xs bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {aiLoading ? (
                        <>
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Generating…
                        </>
                      ) : 'Generate'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Compile / Cancel */}
            <div className="p-4 border-t border-gray-700 flex-shrink-0 space-y-2">
              {error && (
                <div className="text-xs text-red-400 font-mono bg-red-950/40 border border-red-900/40 rounded-lg p-2.5 break-all leading-relaxed">
                  {error}
                </div>
              )}
              <button
                onClick={handleCompile}
                disabled={compiling}
                className="w-full py-2.5 text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {compiling && (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {compiling ? 'Compiling…' : 'Compile & Apply'}
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-200 hover:bg-gray-700/60 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Asset thumbnail ──────────────────────────────────────────────────────────

function VideoThumbnail({ url, className }: { url: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.preload = 'metadata'
    video.src = url
    video.currentTime = 0.1

    const draw = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width = video.videoWidth || 64
      canvas.height = video.videoHeight || 36
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    }

    video.addEventListener('seeked', draw)
    video.addEventListener('loadeddata', () => { video.currentTime = 0.1 })
    video.load()

    return () => {
      video.removeEventListener('seeked', draw)
      video.src = ''
    }
  }, [url])

  return <canvas ref={canvasRef} className={className} />
}

function AssetThumbnail({ asset }: { asset: Asset }) {
  if (asset.type === 'image' && asset.url) {
    return (
      <img
        src={asset.url}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
      />
    )
  }
  if (asset.type === 'video' && asset.url) {
    return <VideoThumbnail url={asset.url} className="w-full h-full object-cover" />
  }
  return (
    <div className="w-full h-full flex items-center justify-center">
      <AssetIcon type={asset.type} className="w-4 h-4 opacity-40" />
    </div>
  )
}

// ─── Asset card ───────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<AssetType, string> = {
  video:         'text-blue-400',
  image:         'text-green-400',
  shader:        'text-purple-400',
  webcam:        'text-yellow-400',
  screencapture: 'text-orange-400',
  uji:           'text-pink-400',
}

interface AssetCardProps {
  asset: Asset
  assignedSurfaceNames: string[]
  isActiveSurface: boolean
  isBuiltin?: boolean
  onAssign: () => void
  onEdit: () => void
  onRemove: () => void
}

function AssetCard({ asset, assignedSurfaceNames, isActiveSurface, isBuiltin, onAssign, onEdit, onRemove }: AssetCardProps) {
  const hasAssignment = assignedSurfaceNames.length > 0

  return (
    <div
      onClick={onAssign}
      className={`group relative flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer border transition-all ${
        isActiveSurface && hasAssignment
          ? 'bg-blue-600/15 border-blue-500/50'
          : hasAssignment
          ? 'bg-gray-800 border-gray-600'
          : 'bg-gray-800/60 border-transparent hover:bg-gray-800 hover:border-gray-700'
      }`}
      title={isActiveSurface ? 'Click to assign to active surface' : 'Click to assign to selected surface'}
    >
      {/* Thumbnail / icon */}
      <div className="flex-shrink-0 w-10 h-7 rounded overflow-hidden bg-gray-900 flex items-center justify-center">
        <AssetThumbnail asset={asset} />
      </div>

      {/* Name + built-in badge */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-gray-200 font-medium truncate">{asset.name}</p>
          {isBuiltin && (
            <span className="text-xs text-gray-600 font-mono flex-shrink-0">built-in</span>
          )}
        </div>
        {hasAssignment && (
          <p className="text-xs text-gray-500 truncate">
            {assignedSurfaceNames.join(', ')}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {(asset.type === 'shader' || asset.type === 'uji') && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className={`p-1 rounded text-gray-500 hover:bg-gray-700 transition-colors cursor-pointer ${asset.type === 'uji' ? 'hover:text-pink-400' : 'hover:text-purple-400'}`}
            title={asset.type === 'uji' ? 'Edit generator' : isBuiltin ? 'View shader' : 'Edit shader'}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        {!isBuiltin && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-gray-700 transition-colors cursor-pointer"
            title="Remove"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Filter tab ───────────────────────────────────────────────────────────────

const ALL_TYPES: (AssetType | 'all')[] = ['all', 'video', 'image', 'shader', 'uji', 'webcam', 'screencapture']
const TYPE_LABELS: Record<AssetType | 'all', string> = {
  all: 'All',
  video: 'Video',
  image: 'Image',
  shader: 'Shader',
  uji: 'Uji',
  webcam: 'Cam',
  screencapture: 'Screen',
}

// ─── Add menu ─────────────────────────────────────────────────────────────────

interface AddMenuProps {
  onAdd: (type: AssetType, data?: Partial<Asset>) => Promise<void>
  onClose: () => void
}

function AddMenu({ onAdd, onClose }: AddMenuProps) {
  const options: { type: AssetType; label: string; desc: string }[] = [
    { type: 'video',         label: 'Video File',     desc: 'MP4 · WebM · MOV' },
    { type: 'image',         label: 'Image File',     desc: 'PNG · JPG · GIF · WebP' },
    { type: 'shader',        label: 'GLSL Shader',    desc: 'Fragment shader code' },
    { type: 'uji',           label: 'Uji Generator',  desc: 'Iterative line art — 6 presets' },
    { type: 'webcam',        label: 'Webcam',         desc: 'Live camera feed' },
    { type: 'screencapture', label: 'Screen Capture', desc: 'Capture any window' },
  ]
  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-20 overflow-hidden">
      {options.map(({ type, label, desc }) => (
        <button
          key={type}
          onClick={() => { onAdd(type); onClose() }}
          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-700 transition-colors cursor-pointer text-left"
        >
          <div className={`flex-shrink-0 ${TYPE_COLORS[type]}`}>
            <AssetIcon type={type} className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-200">{label}</p>
            <p className="text-xs text-gray-500">{desc}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface MediaBrowserProps {
  onEditShader: (asset: Asset | null) => void
  onNewUji: () => void
  onEditUji: (asset: Asset) => void
  collapsed?: boolean
  onToggle?: () => void
}

export function MediaBrowser({ onEditShader, onNewUji, onEditUji, collapsed = false, onToggle }: MediaBrowserProps) {
  const { assets, addAsset, removeAsset } = useAssetStore()
  const { surfaces, activeSurfaceId, assignAsset } = useSurfaceStore()
  const [filter, setFilter] = useState<AssetType | 'all'>('all')
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileTypeRef = useRef<AssetType>('video')

  const activeSurface = surfaces.find((s) => s.id === activeSurfaceId) ?? null

  // Which surfaces use a given asset
  const assignedSurfaces = useCallback(
    (assetId: string) => surfaces.filter((s) => s.assetId === assetId).map((s) => s.name),
    [surfaces]
  )

  const allAssets = [...BUILTIN_ASSETS, ...assets]
  const filteredAssets = filter === 'all' ? allAssets : allAssets.filter((a) => a.type === filter)

  // ── Add asset ──────────────────────────────────────────────────────────────

  const handleAdd = async (type: AssetType) => {
    setError(null)
    if (type === 'video' || type === 'image') {
      fileTypeRef.current = type
      fileInputRef.current?.click()
      return
    }
    if (type === 'shader') {
      const id = addAsset({ type: 'shader', name: `Shader ${assets.filter(a => a.type === 'shader').length + 1}`, shaderCode: DEFAULT_SHADER })
      // Open editor for the new shader
      const newAsset = { type, name: `Shader ${assets.filter(a => a.type === 'shader').length + 1}`, shaderCode: DEFAULT_SHADER, id }
      onEditShader(newAsset)
      return
    }
    if (type === 'uji') {
      onNewUji()
      return
    }
    if (type === 'webcam') {
      const id = addAsset({ type: 'webcam', name: 'Webcam' })
      try {
        await assetTextureManager.load({ id, type: 'webcam', name: 'Webcam' })
        if (activeSurfaceId) assignAsset(activeSurfaceId, id)
      } catch {
        removeAsset(id)
        setError('Webcam access denied')
      }
      return
    }
    if (type === 'screencapture') {
      const id = addAsset({ type: 'screencapture', name: 'Screen Capture' })
      try {
        await assetTextureManager.load({ id, type: 'screencapture', name: 'Screen Capture' })
        if (activeSurfaceId) assignAsset(activeSurfaceId, id)
      } catch {
        removeAsset(id)
        setError('Screen capture denied')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) {
      const type = fileTypeRef.current
      const url = URL.createObjectURL(file)
      const isGif = file.name.toLowerCase().endsWith('.gif')
      const id = addAsset({ type, name: file.name, url, isAnimated: isGif })
      // Auto-assign to active surface if none assigned
      if (activeSurfaceId && !activeSurface?.assetId) {
        assignAsset(activeSurfaceId, id)
      }
    }
    e.target.value = ''
  }

  // ── Assign / remove ────────────────────────────────────────────────────────

  const handleAssign = (asset: Asset) => {
    if (!activeSurfaceId) return
    const alreadyAssigned = activeSurface?.assetId === asset.id
    assignAsset(activeSurfaceId, alreadyAssigned ? null : asset.id)
  }

  const handleRemove = (asset: Asset) => {
    // Unassign from all surfaces
    surfaces.forEach((s) => { if (s.assetId === asset.id) assignAsset(s.id, null) })
    assetTextureManager.dispose(asset.id)
    if (asset.url) URL.revokeObjectURL(asset.url)
    removeAsset(asset.id)
  }

  // ── Drag and drop (files only) ─────────────────────────────────────────────
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) }
  const handleDragLeave = (e: React.DragEvent) => {
    if (!(e.currentTarget as Element).contains(e.relatedTarget as Node)) setIsDragOver(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    for (const file of Array.from(e.dataTransfer.files)) {
      const type: AssetType = file.type.startsWith('video/') ? 'video' : 'image'
      const url = URL.createObjectURL(file)
      const isGif = file.name.toLowerCase().endsWith('.gif')
      const id = addAsset({ type, name: file.name, url, isAnimated: isGif })
      if (activeSurfaceId && !activeSurface?.assetId) assignAsset(activeSurfaceId, id)
    }
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="px-3 py-2.5 flex items-center justify-between flex-shrink-0 border-b border-gray-700">
        <div className="flex items-center gap-2">
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-0.5 text-gray-600 hover:text-gray-300 transition-colors cursor-pointer"
              title={collapsed ? 'Expand Media' : 'Collapse Media'}
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-150 ${collapsed ? '' : 'rotate-90'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Media</span>
          <span className="text-xs text-gray-600 font-mono bg-gray-800 px-1.5 py-0.5 rounded">
            {allAssets.length}
          </span>
        </div>
        {!collapsed && !activeSurfaceId && (
          <span className="text-xs text-gray-600 italic">select a surface</span>
        )}
      </div>

      {!collapsed && (
        <>
          {/* Type filter tabs */}
          <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-700 overflow-x-auto flex-shrink-0">
            {ALL_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-2 py-1 text-xs rounded transition-colors whitespace-nowrap cursor-pointer flex-shrink-0 ${
                  filter === t
                    ? 'bg-gray-700 text-gray-100'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                }`}
              >
                {TYPE_LABELS[t]}
                {t !== 'all' && (
                  <span className="ml-1 text-gray-600">
                    {allAssets.filter(a => a.type === t).length || ''}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Asset list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
            {filteredAssets.length === 0 ? (
              <div
                className={`h-full min-h-24 flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 text-gray-600'
                }`}
              >
                <svg className="w-8 h-8 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-xs">Drop files or click Add</p>
              </div>
            ) : (
              filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  assignedSurfaceNames={assignedSurfaces(asset.id)}
                  isActiveSurface={activeSurface?.assetId === asset.id}
                  isBuiltin={asset.id.startsWith('builtin-')}
                  onAssign={() => handleAssign(asset)}
                  onEdit={() => asset.type === 'uji' ? onEditUji(asset) : onEditShader(asset)}
                  onRemove={() => handleRemove(asset)}
                />
              ))
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2 border-t border-red-900/50 bg-red-950/40 text-xs text-red-400 flex items-center justify-between flex-shrink-0">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-2 cursor-pointer hover:text-red-300">×</button>
            </div>
          )}

          {/* Add button */}
          <div className="p-2 border-t border-gray-700 flex-shrink-0 relative">
            <button
              onClick={() => setAddMenuOpen((o) => !o)}
              className="w-full py-2 flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Asset
            </button>
            {addMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setAddMenuOpen(false)} />
                <AddMenu
                  onAdd={handleAdd}
                  onClose={() => setAddMenuOpen(false)}
                />
              </>
            )}
          </div>
        </>
      )}

      {/* Hidden file input — always mounted so programmatic clicks work */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,image/*"
        onChange={handleFileChange}
        className="hidden"
      />

    </div>
  )
}

export default MediaBrowser
