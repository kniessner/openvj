import { useState, useEffect, useRef } from 'react'
import {
  renderUji, UjiAnimator, UjiParams, UjiAudioMod, UjiBlendMode,
  DEFAULT_UJI_PARAMS, DEFAULT_AUDIO_MOD, UJI_PRESETS,
} from '../lib/ujiRenderer'
import { useAssetStore, Asset } from '../stores/assetStore'
import { useSurfaceStore } from '../stores/surfaceStore'
import { assetTextureManager } from '../lib/assetTextureManager'
import { audioEngine } from '../lib/audioEngine'

// ─── Collapsible Section ──────────────────────────────────────────────────────

function Section({ id, title, badge, defaultOpen = true, children }: {
  id: string; title: string; badge?: React.ReactNode
  defaultOpen?: boolean; children: React.ReactNode
}) {
  const lsKey = `uji-section-${id}`
  const [open, setOpen] = useState(() => {
    const s = localStorage.getItem(lsKey)
    return s !== null ? s === 'true' : defaultOpen
  })
  const toggle = () => {
    const next = !open
    setOpen(next)
    localStorage.setItem(lsKey, String(next))
  }
  return (
    <div>
      <button onClick={toggle}
        className="flex items-center gap-2 border-b border-gray-800 pb-1.5 mb-2.5 w-full text-left group hover:border-gray-700 transition-colors">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex-1 group-hover:text-gray-400 transition-colors">{title}</h4>
        {badge}
        <svg className={`w-3 h-3 text-gray-600 flex-shrink-0 transition-transform ${open ? '' : '-rotate-90'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="space-y-2.5">{children}</div>}
    </div>
  )
}

// ─── Enhanced Slider ──────────────────────────────────────────────────────────

interface SliderProps {
  label: string; value: number
  min: number; max: number; step: number
  defaultValue?: number
  format?: (v: number) => string
  accent?: string
  onChange: (v: number) => void
}

function Slider({ label, value, min, max, step, defaultValue, format, accent = '#3b82f6', onChange }: SliderProps) {
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  const display = format
    ? format(value)
    : value.toFixed(step < 0.01 ? 3 : step < 0.1 ? 2 : step < 1 ? 1 : 0)

  const commit = () => {
    const n = parseFloat(editVal)
    if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)))
    setEditing(false)
  }

  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-0.5 items-center">
      <span className="text-xs text-gray-400 select-none cursor-default"
        onDoubleClick={() => { if (defaultValue !== undefined) onChange(defaultValue) }}
        title={defaultValue !== undefined ? `Double-click to reset (${defaultValue})` : undefined}>
        {label}
      </span>
      {editing ? (
        <input ref={inputRef} type="number" value={editVal}
          min={min} max={max} step={step}
          onChange={(e) => setEditVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          className="text-xs font-mono text-right tabular-nums w-14 bg-gray-800 border border-gray-600/60 rounded px-1 py-0.5 outline-none"
          style={{ color: accent }} />
      ) : (
        <span className="text-xs font-mono text-right tabular-nums w-14 cursor-pointer hover:opacity-70 transition-opacity"
          style={{ color: accent }}
          onClick={() => { setEditVal(value.toString()); setEditing(true) }}
          title="Click to type a value">
          {display}
        </span>
      )}
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="col-span-2 w-full cursor-pointer h-1.5 rounded-full appearance-none"
        style={{ background: `linear-gradient(to right, ${accent} ${pct}%, #374151 ${pct}%)` }} />
    </div>
  )
}

// ─── Color Input ──────────────────────────────────────────────────────────────

function ColorInput({ label, r, g, b, onChange }: {
  label: string; r: number; g: number; b: number
  onChange: (r: number, g: number, b: number) => void
}) {
  const hex = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs text-gray-400 w-24 flex-shrink-0">{label}</span>
      <input type="color" value={hex}
        onChange={(e) => {
          const v = e.target.value
          onChange(parseInt(v.slice(1,3),16), parseInt(v.slice(3,5),16), parseInt(v.slice(5,7),16))
        }}
        className="w-7 h-7 cursor-pointer rounded border border-gray-600 bg-transparent flex-shrink-0"
        style={{ padding: '1px' }} />
      <span className="text-xs font-mono text-gray-600">{hex}</span>
    </div>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SHAPES = [
  { v: 1, label: 'Circle' }, { v: 2, label: 'Square' },
  { v: 3, label: 'Triangle' }, { v: 4, label: 'Line' },
] as const

const LINE_CAPS: { v: UjiParams['lineCap']; label: string }[] = [
  { v: 'auto', label: 'Auto' }, { v: 'butt', label: 'Flat' },
  { v: 'round', label: 'Round' }, { v: 'square', label: 'Sq' },
]

const BLEND_MODES: { v: UjiBlendMode; label: string }[] = [
  { v: 'source-over', label: 'Normal'   },
  { v: 'screen',      label: 'Screen'   },
  { v: 'lighter',     label: 'Add'      },
  { v: 'overlay',     label: 'Overlay'  },
  { v: 'multiply',    label: 'Multiply' },
  { v: 'color-dodge', label: 'Dodge'    },
  { v: 'difference',  label: 'Diff'     },
  { v: 'exclusion',   label: 'Excl'     },
  { v: 'darken',      label: 'Darken'   },
  { v: 'lighten',     label: 'Lighten'  },
]

const STATIC_PRESETS = ['Galaxy', 'Helix', 'Vortex', 'Geometric', 'Storm', 'Triangle', 'Neon Bloom', 'Off-Center', 'Spiral Reveal']
const AUDIO_PRESETS  = ['Beat Pulse', 'Bass Bloom', 'Freq Web', 'Glow Storm']

type Tab = 'shape' | 'style' | 'live'
const TABS: { id: Tab; label: string }[] = [
  { id: 'shape', label: 'Shape' },
  { id: 'style', label: 'Style' },
  { id: 'live',  label: 'Live'  },
]

// ─── UjiGenerator ─────────────────────────────────────────────────────────────

interface UjiGeneratorProps {
  asset: Asset | null
  onClose: () => void
}

export function UjiGenerator({ asset, onClose }: UjiGeneratorProps) {
  const { addAsset, updateAsset } = useAssetStore()
  const { activeSurfaceId, assignAsset } = useSurfaceStore()

  const [name, setName]     = useState(asset?.name ?? 'Uji Art')
  const [params, setParams] = useState<UjiParams>(() => {
    const base = { ...DEFAULT_UJI_PARAMS, ...(asset?.ujiParams ?? {}) }
    const audioMod = asset?.ujiParams?.audioMod
    const mergedAudioMod = typeof audioMod === 'object' ? { ...DEFAULT_AUDIO_MOD, ...audioMod } : DEFAULT_AUDIO_MOD
    return { ...base, audioMod: mergedAudioMod }
  })
  const [seed, setSeed]             = useState(() => Math.floor(Math.random() * 1e9))
  const [rendering, setRendering]   = useState(false)
  const [renderMs, setRenderMs]     = useState<number | null>(null)
  const [tab, setTab]               = useState<Tab>('shape')
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null)

  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const animatorRef   = useRef<UjiAnimator | null>(null)
  const animRafRef    = useRef<number>(0)
  const animActiveRef = useRef(false)
  const paramsRef     = useRef(params)

  const setParam = <K extends keyof UjiParams>(k: K, v: UjiParams[K]) =>
    setParams((p) => ({ ...p, [k]: v }))
  const setAudio = <K extends keyof UjiAudioMod>(k: K, v: UjiAudioMod[K]) => {
    setParams((p) => {
      const cur = typeof p.audioMod === 'object' ? p.audioMod : DEFAULT_AUDIO_MOD
      return { ...p, audioMod: { ...cur, [k]: v } }
    })
  }

  useEffect(() => { paramsRef.current = params }, [params])

  useEffect(() => {
    if (params.animate) return
    setRendering(true)
    const id = setTimeout(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const t0 = performance.now()
      renderUji(canvas, params, seed, 'preview')
      setRenderMs(Math.round(performance.now() - t0))
      setRendering(false)
    }, 350)
    return () => clearTimeout(id)
  }, [params, seed])

  useEffect(() => {
    if (!params.animate) {
      animActiveRef.current = false
      cancelAnimationFrame(animRafRef.current)
      animatorRef.current = null
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    animatorRef.current = new UjiAnimator(canvas, { ...params })
    animActiveRef.current = true
    setRenderMs(null)
    const loop = () => {
      if (!animActiveRef.current) return
      const anim = animatorRef.current
      if (anim) {
        anim.params = paramsRef.current
        anim.step(audioEngine.low, audioEngine.mid, audioEngine.high, audioEngine.beat)
      }
      animRafRef.current = requestAnimationFrame(loop)
    }
    animRafRef.current = requestAnimationFrame(loop)
    return () => {
      animActiveRef.current = false
      cancelAnimationFrame(animRafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.animate, params.shape, params.segments, params.radius,
      params.bgR, params.bgG, params.bgB])

  const generateThumbnail = (key: string) => {
    if (thumbnails[key]) return
    const c = document.createElement('canvas')
    c.width = c.height = 64
    try {
      renderUji(c, { ...UJI_PRESETS[key], animate: false }, undefined, 'preview')
      const url = c.toDataURL()
      setThumbnails((prev) => ({ ...prev, [key]: url }))
    } catch {}
  }

  const handleSave = async () => {
    if (asset) {
      updateAsset(asset.id, { name, ujiParams: params })
      await assetTextureManager.reload({ ...asset, name, ujiParams: params })
    } else {
      const id = addAsset({ type: 'uji', name, ujiParams: params })
      const newAsset: Asset = { id, type: 'uji', name, ujiParams: params }
      await assetTextureManager.load(newAsset)
      if (activeSurfaceId) assignAsset(activeSurfaceId, id)
    }
    onClose()
  }

  const am = typeof params.audioMod === 'object' ? params.audioMod : DEFAULT_AUDIO_MOD

  const applyPreset = (key: string) => {
    const preset = UJI_PRESETS[key]
    const presetAudioMod = typeof preset.audioMod === 'object' ? preset.audioMod : DEFAULT_AUDIO_MOD
    setParams({ ...preset, audioMod: { ...DEFAULT_AUDIO_MOD, ...presetAudioMod } })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-700 flex-shrink-0">
          <svg className="w-4 h-4 text-pink-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 3c-1.2 5.4-5 8-5 12a5 5 0 0010 0c0-4-3.8-6.6-5-12z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3c1.2 5.4 5 8 5 12" />
          </svg>
          <span className="text-sm font-semibold text-gray-100">Uji Generator</span>
          {params.animate && (
            <span className="text-xs px-1.5 py-0.5 bg-orange-600/20 text-orange-400 border border-orange-500/30 rounded font-medium">
              Animated
            </span>
          )}
          <div className="flex-1" />
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 outline-none focus:border-pink-500 transition-colors w-44"
            placeholder="Asset name" />
          <button onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Preset bar ── */}
        <div className="flex items-end gap-1.5 px-4 py-2.5 border-b border-gray-800 bg-gray-900/50 flex-shrink-0 overflow-x-auto">
          <span className="text-[10px] text-gray-600 mb-1 flex-shrink-0 pb-0.5">Static</span>
          {STATIC_PRESETS.map((key) => (
            <div key={key} className="relative flex-shrink-0" style={{ isolation: 'isolate' }}>
              <button
                onClick={() => applyPreset(key)}
                onMouseEnter={() => { setHoveredPreset(key); generateThumbnail(key) }}
                onMouseLeave={() => setHoveredPreset(null)}
                className="px-2.5 py-1 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 text-gray-400 rounded-lg transition-colors cursor-pointer">
                {key}
              </button>
              {hoveredPreset === key && thumbnails[key] && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                  <img src={thumbnails[key]} alt="" className="w-16 h-16 rounded border border-gray-600 shadow-xl" style={{ imageRendering: 'pixelated' }} />
                </div>
              )}
            </div>
          ))}
          <div className="w-px h-5 bg-gray-700 mx-0.5 flex-shrink-0 self-center" />
          <span className="text-[10px] text-orange-700 mb-1 flex-shrink-0 pb-0.5">Audio</span>
          {AUDIO_PRESETS.map((key) => (
            <div key={key} className="relative flex-shrink-0" style={{ isolation: 'isolate' }}>
              <button
                onClick={() => applyPreset(key)}
                onMouseEnter={() => { setHoveredPreset(key); generateThumbnail(key) }}
                onMouseLeave={() => setHoveredPreset(null)}
                className="px-2.5 py-1 text-xs bg-orange-900/20 hover:bg-orange-900/30 border border-orange-700/40 hover:border-orange-600/60 text-orange-400 rounded-lg transition-colors cursor-pointer">
                {key}
              </button>
              {hoveredPreset === key && thumbnails[key] && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                  <img src={thumbnails[key]} alt="" className="w-16 h-16 rounded border border-orange-700/40 shadow-xl" style={{ imageRendering: 'pixelated' }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* ── Left panel ── */}
          <div className="w-80 flex-shrink-0 flex flex-col border-r border-gray-800 overflow-hidden">

            {/* Tab bar */}
            <div className="flex border-b border-gray-800 flex-shrink-0">
              {TABS.map(({ id, label }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`flex-1 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    tab === id
                      ? 'text-pink-400 border-b-2 border-pink-500 -mb-px bg-gray-900'
                      : 'text-gray-600 hover:text-gray-400 border-b-2 border-transparent -mb-px'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div key={tab} className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0">

              {tab === 'shape' && (
                <>
                  <Section id="geometry" title="Geometry">
                    <div className="space-y-1.5">
                      <span className="text-xs text-gray-400">Shape</span>
                      <div className="grid grid-cols-4 gap-1">
                        {SHAPES.map(({ v, label }) => (
                          <button key={v} onClick={() => setParam('shape', v)}
                            className={`py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                              params.shape === v
                                ? 'bg-pink-600/20 border-pink-500/50 text-pink-300'
                                : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600'
                            }`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Slider label="Segments"   value={params.segments}   min={100}  max={3000} step={50}  defaultValue={DEFAULT_UJI_PARAMS.segments}   onChange={(v) => setParam('segments', v)} />
                    <Slider label="Radius"     value={params.radius}     min={30}   max={240}  step={5}   defaultValue={DEFAULT_UJI_PARAMS.radius}     onChange={(v) => setParam('radius', v)} />
                    <Slider label="Iterations" value={params.iterations} min={50}   max={800}  step={10}  defaultValue={DEFAULT_UJI_PARAMS.iterations} onChange={(v) => setParam('iterations', v)} />
                  </Section>

                  <Section id="rotation" title="Rotation">
                    <Slider label="Speed (°/iter)"  value={params.rotationSpeed}   min={-6}    max={6}    step={0.05}  defaultValue={DEFAULT_UJI_PARAMS.rotationSpeed}   onChange={(v) => setParam('rotationSpeed', v)} />
                    <Slider label="Acceleration"    value={params.rotationSpeedup} min={-0.03} max={0.03} step={0.001} defaultValue={DEFAULT_UJI_PARAMS.rotationSpeedup} onChange={(v) => setParam('rotationSpeedup', v)} />
                    <Slider label="Period (–1=off)" value={params.rotationPeriod}  min={-1}    max={500}  step={1}     defaultValue={DEFAULT_UJI_PARAMS.rotationPeriod}  onChange={(v) => setParam('rotationPeriod', v)}
                      format={(v) => v < 0 ? 'off' : v.toFixed(0)} />
                    <Slider label="Stop after"      value={params.rotationUntil ?? -1} min={-1} max={500} step={1}    defaultValue={-1}                                 onChange={(v) => setParam('rotationUntil', v)}
                      format={(v) => v < 0 ? 'never' : v.toFixed(0)} />
                    <Slider label="Pivot X"         value={params.rotationOriginH ?? 0.5} min={0} max={1} step={0.01} defaultValue={0.5}                               onChange={(v) => setParam('rotationOriginH', v)} />
                    <Slider label="Pivot Y"         value={params.rotationOriginV ?? 0.5} min={0} max={1} step={0.01} defaultValue={0.5}                               onChange={(v) => setParam('rotationOriginV', v)} />
                  </Section>

                  <Section id="motion" title="Motion">
                    <Slider label="Expansion H"   value={params.expansionH}   min={0.995} max={1.005} step={0.0001} defaultValue={DEFAULT_UJI_PARAMS.expansionH}   onChange={(v) => setParam('expansionH', v)} />
                    <Slider label="Expansion V"   value={params.expansionV}   min={0.995} max={1.005} step={0.0001} defaultValue={DEFAULT_UJI_PARAMS.expansionV}   onChange={(v) => setParam('expansionV', v)} />
                    <Slider label="Translation H" value={params.translationH} min={-5}    max={5}     step={0.1}    defaultValue={DEFAULT_UJI_PARAMS.translationH} onChange={(v) => setParam('translationH', v)} />
                    <Slider label="Translation V" value={params.translationV} min={-5}    max={5}     step={0.1}    defaultValue={DEFAULT_UJI_PARAMS.translationV} onChange={(v) => setParam('translationV', v)} />
                    <Slider label="Jitter"        value={params.jitter}       min={0}     max={10}    step={0.1}    defaultValue={DEFAULT_UJI_PARAMS.jitter}       onChange={(v) => setParam('jitter', v)} />
                    <Slider label="Reveal speed"  value={params.revealSpeed ?? -1} min={-1} max={60} step={0.5}    defaultValue={-1}                               onChange={(v) => setParam('revealSpeed', v)}
                      format={(v) => v < 0 ? 'instant' : v.toFixed(1)} />
                  </Section>

                  <Section id="waviness" title="Waviness">
                    <Slider label="Period H" value={params.wavinessPH} min={-1} max={2000} step={1}   defaultValue={DEFAULT_UJI_PARAMS.wavinessPH} onChange={(v) => setParam('wavinessPH', v)} format={(v) => v < 0 ? 'off' : v.toFixed(0)} />
                    <Slider label="Amp H"    value={params.wavinessAH} min={0}  max={12}   step={0.2} defaultValue={DEFAULT_UJI_PARAMS.wavinessAH} onChange={(v) => setParam('wavinessAH', v)} />
                    <Slider label="Period V" value={params.wavinessPV} min={-1} max={2000} step={1}   defaultValue={DEFAULT_UJI_PARAMS.wavinessPV} onChange={(v) => setParam('wavinessPV', v)} format={(v) => v < 0 ? 'off' : v.toFixed(0)} />
                    <Slider label="Amp V"    value={params.wavinessAV} min={0}  max={12}   step={0.2} defaultValue={DEFAULT_UJI_PARAMS.wavinessAV} onChange={(v) => setParam('wavinessAV', v)} />
                  </Section>
                </>
              )}

              {tab === 'style' && (
                <Section id="appearance" title="Appearance">
                  <Slider label="Thickness"      value={params.thickness}       min={0.1} max={4}   step={0.05}  defaultValue={DEFAULT_UJI_PARAMS.thickness}      onChange={(v) => setParam('thickness', v)} />
                  <Slider label="Opacity"        value={params.lineOpacity}     min={0.02} max={1}  step={0.01}  defaultValue={DEFAULT_UJI_PARAMS.lineOpacity}     onChange={(v) => setParam('lineOpacity', v)} />
                  <Slider label="Hue shift/iter" value={params.hueshiftSpeed}   min={-10} max={10}  step={0.1}   defaultValue={DEFAULT_UJI_PARAMS.hueshiftSpeed}   onChange={(v) => setParam('hueshiftSpeed', v)} />
                  <Slider label="Seg. rotation"  value={params.segmentRotation} min={0}   max={90}  step={1}     defaultValue={DEFAULT_UJI_PARAMS.segmentRotation} onChange={(v) => setParam('segmentRotation', v)} format={(v) => v + '°'} />
                  <Slider label="Skip chance"    value={params.skipChance}      min={0}   max={0.4} step={0.005} defaultValue={DEFAULT_UJI_PARAMS.skipChance}      onChange={(v) => setParam('skipChance', v)} />
                  <Slider label="Glow"           value={params.shadowBlur ?? 0} min={0}   max={30}  step={0.5}   defaultValue={0}                                  onChange={(v) => setParam('shadowBlur', v)} accent="#f0abfc" />
                  <ColorInput label="Line color" r={params.lineR} g={params.lineG} b={params.lineB}
                    onChange={(r,g,b) => setParams((p) => ({ ...p, lineR: r, lineG: g, lineB: b }))} />
                  <ColorInput label="Background" r={params.bgR} g={params.bgG} b={params.bgB}
                    onChange={(r,g,b) => setParams((p) => ({ ...p, bgR: r, bgG: g, bgB: b }))} />
                  <div className="space-y-1.5">
                    <span className="text-xs text-gray-400">Blend mode</span>
                    <div className="grid grid-cols-5 gap-1">
                      {BLEND_MODES.map(({ v, label }) => (
                        <button key={v} onClick={() => setParam('blendMode', v)}
                          className={`py-1 text-[10px] rounded border transition-colors cursor-pointer ${
                            (params.blendMode ?? 'source-over') === v
                              ? 'bg-fuchsia-600/25 border-fuchsia-500/50 text-fuchsia-300'
                              : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600'
                          }`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs text-gray-400">Line cap</span>
                    <div className="grid grid-cols-4 gap-1">
                      {LINE_CAPS.map(({ v, label }) => (
                        <button key={v} onClick={() => setParam('lineCap', v)}
                          className={`py-1.5 text-xs rounded border transition-colors cursor-pointer ${
                            (params.lineCap ?? 'auto') === v
                              ? 'bg-pink-600/20 border-pink-500/50 text-pink-300'
                              : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600'
                          }`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </Section>
              )}

              {tab === 'live' && (
                <>
                  <Section id="animation" title="Animation"
                    badge={
                      <button onClick={() => setParam('animate', !params.animate)}
                        className={`flex items-center gap-1.5 px-2 py-0.5 text-xs rounded border transition-colors cursor-pointer ${
                          params.animate
                            ? 'bg-orange-600/20 border-orange-500/40 text-orange-400'
                            : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${params.animate ? 'bg-orange-400' : 'bg-gray-600'}`} />
                        {params.animate ? 'On' : 'Off'}
                      </button>
                    }>
                    {params.animate ? (
                      <Slider label="Iters/frame" value={params.itersPerFrame} min={1} max={10} step={1}
                        accent="#f97316" defaultValue={DEFAULT_UJI_PARAMS.itersPerFrame}
                        onChange={(v) => setParam('itersPerFrame', v)}
                        format={(v) => v.toFixed(0)} />
                    ) : (
                      <p className="text-xs text-gray-600">Enable for continuous live animation with audio reactivity.</p>
                    )}
                  </Section>

                  {params.animate && (
                    <Section id="audiomod" title="Audio Modulation"
                      badge={<span className="text-xs text-orange-500 font-mono">requires mic</span>}>
                      <Slider label="Rotation ← bass"  value={am.rotByLow}      min={-4}    max={4}     step={0.1}    accent="#ef4444" defaultValue={0} onChange={(v) => setAudio('rotByLow', v)} />
                      <Slider label="Rotation ← beat"  value={am.rotByBeat}     min={-6}    max={6}     step={0.1}    accent="#ef4444" defaultValue={0} onChange={(v) => setAudio('rotByBeat', v)} />
                      <Slider label="Jitter ← treble"  value={am.jitterByHigh}  min={0}     max={10}    step={0.2}    accent="#22c55e" defaultValue={0} onChange={(v) => setAudio('jitterByHigh', v)} />
                      <Slider label="Jitter ← beat"    value={am.jitterByBeat}  min={0}     max={10}    step={0.2}    accent="#22c55e" defaultValue={0} onChange={(v) => setAudio('jitterByBeat', v)} />
                      <Slider label="Expansion ← bass" value={am.expansionByLow} min={-0.006} max={0.006} step={0.0002} accent="#ef4444" defaultValue={0} onChange={(v) => setAudio('expansionByLow', v)} />
                      <Slider label="Hue shift ← mid"  value={am.hueshiftByMid} min={-12}   max={12}    step={0.2}    accent="#f59e0b" defaultValue={0} onChange={(v) => setAudio('hueshiftByMid', v)} />
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={am.clearOnBeat}
                          onChange={(e) => setAudio('clearOnBeat', e.target.checked)}
                          className="w-3.5 h-3.5 accent-orange-500 cursor-pointer" />
                        <span className="text-xs text-gray-400">Clear canvas on beat</span>
                      </label>
                    </Section>
                  )}

                  {!params.animate && (
                    <p className="text-xs text-gray-600 px-1">Switch Animation on to access audio modulation controls.</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Preview ── */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 bg-gray-950/50 min-h-0">
            <div className="relative rounded-xl overflow-hidden border border-gray-700 shadow-xl w-full"
              style={{ aspectRatio: '1/1', maxWidth: '520px' }}>
              <canvas ref={canvasRef} width={512} height={512}
                style={{ width: '100%', height: '100%', display: 'block' }} />
              {rendering && !params.animate && (
                <div className="absolute inset-0 bg-gray-950/60 flex items-center justify-center">
                  <svg className="w-5 h-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
              {params.animate && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5">
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
                  <span className="text-xs text-orange-400 font-mono">live</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!params.animate && (
                <button onClick={() => setSeed(Math.floor(Math.random() * 1e9))}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg transition-colors cursor-pointer">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  New seed
                </button>
              )}
              {renderMs !== null && !params.animate && (
                <span className="text-xs text-gray-700 font-mono">{renderMs}ms preview</span>
              )}
              {params.animate && audioEngine.active && (
                <span className="text-xs text-orange-500/70">Audio reactive — mic active</span>
              )}
              {params.animate && !audioEngine.active && (
                <span className="text-xs text-gray-600">Enable mic in transport bar for audio reactivity</span>
              )}
            </div>

            <p className="text-xs text-gray-700 text-center max-w-60 leading-relaxed">
              {params.animate
                ? `${params.itersPerFrame} iters/frame · ${params.segments} segments · audio-reactive`
                : `${params.segments} segs × ${params.iterations} iters · preview at 50% quality`}
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-700 flex-shrink-0">
          <p className="text-xs text-gray-700">
            {params.animate ? 'Animated · audio-reactive' : `Static · ${params.segments} segs × ${params.iterations} iters`}
            {params.hueshiftSpeed !== 0 && !params.animate && ' · hue animated'}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="px-4 py-1.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer">
              Cancel
            </button>
            <button onClick={handleSave}
              className="px-5 py-1.5 text-sm bg-pink-600 hover:bg-pink-500 text-white rounded-lg transition-colors cursor-pointer font-medium">
              {asset ? 'Save Changes' : 'Add to Media'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UjiGenerator
