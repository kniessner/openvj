/**
 * OpenVJ - p5.js Editor Modal
 *
 * Full-screen split editor: code on left, live preview on right.
 * AI generation mirrors the ShaderEditor's Anthropic API approach.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useP5JsStore } from '../stores/p5jsStore'

// ─── Syntax highlighting ──────────────────────────────────────────────────────

function highlightCode(code: string): string {
  const keywords = ['function', 'var', 'let', 'const', 'if', 'else', 'for', 'while',
    'return', 'class', 'new', 'this', 'true', 'false', 'null', 'undefined',
    'setup', 'draw', 'background', 'fill', 'stroke', 'circle', 'rect', 'line',
    'push', 'pop', 'translate', 'rotate', 'scale', 'noise', 'random', 'map',
    'lerp', 'constrain', 'dist', 'abs', 'floor', 'ceil', 'round', 'sin', 'cos',
    'tan', 'atan2', 'PI', 'TWO_PI', 'HALF_PI', 'colorMode', 'RGB', 'HSB']
  const kwRe = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g')

  let h = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  h = h.replace(/(\/\/.*$)/gm, '<span style="color:#6b7280">$1</span>')
  h = h.replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6b7280">$1</span>')
  h = h.replace(/(['"`])(.*?)\1/g, '<span style="color:#22c55e">$1$2$1</span>')
  h = h.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span style="color:#f97316">$1</span>')
  h = h.replace(kwRe, '<span style="color:#c084fc">$1</span>')
  h = h.replace(/\b(createCanvas|beginShape|endShape|vertex|bezierVertex|noFill|noStroke|strokeWeight|ellipse|triangle|quad|arc|text|textSize|textAlign|loadPixels|updatePixels|frameRate|loop|noLoop|redraw|millis|width|height|frameCount|mouseX|mouseY|mouseIsPressed|keyIsPressed|key|keyCode|smooth|noSmooth|sphere|box|cylinder|torus|ambientLight|directionalLight|pointLight|rotateX|rotateY|rotateZ)\b/g,
    '<span style="color:#38bdf8">$1</span>')
  h = h.replace(/\b(openvj)\b/g, '<span style="color:#ec4899">$1</span>')
  h = h.replace(/\b(audio|midi)\b/g, '<span style="color:#f59e0b">$1</span>')
  h = h.replace(/\b(getLow|getMid|getHigh|getBeat|getBpm|getCC)\b/g, '<span style="color:#10b981">$1</span>')
  return h
}

// ─── AI system prompt ─────────────────────────────────────────────────────────

const P5_SYSTEM_PROMPT =
  `You are a p5.js sketch writer for a realtime VJ projection tool. Output ONLY raw p5.js code in global mode — ` +
  `function setup() and function draw(). No markdown fences, no explanations. ` +
  `The canvas is available via createCanvas(w, h). Use openvj.audio.getLow()/getMid()/getHigh()/getBeat()/getBpm() ` +
  `for audio (values 0-255). Use openvj.midi.getCC(n) for MIDI (0-1). Keep it under 80 lines.`

// ─── P5JsEditorModal ─────────────────────────────────────────────────────────

interface P5JsEditorModalProps {
  isOpen: boolean
  onClose: () => void
  layerId: string | null
}

export const P5JsEditorModal: React.FC<P5JsEditorModalProps> = ({ isOpen, onClose, layerId }) => {
  const {
    layers, sources,
    updateSketchCode, updateSketchName, templates, loadTemplate,
    toggleLayer, addLayer, setLayerOpacity, setLayerBlendMode, getOrCreateSource,
  } = useP5JsStore()

  const [code, setCode]           = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const [activeTab, setActiveTab] = useState<'code' | 'help'>('code')
  const [showPreview, setShowPreview] = useState(true)

  // AI generation state
  const [aiOpen, setAiOpen]       = useState(false)
  const [aiPrompt, setAiPrompt]   = useState('')
  const [aiKey, setAiKey]         = useState(() => localStorage.getItem('openvj-anthropic-key') ?? '')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError]     = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const preRef      = useRef<HTMLPreElement>(null)
  const previewRef  = useRef<HTMLCanvasElement>(null)
  const previewRafRef = useRef<number>(0)

  const activeLayer = layerId ? layers.find(l => l.id === layerId) : null

  useEffect(() => {
    if (activeLayer) {
      setCode(activeLayer.sketch.code)
      setIsPlaying(activeLayer.isPlaying)
      setError(null)
    }
  }, [layerId, activeLayer?.sketch.code])

  // Live preview: copy source canvas to preview canvas each frame
  useEffect(() => {
    if (!isOpen || !layerId) { cancelAnimationFrame(previewRafRef.current); return }

    const draw = () => {
      const canvas = previewRef.current
      if (canvas) {
        const source = sources.get(layerId) ?? (() => {
          const s = getOrCreateSource(layerId); return s ?? undefined
        })()
        if (source) {
          const src = source.getCanvas()
          if (src.width > 0 && src.height > 0) {
            if (canvas.width !== src.width || canvas.height !== src.height) {
              canvas.width = src.width; canvas.height = src.height
            }
            canvas.getContext('2d')?.drawImage(src, 0, 0)
          }
        }
      }
      previewRafRef.current = requestAnimationFrame(draw)
    }
    previewRafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(previewRafRef.current)
  }, [isOpen, layerId, sources, getOrCreateSource])

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop  = textareaRef.current.scrollTop
      preRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  const updateCode = useCallback((newCode: string) => {
    setCode(newCode)
    setError(null)
    if (layerId && isPlaying) {
      const timeout = setTimeout(() => {
        try { updateSketchCode(layerId, newCode) }
        catch (e) { setError((e as Error).message) }
      }, 400)
      return () => clearTimeout(timeout)
    }
  }, [layerId, isPlaying, updateSketchCode])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || e.key === 's')) {
      e.preventDefault()
      if (layerId) updateSketchCode(layerId, code)
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget as HTMLTextAreaElement
      const start = ta.selectionStart; const end = ta.selectionEnd
      const next = code.substring(0, start) + '  ' + code.substring(end)
      setCode(next)
      setTimeout(() => {
        if (textareaRef.current) textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2
      }, 0)
    }
  }

  const handleDuplicate = () => {
    if (!activeLayer) return
    addLayer({ ...activeLayer.sketch, id: `sketch-${Date.now()}`, name: `${activeLayer.name} Copy` })
    onClose()
  }

  const handleExport = () => {
    if (!activeLayer) return
    const blob = new Blob([JSON.stringify({ name: activeLayer.name, code, mode: activeLayer.sketch.mode, width: activeLayer.sketch.width, height: activeLayer.sketch.height }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${activeLayer.name.replace(/\s+/g, '_')}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true); setAiError(null)
    try {
      const key = aiKey.trim()
      if (!key) { setAiError('Enter your Anthropic API key'); return }
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
          max_tokens: 2048,
          system: P5_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: aiPrompt }],
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as any)?.error?.message ?? `HTTP ${res.status}`)
      }
      const data = await res.json()
      const generated: string = (data.content?.[0]?.text ?? '').trim()
      if (!generated) throw new Error('Empty response from API')
      setCode(generated)
      if (layerId) updateSketchCode(layerId, generated)
      setAiOpen(false); setAiPrompt('')
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setAiLoading(false)
    }
  }

  if (!isOpen || !activeLayer) return null

  const highlighted = highlightCode(code)
  const MONO = '"ui-monospace","JetBrains Mono",Consolas,monospace'

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-700 flex-shrink-0">
          <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <input type="text" value={activeLayer.name}
            onChange={(e) => layerId && updateSketchName(layerId, e.target.value)}
            className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-100 border border-gray-700 focus:border-orange-500 focus:outline-none w-40" />

          <div className="flex items-center gap-1.5 ml-1">
            {/* Play/Pause */}
            <button onClick={() => { layerId && toggleLayer(layerId); setIsPlaying(!isPlaying) }}
              className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 ${isPlaying ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'}`}>
              {isPlaying
                ? <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>Pause</>
                : <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>Play</>}
            </button>

            {/* Blend mode */}
            <select value={activeLayer.blendMode}
              onChange={(e) => layerId && setLayerBlendMode(layerId, e.target.value as any)}
              className="px-1.5 py-1 bg-gray-800 rounded text-xs border border-gray-700 text-gray-300">
              <option value="NORMAL">Normal</option>
              <option value="ADD">Add</option>
              <option value="SCREEN">Screen</option>
              <option value="MULTIPLY">Multiply</option>
            </select>

            {/* Opacity */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800 rounded border border-gray-700">
              <span className="text-[10px] text-gray-500">Opacity</span>
              <input type="range" min="0" max="1" step="0.01" value={activeLayer.opacity}
                onChange={(e) => layerId && setLayerOpacity(layerId, parseFloat(e.target.value))}
                className="w-16 h-1 bg-gray-700 rounded appearance-none" />
              <span className="text-[10px] text-gray-400 w-7 text-right">{Math.round(activeLayer.opacity * 100)}%</span>
            </div>
          </div>

          <div className="flex-1" />

          {/* Templates */}
          <div className="relative">
            <button onClick={() => setShowTemplates(!showTemplates)}
              className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 border border-gray-700">
              Templates
            </button>
            {showTemplates && (
              <div className="absolute top-full right-0 mt-1 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
                {templates.map(t => (
                  <button key={t.id} onClick={() => { loadTemplate(t.id); setShowTemplates(false) }}
                    className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg">
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Generate */}
          <button onClick={() => setAiOpen(!aiOpen)}
            className={`px-2.5 py-1 rounded text-xs border transition-colors flex items-center gap-1 ${aiOpen ? 'bg-pink-600/20 border-pink-500/50 text-pink-300' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI
          </button>

          {/* Run */}
          <button onClick={() => layerId && updateSketchCode(layerId, code)}
            className="px-3 py-1 bg-orange-600 hover:bg-orange-500 rounded text-xs text-white flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            Run
          </button>

          {/* Preview toggle */}
          <button onClick={() => setShowPreview(!showPreview)} title="Toggle preview"
            className={`p-1.5 rounded text-xs border transition-colors ${showPreview ? 'bg-[#d4f542]/20 border-[#d4f542]/40 text-[#d4f542]' : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300'}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          <div className="w-px h-5 bg-gray-700" />
          <button onClick={handleExport} className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-400 border border-gray-700">Export</button>
          <button onClick={handleDuplicate} className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-400 border border-gray-700">Dupe</button>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-200 ml-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── AI panel ── */}
        {aiOpen && (
          <div className="px-4 py-3 bg-gray-950 border-b border-gray-800 flex-shrink-0 space-y-2">
            <div className="flex items-center gap-2">
              <input type="password" placeholder="Anthropic API key" value={aiKey}
                onChange={(e) => setAiKey(e.target.value)}
                className="w-52 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 font-mono outline-none focus:border-pink-500" />
              <input type="text" placeholder="Describe your sketch (e.g. 'pulsing circles that react to bass')" value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 outline-none focus:border-pink-500" />
              <button onClick={handleAiGenerate} disabled={aiLoading}
                className="px-3 py-1 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 rounded text-xs text-white flex items-center gap-1.5">
                {aiLoading
                  ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                Generate
              </button>
            </div>
            {aiError && <p className="text-xs text-red-400">{aiError}</p>}
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex border-b border-gray-700 flex-shrink-0">
          {(['code', 'help'] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-xs border-b-2 transition-colors capitalize ${activeTab === t ? 'text-orange-400 border-orange-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>
              {t === 'code' ? 'Code Editor' : 'Reference & Help'}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* ── Code / Help panel ── */}
          <div className={`flex flex-col overflow-hidden min-h-0 ${showPreview ? 'flex-1' : 'w-full'}`}>
            {activeTab === 'code' ? (
              <div className="relative flex-1 overflow-hidden">
                {error && (
                  <div className="absolute top-0 left-0 right-0 z-10 p-2.5 bg-red-900/90 text-red-200 text-xs border-b border-red-700">
                    <strong>Error:</strong> {error}
                  </div>
                )}
                <pre ref={preRef}
                  className="absolute inset-0 m-0 p-4 bg-gray-950 text-xs font-mono leading-6 overflow-auto pointer-events-none"
                  dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
                  style={{ whiteSpace: 'pre', fontFamily: MONO }} />
                <textarea ref={textareaRef} value={code}
                  onChange={(e) => updateCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onScroll={handleScroll}
                  className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-white text-xs font-mono leading-6 resize-none focus:outline-none"
                  spellCheck={false} autoCapitalize="off" autoComplete="off" autoCorrect="off"
                  style={{ whiteSpace: 'pre', fontFamily: MONO }} />
              </div>
            ) : (
              <div className="flex-1 overflow-auto p-5 space-y-5">
                <section>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">OpenVJ Bridge API</h3>
                  <div className="bg-gray-800 rounded-lg p-3 space-y-1.5 text-xs">
                    {[
                      ['openvj.audio.getLow()', 'Bass frequencies (0-255) — 20-300Hz'],
                      ['openvj.audio.getMid()', 'Mid frequencies (0-255) — 300-4kHz'],
                      ['openvj.audio.getHigh()', 'High frequencies (0-255) — 4k-20kHz'],
                      ['openvj.audio.getBeat()', 'Beat trigger (0-1)'],
                      ['openvj.audio.getBpm()', 'Detected BPM'],
                      ['openvj.midi.getCC(n)', 'MIDI CC value (0-1), n = 0-127'],
                    ].map(([fn, desc]) => (
                      <div key={fn} className="flex gap-3">
                        <code className="text-pink-400 w-44 shrink-0">{fn}</code>
                        <span className="text-gray-400">{desc}</span>
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Quick Example</h3>
                  <pre className="bg-gray-950 rounded-lg p-3 text-xs font-mono text-green-300 overflow-x-auto">{`function setup() {
  createCanvas(512, 512);
  colorMode(HSB);
}

function draw() {
  const beat = openvj.audio.getBeat();
  background(0, 0, beat > 0.5 ? 30 : 5);

  const bass = openvj.audio.getLow() / 255;
  fill(beat * 360, 80, 100);
  noStroke();
  circle(width/2, height/2, 50 + bass * 200);
}`}</pre>
                </section>
                <section>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Tips</h3>
                  <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                    <li>Write standard p5.js global mode — <code className="text-purple-300">function setup()</code> + <code className="text-purple-300">function draw()</code></li>
                    <li>Press <kbd className="px-1 bg-gray-700 rounded">Ctrl+Enter</kbd> or <kbd className="px-1 bg-gray-700 rounded">Ctrl+S</kbd> to run</li>
                    <li>Use <code className="text-blue-300">ADD</code> blend mode for glowing neon effects</li>
                    <li>Keep particle counts under 500 for smooth 60fps</li>
                    <li>WEBGL mode for 3D — 2D is faster for flat visuals</li>
                  </ul>
                </section>
              </div>
            )}

            {/* Status bar */}
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-gray-700 bg-gray-800 text-[10px] text-gray-500 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span>Mode: {activeLayer.sketch.mode}</span>
                <span>{activeLayer.sketch.width}×{activeLayer.sketch.height}</span>
                <span>{code.split('\n').length} lines</span>
              </div>
              <span className={error ? 'text-red-400' : 'text-green-400/70'}>{error ? 'Error' : 'Ready'}</span>
            </div>
          </div>

          {/* ── Live preview panel ── */}
          {showPreview && (
            <div className="w-72 flex-shrink-0 border-l border-gray-800 bg-gray-950 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
                <span className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">Live Preview</span>
                {isPlaying
                  ? <span className="flex items-center gap-1 text-[10px] text-green-500/70"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />Running</span>
                  : <span className="text-[10px] text-gray-600">Paused</span>}
              </div>
              <div className="flex-1 flex items-center justify-center p-3 overflow-hidden">
                <canvas ref={previewRef}
                  className="max-w-full max-h-full rounded border border-gray-800 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <div className="px-3 py-2 border-t border-gray-800 space-y-1">
                <p className="text-[10px] text-gray-600">openvj.audio.getLow/Mid/High/Beat</p>
                <p className="text-[10px] text-gray-600">openvj.midi.getCC(n) for MIDI CC</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
