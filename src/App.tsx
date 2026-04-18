import { useState, useEffect, useCallback, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { SurfaceMesh } from './components/Surface'
import { SurfaceList } from './components/SurfaceList'
import { MediaBrowser, ShaderEditor } from './components/MediaBrowser'
import { HelpModal } from './components/HelpModal'
import { UjiGenerator } from './components/UjiGenerator'
import { GlobalPostProcess } from './components/GlobalPostProcess'
import { P5JsPanel } from './components/P5JsPanel'
import { useSurfaceStore } from './stores/surfaceStore'
import { useAssetStore, Asset, BUILTIN_ASSETS } from './stores/assetStore'
import { useSceneStore, type Scene } from './stores/sceneStore'
import { useOutputStore } from './stores/outputStore'
import { useP5JsStore } from './stores/p5jsStore'
import { assetTextureManager } from './lib/assetTextureManager'
import { audioEngine } from './lib/audioEngine'
import { midiEngine } from './lib/midiEngine'
import { exportProject, importProject } from './lib/projectIO'
import { transitionToScene } from './lib/sceneTransition'
import { useMidiStore, MIDI_TARGET_RANGE, MIDI_TARGET_LABELS, type MidiTarget } from './stores/midiStore'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

// ─── Three.js scene ───────────────────────────────────────────────────────────

function Scene({ presentMode = false }: { presentMode?: boolean }) {
  const { surfaces, isDraggingCorner } = useSurfaceStore()
  const isOutputMode = new URLSearchParams(window.location.search).get('mode') === 'output'
  const audioCh = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    if (!isOutputMode) {
      audioCh.current = new BroadcastChannel('openvj-audio')
    }
    return () => { audioCh.current?.close(); audioCh.current = null }
  }, [isOutputMode])

  useFrame(() => {
    assetTextureManager.tickAll()
    audioEngine.tick()
    audioCh.current?.postMessage({
      low: audioEngine.low, mid: audioEngine.mid,
      high: audioEngine.high, beat: audioEngine.beat, bpm: audioEngine.bpm,
    })
  })

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      {surfaces.map((s) => <SurfaceMesh key={s.id} surface={s} presentMode={presentMode} />)}
      {!presentMode && (
        <Grid
          args={[30, 30]}
          cellSize={1} cellThickness={0.4} cellColor="#1f2937"
          sectionSize={5} sectionThickness={0.8} sectionColor="#374151"
          fadeDistance={20} fadeStrength={1.5}
          infiniteGrid position={[0, 0, -0.01]}
        />
      )}
      <OrbitControls makeDefault enableDamping dampingFactor={0.06} enabled={!isDraggingCorner && !presentMode} />
      <GlobalPostProcess />
    </>
  )
}

// ─── Audio controls ───────────────────────────────────────────────────────────

function AudioControls() {
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [levels, setLevels] = useState({ low: 0, mid: 0, high: 0, beat: 0 })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sensitivity, setSensitivity] = useState(audioEngine.sensitivity)
  const [smoothing, setSmoothing] = useState(audioEngine.smoothing)
  const [beatThreshold, setBeatThreshold] = useState(audioEngine.beatThreshold)

  // Poll audioEngine at 20fps while active — stop when inactive
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      setLevels({ low: audioEngine.low, mid: audioEngine.mid, high: audioEngine.high, beat: audioEngine.beat })
    }, 50)
    return () => clearInterval(id)
  }, [active])

  const toggle = async () => {
    if (active) {
      audioEngine.stop()
      setActive(false)
      setError(null)
    } else {
      try {
        await audioEngine.startMic()
        setActive(true)
        setError(null)
      } catch {
        setError('Mic access denied')
      }
    }
  }

  const handleSensitivity = (v: number) => {
    setSensitivity(v)
    audioEngine.sensitivity = v
  }
  const handleSmoothing = (v: number) => {
    setSmoothing(v)
    audioEngine.setSmoothing(v)
  }
  const handleBeatThreshold = (v: number) => {
    setBeatThreshold(v)
    audioEngine.beatThreshold = v
  }

  return (
    <div className="flex items-center gap-2 border-l border-gray-700/60 pl-3 relative">
      {/* Mic toggle */}
      <button
        onClick={toggle}
        title={active ? 'Stop audio input' : 'Start microphone input'}
        className={`p-1.5 rounded transition-colors cursor-pointer ${
          active
            ? 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30'
            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M9 11V7a3 3 0 016 0v4a3 3 0 01-6 0z" />
        </svg>
      </button>

      {/* Level meters (only when active) */}
      {active && (
        <div className="flex items-end gap-0.5 h-5">
          {(
            [
              { v: levels.low,  label: 'L', color: '#ef4444' },
              { v: levels.mid,  label: 'M', color: '#f59e0b' },
              { v: levels.high, label: 'H', color: '#22c55e' },
            ] as const
          ).map(({ v, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <div
                className="w-2 rounded-sm transition-all duration-75"
                style={{ height: `${Math.max(2, v * 20)}px`, background: color }}
              />
            </div>
          ))}
          {/* Beat flash */}
          <div
            className="w-1.5 h-1.5 rounded-full ml-0.5 self-center transition-opacity duration-75"
            style={{ background: '#ffffff', opacity: levels.beat }}
          />
        </div>
      )}

      {/* Settings gear */}
      <button
        onClick={() => setSettingsOpen((o) => !o)}
        title="Audio settings"
        className={`p-1.5 rounded transition-colors cursor-pointer ${
          settingsOpen ? 'bg-gray-700 text-gray-200' : 'text-gray-600 hover:text-gray-300 hover:bg-gray-700'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}

      {/* Settings popover */}
      {settingsOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setSettingsOpen(false)} />
          <div className="absolute bottom-full right-0 mb-2 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Audio Settings</span>
              <button onClick={() => setSettingsOpen(false)} className="text-gray-600 hover:text-gray-300 cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {[
              {
                label: 'Sensitivity',
                value: sensitivity,
                min: 0.1, max: 4.0, step: 0.05,
                format: (v: number) => v.toFixed(1) + '×',
                onChange: handleSensitivity,
                hint: 'Scale all band values — raise for quiet mics',
              },
              {
                label: 'Smoothing',
                value: smoothing,
                min: 0.0, max: 0.99, step: 0.01,
                format: (v: number) => Math.round(v * 100) + '%',
                onChange: handleSmoothing,
                hint: 'Higher = stable, lower = fast & reactive',
              },
              {
                label: 'Beat threshold',
                value: beatThreshold,
                min: 0.05, max: 0.8, step: 0.01,
                format: (v: number) => v.toFixed(2),
                onChange: handleBeatThreshold,
                hint: 'Bass level needed to trigger a beat pulse',
              },
            ].map(({ label, value, min, max, step, format, onChange, hint }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">{label}</span>
                  <span className="text-xs font-mono text-orange-400">{format(value)}</span>
                </div>
                <input
                  type="range" min={min} max={max} step={step}
                  value={value}
                  onChange={(e) => onChange(parseFloat(e.target.value))}
                  className="w-full cursor-pointer"
                />
                <p className="text-xs text-gray-600">{hint}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Transport ────────────────────────────────────────────────────────────────

interface TransportState {
  playing: boolean
  currentTime: number
  duration: number
}

interface TransportProps {
  videoEl: HTMLVideoElement | null
  assetName: string | null
}

function Transport({ videoEl, assetName }: TransportProps) {
  const [state, setState]   = useState<TransportState>({ playing: false, currentTime: 0, duration: 0 })
  const [rate, setRate]     = useState(1)
  const [loop, setLoop]     = useState(true)
  const [muted, setMuted]   = useState(true)
  const [volume, setVolume] = useState(1)
  const [bpm, setBpm]       = useState<number | null>(null)
  const tapsRef = useRef<number[]>([])
  const [levels, setLevels] = useState({ low: 0, mid: 0, high: 0, beat: 0 })

  // ── Video event listeners ──
  useEffect(() => {
    if (!videoEl) { setState({ playing: false, currentTime: 0, duration: 0 }); return }
    const onTime  = () => setState((s) => ({ ...s, currentTime: videoEl.currentTime }))
    const onMeta  = () => setState((s) => ({ ...s, duration: isFinite(videoEl.duration) ? videoEl.duration : 0 }))
    const onPlay  = () => setState((s) => ({ ...s, playing: true }))
    const onPause = () => setState((s) => ({ ...s, playing: false }))
    videoEl.addEventListener('timeupdate', onTime)
    videoEl.addEventListener('loadedmetadata', onMeta)
    videoEl.addEventListener('durationchange', onMeta)
    videoEl.addEventListener('play', onPlay)
    videoEl.addEventListener('pause', onPause)
    videoEl.addEventListener('ended', onPause)
    setState({ playing: !videoEl.paused, currentTime: videoEl.currentTime, duration: videoEl.duration || 0 })
    return () => {
      videoEl.removeEventListener('timeupdate', onTime)
      videoEl.removeEventListener('loadedmetadata', onMeta)
      videoEl.removeEventListener('durationchange', onMeta)
      videoEl.removeEventListener('play', onPlay)
      videoEl.removeEventListener('pause', onPause)
      videoEl.removeEventListener('ended', onPause)
    }
  }, [videoEl])

  // ── Sync properties to videoEl ──
  useEffect(() => { if (videoEl) videoEl.playbackRate = rate },          [videoEl, rate])
  useEffect(() => { if (videoEl) videoEl.loop = loop },                  [videoEl, loop])
  useEffect(() => { if (!videoEl) return; videoEl.muted = muted; videoEl.volume = volume }, [videoEl, muted, volume])

  // ── Poll audio levels for waveform (40ms ≈ 25fps) ──
  useEffect(() => {
    const id = setInterval(() => {
      setLevels({ low: audioEngine.low, mid: audioEngine.mid, high: audioEngine.high, beat: audioEngine.beat })
    }, 40)
    return () => clearInterval(id)
  }, [])

  const toggle = useCallback(() => {
    if (!videoEl) return
    if (state.playing) videoEl.pause()
    else videoEl.play().catch(console.error)
  }, [videoEl, state.playing])

  const stop = useCallback(() => {
    if (!videoEl) return
    videoEl.pause()
    videoEl.currentTime = 0
  }, [videoEl])

  const seek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoEl) return
    const t = parseFloat(e.target.value)
    videoEl.currentTime = t
    setState((s) => ({ ...s, currentTime: t }))
  }, [videoEl])

  // ── BPM tap — average of last 8 inter-tap intervals ──
  const handleTap = useCallback(() => {
    const now = performance.now()
    tapsRef.current = tapsRef.current.filter((t) => now - t < 8000)
    tapsRef.current.push(now)
    const ts = tapsRef.current
    if (ts.length >= 2) {
      const intervals = ts.slice(1).map((t, i) => t - ts[i])
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const calculated = Math.round(60000 / avg)
      setBpm(calculated)
      audioEngine.bpm = calculated
    }
  }, [])

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0

  return (
    <div className="h-14 bg-gray-900 border-t border-gray-700/60 flex items-center px-3 gap-2 flex-shrink-0">

      {/* ── Playback ── */}
      <button onClick={stop} disabled={!videoEl} title="Stop"
        className="p-1.5 rounded text-gray-500 hover:text-gray-100 hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex-shrink-0">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <rect x="4" y="4" width="12" height="12" rx="1.5" />
        </svg>
      </button>

      <button onClick={toggle} disabled={!videoEl} title={state.playing ? 'Pause (Space)' : 'Play (Space)'}
        className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex-shrink-0 ${
          state.playing ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}>
        {state.playing ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* ── Time ── */}
      <span className="text-xs font-mono text-gray-400 w-9 text-right tabular-nums flex-shrink-0">
        {formatTime(state.currentTime)}
      </span>

      {/* ── Scrubber ── */}
      <div className="flex-1 min-w-0">
        <input type="range" min={0} max={state.duration || 1} step={0.05}
          value={state.currentTime} disabled={!videoEl} onChange={seek}
          className="w-full cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: videoEl ? `linear-gradient(to right, #22c55e ${progress}%, #374151 ${progress}%)` : '#374151' }}
        />
      </div>

      {/* ── Duration ── */}
      <span className="text-xs font-mono text-gray-600 tabular-nums flex-shrink-0">
        {videoEl ? formatTime(state.duration) : '—:——'}
      </span>

      {assetName && (
        <span className="hidden lg:block text-xs text-gray-700 truncate max-w-20 flex-shrink-0" title={assetName}>
          {assetName}
        </span>
      )}

      {/* ── Divider ── */}
      <div className="w-px h-5 bg-gray-800 flex-shrink-0 mx-0.5" />

      {/* ── Live audio waveform (L/M/H bars + beat dot) ── */}
      <div className="flex items-end gap-0.5 h-6 flex-shrink-0" title="Mic audio levels — Low / Mid / High / Beat">
        {([
          { v: levels.low,  color: '#ef4444' },
          { v: levels.mid,  color: '#f59e0b' },
          { v: levels.high, color: '#22c55e' },
        ] as const).map(({ v, color }, i) => (
          <div key={i} className="flex flex-col justify-end w-1.5 h-full">
            <div
              className="w-full rounded-sm transition-all duration-75"
              style={{ height: `${Math.max(3, v * 100)}%`, background: color, opacity: v < 0.015 ? 0.15 : 0.85 }}
            />
          </div>
        ))}
        <div
          className="w-1 h-1 rounded-full ml-0.5 self-center flex-shrink-0 transition-all duration-75"
          style={{ background: '#ffffff', opacity: Math.max(0.06, levels.beat * 0.9) }}
        />
      </div>

      {/* ── Divider ── */}
      <div className="w-px h-5 bg-gray-800 flex-shrink-0 mx-0.5" />

      {/* ── Playback rate ── */}
      <div className="flex items-center gap-0.5 flex-shrink-0" title="Playback rate">
        {([0.5, 1, 2, 4] as const).map((r) => (
          <button key={r} onClick={() => setRate(r)} disabled={!videoEl}
            className={`px-1.5 py-0.5 text-xs rounded font-mono transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              rate === r ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-200 hover:bg-gray-700'
            }`}
          >{r}×</button>
        ))}
      </div>

      {/* ── Loop toggle ── */}
      <button
        onClick={() => setLoop((l) => !l)} disabled={!videoEl}
        title={loop ? 'Loop on' : 'Loop off'}
        className={`p-1.5 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 ${
          loop ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-800' : 'text-gray-700 hover:text-gray-400 hover:bg-gray-800'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      {/* ── Mute / Volume ── */}
      <button
        onClick={() => setMuted((m) => !m)} disabled={!videoEl}
        title={muted ? 'Unmute video audio' : 'Mute video audio'}
        className={`p-1.5 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 ${
          muted ? 'text-gray-700 hover:text-gray-400 hover:bg-gray-800' : 'text-green-400 hover:text-green-300 hover:bg-gray-800'
        }`}
      >
        {muted ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072M12 6v12M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>

      {/* Volume slider — only when unmuted */}
      {!muted && videoEl && (
        <input
          type="range" min={0} max={1} step={0.05} value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-14 cursor-pointer flex-shrink-0"
          style={{ background: `linear-gradient(to right, #22c55e ${volume * 100}%, #374151 ${volume * 100}%)` }}
          title={`Volume: ${Math.round(volume * 100)}%`}
        />
      )}

      {/* ── Divider ── */}
      <div className="w-px h-5 bg-gray-800 flex-shrink-0 mx-0.5" />

      {/* ── BPM Tap Tempo ── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={handleTap}
          className="px-2 py-0.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded border border-gray-700 hover:border-gray-500 transition-all cursor-pointer font-mono active:scale-95 active:bg-gray-600"
          title="Tap to calculate BPM — keep tapping in rhythm"
        >
          TAP
        </button>
        <span className="text-xs font-mono tabular-nums text-gray-500 w-14">
          {bpm !== null ? `${bpm} BPM` : '— BPM'}
        </span>
        {bpm !== null && (
          <button
            onClick={() => { setBpm(null); tapsRef.current = []; audioEngine.bpm = 0 }}
            className="text-gray-700 hover:text-gray-400 transition-colors cursor-pointer"
            title="Reset BPM"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <MidiControls />
      <AudioControls />
    </div>
  )
}

// ─── MIDI controls ────────────────────────────────────────────────────────────

function MidiControls() {
  const [active, setActive]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [inputNames, setInputNames] = useState<string[]>([])

  const { bindings, learning, removeBinding, setLearning, noteBindings, learningNote, removeNoteBinding, setLearningNote, clearAll } = useMidiStore()
  const { activeSurfaceId, updateSurfaceProps } = useSurfaceStore()
  const { scenes } = useSceneStore()

  // Start / stop MIDI
  const toggle = async () => {
    if (active) {
      midiEngine.stop()
      setActive(false)
      setError(null)
      setInputNames([])
    } else {
      try {
        await midiEngine.start()
        setActive(true)
        setError(null)
        setInputNames(midiEngine.inputNames)
      } catch {
        setError('MIDI access denied')
      }
    }
  }

  // Bridge: CC → active surface prop
  useEffect(() => {
    if (!active) return
    const unsub = midiEngine.onCC((channel, cc, value) => {
      // Check if we're in learn mode first
      const { learning: lrn, addBinding: add } = useMidiStore.getState()
      if (lrn !== null) {
        add({ channel, cc, target: lrn })
        return
      }
      // Apply CC to active surface
      const surfaceId = useSurfaceStore.getState().activeSurfaceId
      if (!surfaceId) return
      const { bindings: bds } = useMidiStore.getState()
      const binding = bds.find((b) => b.channel === channel && b.cc === cc)
      if (!binding) return
      const [min, max] = MIDI_TARGET_RANGE[binding.target]
      const scaled = min + value * (max - min)
      useSurfaceStore.getState().updateSurfaceProps(surfaceId, {
        [binding.target]: binding.target === 'pixelate'
          ? (value < 0.02 ? 0 : Math.round(scaled))
          : scaled,
      })
    })
    return unsub
  }, [active])

  // Bridge: Note-On → scene recall
  useEffect(() => {
    if (!active) return
    const unsub = midiEngine.onNote((channel, note) => {
      const { learningNote: lrn, addNoteBinding: add } = useMidiStore.getState()
      if (lrn !== null) {
        add({ channel, note, sceneId: lrn })
        return
      }
      const { noteBindings: nbs } = useMidiStore.getState()
      const nb = nbs.find((b) => b.channel === channel && b.note === note)
      if (!nb) return
      const scene = useSceneStore.getState().scenes.find((s) => s.id === nb.sceneId)
      if (!scene) return
      const duration = 500 // default transition
      transitionToScene(scene.surfaces, duration)
      useSceneStore.getState().setActiveScene(scene.id)
    })
    return unsub
  }, [active])

  // Refresh input list when panel opens
  useEffect(() => {
    if (panelOpen && active) setInputNames(midiEngine.inputNames)
  }, [panelOpen, active])

  // Suppress unused-var lint for destructured values used via getState
  void updateSurfaceProps
  void activeSurfaceId
  void scenes

  const ALL_TARGETS = Object.keys(MIDI_TARGET_LABELS) as MidiTarget[]

  return (
    <div className="flex items-center gap-1.5 border-l border-gray-700/60 pl-3 relative">
      {/* MIDI toggle */}
      <button
        onClick={toggle}
        title={active ? 'Stop MIDI' : 'Start MIDI'}
        className={`p-1.5 rounded transition-colors cursor-pointer ${
          active
            ? 'bg-violet-600/20 text-violet-400 hover:bg-violet-600/30'
            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'
        }`}
      >
        {/* Piano keys icon */}
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="2" y="3" width="20" height="18" rx="1.5" strokeWidth={2} />
          <path strokeWidth={2} d="M7 3v10M12 3v10M17 3v10" />
          <rect x="4.5" y="3" width="3" height="7" rx="0.5" fill="currentColor" stroke="none" />
          <rect x="9.5" y="3" width="3" height="7" rx="0.5" fill="currentColor" stroke="none" />
          <rect x="14.5" y="3" width="3" height="7" rx="0.5" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {/* Active indicator dot */}
      {active && (
        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
      )}

      {/* Settings gear */}
      <button
        onClick={() => setPanelOpen((o) => !o)}
        title="MIDI bindings"
        className={`p-1.5 rounded transition-colors cursor-pointer ${
          panelOpen ? 'bg-gray-700 text-gray-200' : 'text-gray-600 hover:text-gray-300 hover:bg-gray-700'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {error && <span className="text-xs text-red-400 flex-shrink-0">{error}</span>}

      {/* Bindings panel */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setPanelOpen(false); setLearning(null) }} />
          <div className="absolute bottom-full right-0 mb-2 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">MIDI Bindings</span>
              <button onClick={() => { setPanelOpen(false); setLearning(null) }} className="text-gray-600 hover:text-gray-300 cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Input list */}
            {active && inputNames.length > 0 && (
              <div className="text-xs text-gray-600 truncate">
                {inputNames.join(' · ')}
              </div>
            )}
            {!active && (
              <p className="text-xs text-gray-600">Enable MIDI to use bindings</p>
            )}

            {/* Binding rows */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {ALL_TARGETS.map((target) => {
                const binding = bindings.find((b) => b.target === target)
                const isLearning = learning === target

                return (
                  <div key={target} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                    isLearning ? 'bg-violet-900/40 border border-violet-500/50' : 'hover:bg-gray-800/60'
                  }`}>
                    <span className="text-xs text-gray-400 w-20 flex-shrink-0">{MIDI_TARGET_LABELS[target]}</span>

                    {binding ? (
                      <span className="flex-1 text-xs font-mono text-violet-300">
                        ch{binding.channel + 1} CC{binding.cc}
                      </span>
                    ) : (
                      <span className="flex-1 text-xs text-gray-700">unbound</span>
                    )}

                    {/* Learn button */}
                    <button
                      onClick={() => setLearning(isLearning ? null : target)}
                      title={isLearning ? 'Cancel learn' : 'MIDI learn — move a knob'}
                      className={`px-1.5 py-0.5 text-xs rounded transition-colors cursor-pointer ${
                        isLearning
                          ? 'bg-violet-600 text-white animate-pulse'
                          : 'bg-gray-800 text-gray-500 hover:text-gray-200 hover:bg-gray-700'
                      }`}
                    >
                      {isLearning ? 'listening…' : 'learn'}
                    </button>

                    {/* Remove button */}
                    {binding && !isLearning && (
                      <button
                        onClick={() => removeBinding(target)}
                        className="p-0.5 text-gray-700 hover:text-red-400 cursor-pointer rounded transition-colors"
                        title="Remove binding"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Note → Scene bindings */}
            {scenes.length > 0 && (
              <div className="border-t border-gray-700/60 pt-2 space-y-1.5">
                <p className="text-xs text-gray-500 font-medium">Note → Scene recall</p>
                {scenes.map((scene) => {
                  const nb = noteBindings.find((b) => b.sceneId === scene.id)
                  const isLearning = learningNote === scene.id
                  return (
                    <div key={scene.id} className={`flex items-center gap-2 rounded-lg px-2 py-1 transition-colors ${
                      isLearning ? 'bg-violet-900/40 border border-violet-500/50' : 'hover:bg-gray-800/60'
                    }`}>
                      <span className="flex-1 text-xs text-gray-400 truncate">{scene.name}</span>
                      {nb ? (
                        <span className="text-xs font-mono text-violet-300 flex-shrink-0">
                          ch{nb.channel + 1} N{nb.note}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-700 flex-shrink-0">—</span>
                      )}
                      <button
                        onClick={() => setLearningNote(isLearning ? null : scene.id)}
                        className={`px-1.5 py-0.5 text-xs rounded transition-colors cursor-pointer flex-shrink-0 ${
                          isLearning ? 'bg-violet-600 text-white animate-pulse' : 'bg-gray-800 text-gray-500 hover:text-gray-200 hover:bg-gray-700'
                        }`}
                      >
                        {isLearning ? 'listening…' : 'learn'}
                      </button>
                      {nb && !isLearning && (
                        <button onClick={() => removeNoteBinding(scene.id)}
                          className="p-0.5 text-gray-700 hover:text-red-400 cursor-pointer rounded transition-colors">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Footer actions */}
            <div className="flex gap-2 pt-1 border-t border-gray-700/60">
              <button
                onClick={clearAll}
                className="text-xs text-gray-600 hover:text-red-400 transition-colors cursor-pointer"
              >
                Clear all
              </button>
              <button
                onClick={() => useMidiStore.getState().bindings.length === 0
                  ? useMidiStore.setState({ bindings: [
                      { channel: 0, cc: 1,  target: 'opacity'    },
                      { channel: 0, cc: 2,  target: 'brightness' },
                      { channel: 0, cc: 3,  target: 'contrast'   },
                      { channel: 0, cc: 4,  target: 'hue'        },
                      { channel: 0, cc: 5,  target: 'saturation' },
                      { channel: 0, cc: 6,  target: 'zoom'       },
                      { channel: 0, cc: 7,  target: 'warpAmp'    },
                      { channel: 0, cc: 8,  target: 'chromaAb'   },
                    ]})
                  : undefined
                }
                className="text-xs text-gray-600 hover:text-gray-300 transition-colors cursor-pointer ml-auto"
                title="Restore default 8-knob mapping"
              >
                Reset defaults
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Scenes panel ─────────────────────────────────────────────────────────────

interface ScenesPanelProps {
  collapsed: boolean
  onToggle: () => void
  onSaveScene: () => void
}

function ScenesPanel({ collapsed, onToggle, onSaveScene }: ScenesPanelProps) {
  const { scenes, activeSceneId, deleteScene, setActiveScene } = useSceneStore()
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState('')
  const [transMs, setTransMs] = useState(500)

  const DURATIONS: { label: string; ms: number }[] = [
    { label: 'Cut', ms: 0 },
    { label: '0.5s', ms: 500 },
    { label: '1s', ms: 1000 },
    { label: '2s', ms: 2000 },
  ]

  const loadScene = (scene: Scene) => {
    transitionToScene(scene.surfaces, transMs)
    setActiveScene(scene.id)
  }

  const startRename = (scene: Scene) => {
    setRenaming(scene.id)
    setRenameVal(scene.name)
  }

  const commitRename = () => {
    if (renaming) {
      useSceneStore.getState().renameScene(renaming, renameVal)
      setRenaming(null)
    }
  }

  return (
    <div className="flex flex-col overflow-hidden flex-shrink-0">
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:bg-gray-800/60 transition-colors cursor-pointer flex-shrink-0"
      >
        <span>Scenes</span>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-600 normal-case font-normal">{scenes.length}</span>
          <svg className={`w-3 h-3 text-gray-600 transition-transform ${collapsed ? '-rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {!collapsed && (
        <div className="overflow-y-auto flex-1 min-h-0 pb-1 max-h-44">
          {/* Save + transition controls */}
          <div className="flex items-center border-b border-gray-700/40">
            <button
              onClick={onSaveScene}
              className="flex-1 flex items-center gap-2 px-3 py-1.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Save scene
            </button>
            {/* Transition duration */}
            <div className="flex items-center gap-0.5 pr-2 flex-shrink-0">
              {DURATIONS.map(({ label, ms }) => (
                <button
                  key={label}
                  onClick={() => setTransMs(ms)}
                  className={`px-1.5 py-0.5 text-xs rounded transition-colors cursor-pointer ${
                    transMs === ms
                      ? 'bg-gray-600 text-gray-100'
                      : 'text-gray-600 hover:text-gray-300 hover:bg-gray-700/60'
                  }`}
                  title={`Transition: ${label}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {scenes.length === 0 && (
            <p className="px-3 py-3 text-xs text-gray-700 text-center">No saved scenes</p>
          )}

          {scenes.map((scene) => (
            <div
              key={scene.id}
              className={`group flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-gray-800/60 transition-colors ${
                activeSceneId === scene.id ? 'bg-blue-900/20 border-l-2 border-blue-500' : 'border-l-2 border-transparent'
              }`}
              onClick={() => loadScene(scene)}
            >
              {/* Thumbnail */}
              <div className="w-10 h-6 flex-shrink-0 bg-gray-800 rounded overflow-hidden">
                {scene.thumbnail ? (
                  <img src={scene.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Name */}
              {renaming === scene.id ? (
                <input
                  autoFocus
                  value={renameVal}
                  onChange={(e) => setRenameVal(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(null) }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-w-0 bg-gray-700 text-gray-100 text-xs rounded px-1 py-0.5 outline-none"
                />
              ) : (
                <span className="flex-1 min-w-0 text-xs text-gray-300 truncate">{scene.name}</span>
              )}

              {/* Actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); startRename(scene) }}
                  title="Rename"
                  className="p-0.5 rounded hover:bg-gray-700 text-gray-600 hover:text-gray-300 cursor-pointer"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteScene(scene.id) }}
                  title="Delete scene"
                  className="p-0.5 rounded hover:bg-red-900/40 text-gray-600 hover:text-red-400 cursor-pointer"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Global Output FX Panel ───────────────────────────────────────────────────

function OutputSlider({ label, value, min, max, step, displayValue, onChange }: {
  label: string; value: number; min: number; max: number; step: number
  displayValue: string; onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-mono text-teal-300 tabular-nums w-12 text-right">{displayValue}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full cursor-pointer"
        style={{ background: `linear-gradient(to right, #14b8a6 ${pct}%, #374151 ${pct}%)` }}
      />
    </div>
  )
}

interface GlobalOutputPanelProps {
  collapsed: boolean
  onToggle: () => void
}

function GlobalOutputPanel({ collapsed, onToggle }: GlobalOutputPanelProps) {
  const { brightness, contrast, saturation, hue, vignette, updateOutputProps, resetOutput } = useOutputStore()
  const isModified = brightness !== 0 || contrast !== 0 || saturation !== 1 || hue !== 0 || vignette !== 0

  return (
    <div className="border-t border-gray-700/60 flex-shrink-0">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:bg-gray-800/60 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          Global Output
          {isModified && <span className="w-1.5 h-1.5 bg-teal-400 rounded-full" />}
        </span>
        <div className="flex items-center gap-1.5">
          {isModified && (
            <button
              onClick={(e) => { e.stopPropagation(); resetOutput() }}
              className="text-gray-600 hover:text-teal-400 transition-colors cursor-pointer px-1 text-[10px] uppercase"
              title="Reset all output FX"
            >
              reset
            </button>
          )}
          <svg className={`w-3 h-3 text-gray-600 transition-transform ${collapsed ? '-rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {!collapsed && (
        <div className="px-3 pb-3 space-y-3">
          <OutputSlider label="Brightness" value={brightness} min={-1} max={1} step={0.01}
            displayValue={brightness === 0 ? '0' : (brightness > 0 ? `+${brightness.toFixed(2)}` : brightness.toFixed(2))}
            onChange={(v) => updateOutputProps({ brightness: v })} />
          <OutputSlider label="Contrast" value={contrast} min={-1} max={1} step={0.01}
            displayValue={contrast === 0 ? '0' : (contrast > 0 ? `+${contrast.toFixed(2)}` : contrast.toFixed(2))}
            onChange={(v) => updateOutputProps({ contrast: v })} />
          <OutputSlider label="Saturation" value={saturation} min={0} max={2} step={0.01}
            displayValue={saturation.toFixed(2)}
            onChange={(v) => updateOutputProps({ saturation: v })} />
          <OutputSlider label="Hue Shift" value={hue} min={-180} max={180} step={1}
            displayValue={hue === 0 ? '0°' : `${hue > 0 ? '+' : ''}${hue}°`}
            onChange={(v) => updateOutputProps({ hue: v })} />
          <OutputSlider label="Vignette" value={vignette} min={0} max={1} step={0.01}
            displayValue={vignette === 0 ? 'Off' : vignette.toFixed(2)}
            onChange={(v) => updateOutputProps({ vignette: v })} />
        </div>
      )}
    </div>
  )
}

// ─── Snap grid control ────────────────────────────────────────────────────────

function SnapControls() {
  const { snapGrid, setSnapGrid } = useSurfaceStore()
  const SNAPS = [0, 0.25, 0.5, 1] as const

  return (
    <div className="absolute top-3 left-3 flex items-center gap-1 z-10">
      <div className="flex items-center bg-gray-900/70 backdrop-blur-sm border border-gray-700/50 rounded-lg overflow-hidden">
        <span className="text-xs text-gray-600 px-2 select-none">Snap</span>
        {SNAPS.map((s) => (
          <button
            key={s}
            onClick={() => setSnapGrid(s)}
            className={`px-2 py-1 text-xs transition-colors cursor-pointer ${
              snapGrid === s
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:text-gray-200 hover:bg-gray-700/60'
            }`}
            title={s === 0 ? 'No snapping' : `Snap to ${s} world units`}
          >
            {s === 0 ? 'Off' : s}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Output window ────────────────────────────────────────────────────────────
// Rendered when ?mode=output — clean canvas with no UI chrome.
// ═══ p5.js Status Component ═══════════════════════════════════════════════════

function P5JsStatus() {
  const { layers } = useP5JsStore()
  const activeLayers = layers.filter(l => l.isPlaying)
  
  if (layers.length === 0) return null
  
  return (
    <div className="px-3 py-1 border-t border-gray-700/60 flex items-center justify-between text-xs text-gray-700">
      <span className="flex items-center gap-1.5">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        p5.js
      </span>
      <span>
        <span className="text-green-500">{activeLayers.length}</span>
        <span className="text-gray-600">/{layers.length} active</span>
      </span>
    </div>
  )
}

// ═══ Output-only window (projector / secondary display) ════════════════════════

function OutputWindow() {
  // Sync surfaces + assets from main window via storage events
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      try {
        if (e.key === 'openvj-surfaces' && e.newValue) {
          const { state } = JSON.parse(e.newValue)
          if (state?.surfaces) useSurfaceStore.setState({ surfaces: state.surfaces })
        }
        if (e.key === 'openvj-assets' && e.newValue) {
          const { state } = JSON.parse(e.newValue)
          if (state?.assets) useAssetStore.setState({ assets: state.assets })
        }
        if (e.key === 'openvj-output' && e.newValue) {
          const { state } = JSON.parse(e.newValue)
          if (state) useOutputStore.setState({
            brightness: state.brightness ?? 0,
            contrast:   state.contrast   ?? 0,
            saturation: state.saturation ?? 1,
            hue:        state.hue        ?? 0,
            vignette:   state.vignette   ?? 0,
          })
        }
      } catch { /* ignore malformed */ }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Receive audio data from main window via BroadcastChannel
  useEffect(() => {
    const ch = new BroadcastChannel('openvj-audio')
    ch.onmessage = (e) => {
      audioEngine.low  = e.data.low
      audioEngine.mid  = e.data.mid
      audioEngine.high = e.data.high
      audioEngine.beat = e.data.beat
      audioEngine.bpm  = e.data.bpm
    }
    return () => ch.close()
  }, [])

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        style={{ background: '#000000', width: '100%', height: '100%' }}
        gl={{ preserveDrawingBuffer: false }}
      >
        <Scene presentMode />
      </Canvas>
    </div>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  // All hooks must be called unconditionally before any early returns
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mediaOpen, setMediaOpen] = useState(true)
  const [surfaceOpen, setSurfaceOpen] = useState(true)
  const [sceneOpen, setSceneOpen] = useState(true)
  const [globalFxOpen, setGlobalFxOpen] = useState(false)
  const [editingShader, setEditingShader] = useState<Asset | null>(null)
  const [editingUji, setEditingUji] = useState<Asset | null>(null)
  const [creatingUji, setCreatingUji] = useState(false)
  const [p5jsOpen, setP5jsOpen] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [presenting, setPresenting] = useState(false)
  const [hudVisible, setHudVisible] = useState(false)
  const [hintDismissed, setHintDismissed] = useState(false)
  const [recording, setRecording] = useState(false)
  const canvasContainerRef = useRef<HTMLElement>(null)
  const hudTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recChunksRef = useRef<Blob[]>([])

  const { surfaces, activeSurfaceId, setActiveSurface, undo, redo } = useSurfaceStore()
  const { assets } = useAssetStore()
  const activeSurface = surfaces.find((s) => s.id === activeSurfaceId)

  // Derive the active surface's video element (for transport control)
  const allAssets = [...assets, ...BUILTIN_ASSETS]
  const activeAsset = allAssets.find((a) => a.id === activeSurface?.assetId)
  const activeVideoEl =
    activeAsset?.type === 'video' || activeAsset?.type === 'webcam' || activeAsset?.type === 'screencapture'
      ? assetTextureManager.getMediaEl(activeAsset.id)
      : null

  // ── Canvas recording ──
  const toggleRecord = useCallback(() => {
    if (recording) {
      recorderRef.current?.stop()
      setRecording(false)
    } else {
      const canvas = glCanvasRef.current
      if (!canvas) return
      const stream = (canvas as HTMLCanvasElement & { captureStream(fps: number): MediaStream }).captureStream(30)
      const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
        ? 'video/webm; codecs=vp9'
        : 'video/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      recChunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recChunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(recChunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `openvj-rec-${Date.now()}.webm`
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 5000)
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
    }
  }, [recording])

  // ── Scene save ──
  const saveCurrentScene = useCallback(() => {
    const num = useSceneStore.getState().scenes.length + 1
    const name = `Scene ${num}`
    const canvas = glCanvasRef.current
    const thumbnail = canvas ? canvas.toDataURL('image/png', 0.4) : null
    useSceneStore.getState().saveScene(name, surfaces, thumbnail)
  }, [surfaces])

  // ── Project export / import ──
  const { addAsset } = useAssetStore()
  const { scenes } = useSceneStore()

  const handleExport = useCallback(() => {
    exportProject(surfaces, scenes, assets)
  }, [surfaces, scenes, assets])

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const result = await importProject(file)
    if (!result.ok) { alert(result.error); return }
    const { data } = result
    // Restore assets (shader + uji) — skip if id already exists
    const existingIds = new Set(useAssetStore.getState().assets.map((a) => a.id))
    data.assets.forEach((a) => { if (!existingIds.has(a.id)) addAsset(a) })
    // Restore scenes
    useSceneStore.setState({ scenes: data.scenes, activeSceneId: null })
    // Restore surfaces (via importConfig which pushes history)
    useSurfaceStore.getState().importConfig(data.surfaces)
  }, [addAsset])

  // ── HUD helpers ──
  const showHud = useCallback(() => {
    setHudVisible(true)
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current)
    hudTimerRef.current = setTimeout(() => setHudVisible(false), 3000)
  }, [])

  // Track browser fullscreen state (ESC key is handled by the browser natively)
  useEffect(() => {
    const onChange = () => {
      const isFs = !!document.fullscreenElement
      setPresenting(isFs)
      useSurfaceStore.getState().setIsPresenting(isFs)
      if (isFs) { showHud(); useSurfaceStore.getState().setActiveSurface(null) }
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [showHud])

  const togglePresentation = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      canvasContainerRef.current?.requestFullscreen().catch(console.error)
    }
  }, [])

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Space') {
        e.preventDefault()
        if (!activeVideoEl) return
        if (activeVideoEl.paused) activeVideoEl.play().catch(console.error)
        else activeVideoEl.pause()
      }
      if (e.code === 'Escape') {
        // Escape deselects surface only when not in fullscreen (fullscreen ESC is handled by browser)
        if (!document.fullscreenElement) setActiveSurface(null)
      }
      if (e.code === 'KeyF') {
        e.preventDefault()
        togglePresentation()
      }
      // Undo/Redo
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeVideoEl, setActiveSurface, togglePresentation, undo, redo])

  // ── App-level drag-and-drop ──
  const handleAppDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) }
  const handleAppDragLeave = (e: React.DragEvent) => {
    if (!(e.currentTarget as Element).contains(e.relatedTarget as Node)) setIsDragOver(false)
  }
  const handleAppDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    // Let MediaBrowser handle the actual file processing via its own drop handler
    // This overlay just shows the visual feedback
  }

  // Output window mode — render nothing but the canvas (checked after all hooks)
  const isOutputMode = new URLSearchParams(window.location.search).get('mode') === 'output'
  if (isOutputMode) return <OutputWindow />

  return (
    <div
      className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden"
      onDragOver={handleAppDragOver}
      onDragLeave={handleAppDragLeave}
      onDrop={handleAppDrop}
    >
      {/* Global drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-blue-950/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-semibold text-blue-200">Drop to add asset</p>
            <p className="text-sm text-blue-400/70 mt-1">Video · Image · GIF</p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="h-11 bg-gray-900 border-b border-gray-700/60 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-600 rounded-md flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
          <span className="font-semibold text-sm text-gray-100">OpenVJ</span>
          <span className="text-xs text-gray-600 px-1.5 py-0.5 bg-gray-800 rounded font-mono">v0.5.0</span>

          {activeSurface && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
              {activeSurface.name}
              {activeAsset && (
                <span className="text-blue-600">· {activeAsset.name}</span>
              )}
              <button onClick={() => setActiveSurface(null)} className="ml-0.5 hover:text-blue-200 cursor-pointer" title="Deselect (Esc)">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-700 mr-2">
            <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-600 font-mono">Space</kbd>
            <span>play</span>
            <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-600 font-mono">Esc</kbd>
            <span>deselect</span>
            <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-600 font-mono">⌘Z</kbd>
            <span>undo</span>
            <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-600 font-mono">F</kbd>
            <span>fullscreen</span>
          </div>

          {/* Output window button */}
          <button
            onClick={() => window.open(
              `${window.location.href.split('?')[0]}?mode=output`,
              'openvj-output',
              'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no'
            )}
            title="Open output window — move to projector display"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Output
          </button>

          {/* Record button */}
          <button
            onClick={toggleRecord}
            title={recording ? 'Stop recording and download WebM' : 'Record canvas to WebM'}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
              recording
                ? 'bg-red-600/20 border-red-500/50 text-red-300 hover:bg-red-600/30'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500'
            }`}
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${recording ? 'bg-red-400 animate-pulse' : 'bg-gray-600'}`} />
            {recording ? 'Stop' : 'Rec'}
          </button>

          {/* Present button */}
          <button
            onClick={togglePresentation}
            title={presenting ? 'Exit fullscreen (Esc or F)' : 'Enter fullscreen presentation (F)'}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
              presenting
                ? 'bg-violet-600/20 border-violet-500/50 text-violet-300 hover:bg-violet-600/30'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500'
            }`}
          >
            {presenting ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
            {presenting ? 'Exit' : 'Present'}
            {presenting && <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />}
          </button>

          {/* Export / Import */}
          <button onClick={handleExport} title="Export project (.json)"
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <label title="Import project (.json)" className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>

          <button onClick={() => setHelpOpen(true)} title="Help"
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button onClick={() => setSidebarOpen((o) => !o)} title="Toggle sidebar"
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={sidebarOpen ? 'M11 19l-7-7 7-7m8 14l-7-7 7-7' : 'M13 5l7 7-7 7M5 5l7 7-7 7'} />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── Sidebar ── */}
        {sidebarOpen && (
          <aside className="w-72 bg-gray-900 border-r border-gray-700/60 flex flex-col flex-shrink-0 overflow-hidden">

            {/* Media browser — collapsible */}
            <div className={`border-b border-gray-700 flex flex-col relative overflow-hidden flex-shrink-0 ${mediaOpen ? 'flex-1 min-h-0' : ''}`}>
              <MediaBrowser
                onEditShader={setEditingShader}
                onNewUji={() => { setEditingUji(null); setCreatingUji(true) }}
                onEditUji={(a) => { setEditingUji(a); setCreatingUji(false) }}
                collapsed={!mediaOpen}
                onToggle={() => setMediaOpen((o) => !o)}
              />
            </div>

            {/* Surfaces + inspector — collapsible */}
            <div className={`flex flex-col overflow-hidden flex-shrink-0 ${surfaceOpen ? 'flex-1 min-h-0' : ''}`}>
              <SurfaceList
                collapsed={!surfaceOpen}
                onToggle={() => setSurfaceOpen((o) => !o)}
              />
            </div>

            {/* Scenes panel — collapsible */}
            <div className="border-t border-gray-700/60 flex-shrink-0">
              <ScenesPanel
                collapsed={!sceneOpen}
                onToggle={() => setSceneOpen((o) => !o)}
                onSaveScene={saveCurrentScene}
              />
            </div>

            {/* Global Output FX */}
            <GlobalOutputPanel
              collapsed={!globalFxOpen}
              onToggle={() => setGlobalFxOpen((o) => !o)}
            />

            {/* p5.js Creative Coding */}
            <P5JsPanel
              collapsed={!p5jsOpen}
              onToggle={() => setP5jsOpen((o) => !o)}
            />

            {/* Status bar */}
            <div className="px-3 py-1.5 border-t border-gray-700/60 flex items-center justify-between text-xs text-gray-700 flex-shrink-0">
              <span>{surfaces.length} surface{surfaces.length !== 1 ? 's' : ''}</span>
              <span>{assets.length} asset{assets.length !== 1 ? 's' : ''}</span>
            </div>
            
            {/* p5.js Status */}
            <P5JsStatus />
          </aside>
        )}

        {/* ── Canvas ── */}
        <main
          ref={canvasContainerRef}
          className="flex-1 relative overflow-hidden"
          onClick={(e) => { if (e.target === e.currentTarget) setActiveSurface(null) }}
          onMouseMove={() => { if (presenting) showHud() }}
        >
          <Canvas
            camera={{ position: [0, 0, 8], fov: 50 }}
            style={{ background: '#0d1117' }}
            gl={{ preserveDrawingBuffer: true }}
            onCreated={({ gl }) => { glCanvasRef.current = gl.domElement }}
          >
            <Scene presentMode={presenting} />
          </Canvas>

          {/* ── Hint overlay (dismissible, hides when not needed) ── */}
          {!hintDismissed && !presenting && (
            <div className="absolute bottom-4 left-4 bg-gray-900/70 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-600 border border-gray-700/40 group">
              <button
                onClick={() => setHintDismissed(true)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Dismiss"
              >
                <svg className="w-2.5 h-2.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="space-y-0.5 pointer-events-none">
                <div><span className="text-blue-400/80">Click surface</span> to select</div>
                <div><span className="text-red-400/80">Drag handles</span> to warp</div>
                <div><span className="text-gray-500/80">Scroll</span> to zoom · <span className="text-violet-400/80">F</span> to present</div>
              </div>
            </div>
          )}

          {/* ── Snap grid toggle (top-left, only when not presenting) ── */}
          {!presenting && <SnapControls />}

          {/* ── Video live badge ── */}
          {activeVideoEl && !activeVideoEl.paused && !presenting && (
            <div className="absolute top-3 right-3 bg-green-900/70 backdrop-blur-sm rounded px-2 py-1 text-xs text-green-400 border border-green-700/50 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Live
            </div>
          )}

          {/* ── Fullscreen presentation HUD ── */}
          {presenting && (
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${hudVisible ? 'opacity-100' : 'opacity-0'}`}
            >
              {/* Top-left: branding */}
              <div className="absolute top-5 left-5 flex items-center gap-2.5">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-violet-600 rounded flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" />
                  </svg>
                </div>
                <span className="text-xs text-white/40 font-mono">OpenVJ</span>
                {activeSurface && (
                  <span className="text-xs text-white/30 font-mono">· {activeSurface.name}</span>
                )}
              </div>

              {/* Bottom-right: exit hint + pointer-events for exit button */}
              <div className="absolute bottom-5 right-5 flex items-center gap-2 pointer-events-auto">
                {activeVideoEl && !activeVideoEl.paused && (
                  <div className="flex items-center gap-1 mr-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-green-400/60 font-mono">live</span>
                  </div>
                )}
                <span className="text-xs text-white/30 font-mono">
                  ESC or F to exit
                </span>
                <button
                  onClick={togglePresentation}
                  className="ml-1 px-2.5 py-1 text-xs bg-white/10 hover:bg-white/20 text-white/50 hover:text-white/80 rounded-lg border border-white/10 transition-colors cursor-pointer"
                >
                  Exit
                </button>
              </div>

              {/* Scene info - top right */}
              <div className="absolute top-5 right-5">
                <span className="text-xs text-white/20 font-mono">
                  {surfaces.length} surf · {assets.length} asset
                </span>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Transport ── */}
      <Transport videoEl={activeVideoEl} assetName={activeVideoEl ? (activeAsset?.name ?? null) : null} />

      {/* ── Help modal ── */}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}

      {/* ── Shader editor modal ── */}
      {editingShader && (
        <ShaderEditor
          asset={editingShader}
          onClose={() => setEditingShader(null)}
        />
      )}

      {/* ── Uji generator modal ── */}
      {(creatingUji || editingUji) && (
        <UjiGenerator
          asset={editingUji}
          onClose={() => { setCreatingUji(false); setEditingUji(null) }}
        />
      )}
    </div>
  )
}
