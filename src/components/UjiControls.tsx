import { useState, useCallback, useEffect, useRef } from 'react'
import { UjiParams, DEFAULT_UJI_PARAMS, UJI_PRESETS, UjiBlendMode, DEFAULT_AUDIO_MOD } from '../lib/ujiRenderer'
import { UJI_PRESETS_FROM_ORIGINAL } from '../lib/ujiPresets'
import { useAssetStore, Asset } from '../stores/assetStore'
import { assetTextureManager } from '../lib/assetTextureManager'

interface UjiControlsProps {
  asset: Asset
  disabled?: boolean
}

export function UjiControls({ asset, disabled }: UjiControlsProps) {
  const { updateAsset } = useAssetStore()
  const [localParams, setLocalParams] = useState<UjiParams>(asset.ujiParams ?? DEFAULT_UJI_PARAMS)
  const [activeTab, setActiveTab] = useState<'geometry' | 'rotation' | 'motion' | 'appearance' | 'animation'>('geometry')
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync with asset changes
  useEffect(() => {
    setLocalParams(asset.ujiParams ?? DEFAULT_UJI_PARAMS)
  }, [asset.ujiParams])

  const updateParams = useCallback((updates: Partial<UjiParams>) => {
    const newParams = { ...localParams, ...updates }
    setLocalParams(newParams)

    // Debounce the store update to avoid lag during live control
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    updateTimeoutRef.current = setTimeout(async () => {
      updateAsset(asset.id, { ujiParams: newParams })
      // Force texture refresh - reload for both animated and non-animated
      await assetTextureManager.reload({ ...asset, ujiParams: newParams })
    }, 50)
  }, [localParams, asset.id, updateAsset])

  const loadPreset = (presetName: string, isOriginal = false) => {
    const presets = isOriginal ? UJI_PRESETS_FROM_ORIGINAL : UJI_PRESETS
    const preset = presets[presetName]
    if (preset) {
      const merged = { ...DEFAULT_UJI_PARAMS, ...preset }
      setLocalParams(merged)
      updateAsset(asset.id, { ujiParams: merged })
      assetTextureManager.dispose(asset.id)
    }
  }

  const handleAudioModUpdate = (updates: Partial<typeof DEFAULT_AUDIO_MOD>) => {
    updateParams({
      audioMod: { ...localParams.audioMod, ...updates }
    })
  }

  const params = localParams

  // Find current preset name
  const findCurrentPreset = () => {
    for (const [name, preset] of Object.entries(UJI_PRESETS)) {
      if (JSON.stringify(preset) === JSON.stringify({ ...DEFAULT_UJI_PARAMS, ...preset })) {
        const currentRelevant = {
          shape: params.shape,
          segments: params.segments,
          rotationSpeed: params.rotationSpeed,
          expansionH: params.expansionH,
          expansionV: params.expansionV,
        }
        const presetRelevant = {
          shape: preset.shape,
          segments: preset.segments,
          rotationSpeed: preset.rotationSpeed,
          expansionH: preset.expansionH,
          expansionV: preset.expansionV,
        }
        if (JSON.stringify(currentRelevant) === JSON.stringify(presetRelevant)) {
          return name
        }
      }
    }
    return 'Custom'
  }

  // Tabs
  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'geometry', label: 'Geo' },
    { id: 'rotation', label: 'Rot' },
    { id: 'motion', label: 'Motion' },
    { id: 'appearance', label: 'Look' },
    { id: 'animation', label: 'Anim' },
  ]

  return (
    <div className="space-y-3 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[#d4f542] uppercase">Uji Generator</h3>
        <span className="text-[10px] text-gray-500">Live Control</span>
      </div>

      {/* Presets - Main */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-400 font-medium">Preset</span>
        <select
          value={findCurrentPreset()}
          onChange={(e) => loadPreset(e.target.value, false)}
          disabled={disabled}
          className="w-full px-2 py-1 text-[11px] bg-gray-800 border border-gray-700 rounded text-gray-300 focus:border-[#d4f542] focus:outline-none"
        >
          <option value="Custom">Custom</option>
          {Object.keys(UJI_PRESETS).map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Presets - Original */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-400 font-medium">Original Uji (39 presets)</span>
        <select
          onChange={(e) => e.target.value && loadPreset(e.target.value, true)}
          disabled={disabled}
          className="w-full px-2 py-1 text-[11px] bg-gray-800 border border-gray-700 rounded text-gray-300 focus:border-[#d4f542] focus:outline-none"
          value=""
        >
          <option value="">Select original preset...</option>
          {Object.keys(UJI_PRESETS_FROM_ORIGINAL).map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            disabled={disabled}
            className={`flex-1 py-1.5 text-[10px] font-medium transition-colors disabled:opacity-40 ${
              activeTab === tab.id
                ? 'text-[#d4f542] border-b-2 border-[#d4f542]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-3 min-h-[200px]">
        {activeTab === 'geometry' && (
          <>
            {/* Shape */}
            <ControlGroup label="Shape">
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 1, label: '○', name: 'Circle' },
                  { id: 2, label: '□', name: 'Square' },
                  { id: 3, label: '△', name: 'Triangle' },
                  { id: 4, label: '▬', name: 'Line' },
                ].map(({ id, label, name }) => (
                  <button
                    key={id}
                    onClick={() => updateParams({ shape: id as 1 | 2 | 3 | 4 })}
                    disabled={disabled}
                    title={name}
                    className={`py-1 text-sm rounded transition-colors disabled:opacity-40 ${
                      params.shape === id ? 'bg-[#d4f542] text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </ControlGroup>

            <Slider
              label="Segments"
              value={params.segments}
              min={10}
              max={20000}
              step={100}
              onChange={(v) => updateParams({ segments: v })}
              disabled={disabled}
            />
            <Slider
              label="Iterations"
              value={params.iterations}
              min={10}
              max={2000}
              step={10}
              onChange={(v) => updateParams({ iterations: v })}
              disabled={disabled}
            />
            <Slider
              label="Radius"
              value={params.radius}
              min={10}
              max={1500}
              step={5}
              onChange={(v) => updateParams({ radius: v })}
              disabled={disabled}
            />

            {/* Visibility */}
            <ControlGroup label="Visibility">
              <Slider
                label="Skip Chance"
                value={params.skipChance}
                min={0}
                max={1}
                step={0.01}
                format={(v) => `${(v * 100).toFixed(0)}%`}
                onChange={(v) => updateParams({ skipChance: v })}
                disabled={disabled}
              />
              <Slider
                label="Reveal Speed (-1=off)"
                value={params.revealSpeed ?? -1}
                min={-1}
                max={500}
                step={1}
                format={(v) => v < 0 ? 'Off' : v.toString()}
                onChange={(v) => updateParams({ revealSpeed: v })}
                disabled={disabled}
              />
            </ControlGroup>
          </>
        )}

        {activeTab === 'rotation' && (
          <>
            <Slider
              label="Speed"
              value={params.rotationSpeed}
              min={-10}
              max={10}
              step={0.05}
              onChange={(v) => updateParams({ rotationSpeed: v })}
              disabled={disabled}
            />
            <Slider
              label="Speedup %"
              value={params.rotationSpeedup}
              min={-5}
              max={5}
              step={0.001}
              format={(v) => `${v.toFixed(3)}%`}
              onChange={(v) => updateParams({ rotationSpeedup: v })}
              disabled={disabled}
            />
            <Slider
              label="Period (-1=off)"
              value={params.rotationPeriod}
              min={-1}
              max={1000}
              step={1}
              format={(v) => v < 0 ? 'Off' : v.toString()}
              onChange={(v) => updateParams({ rotationPeriod: v })}
              disabled={disabled}
            />
            <Slider
              label="Until (-1=off)"
              value={params.rotationUntil ?? -1}
              min={-1}
              max={2000}
              step={1}
              format={(v) => v < 0 ? 'Off' : v.toString()}
              onChange={(v) => updateParams({ rotationUntil: v })}
              disabled={disabled}
            />
            <Slider
              label="Initial Rotation"
              value={params.initialRotation ?? 0}
              min={0}
              max={359}
              step={1}
              format={(v) => `${v}°`}
              onChange={(v) => updateParams({ initialRotation: v })}
              disabled={disabled}
            />
            <Slider
              label="Segment Rotation"
              value={params.segmentRotation}
              min={0}
              max={179}
              step={1}
              format={(v) => `${v}°`}
              onChange={(v) => updateParams({ segmentRotation: v })}
              disabled={disabled}
            />

            <ControlGroup label="Origin">
              <Slider
                label="H Origin"
                value={params.rotationOriginH ?? 0.5}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => updateParams({ rotationOriginH: v })}
                disabled={disabled}
              />
              <Slider
                label="V Origin"
                value={params.rotationOriginV ?? 0.5}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => updateParams({ rotationOriginV: v })}
                disabled={disabled}
              />
            </ControlGroup>
          </>
        )}

        {activeTab === 'motion' && (
          <>
            <ControlGroup label="Expansion">
              <Slider
                label="H Expansion"
                value={params.expansionH}
                min={0.95}
                max={1.05}
                step={0.001}
                onChange={(v) => updateParams({ expansionH: v })}
                disabled={disabled}
              />
              <Slider
                label="V Expansion"
                value={params.expansionV}
                min={0.95}
                max={1.05}
                step={0.001}
                onChange={(v) => updateParams({ expansionV: v })}
                disabled={disabled}
              />
              <Slider
                label="H Exp Factor"
                value={params.expansionHExp ?? 0}
                min={-100}
                max={300}
                step={1}
                onChange={(v) => updateParams({ expansionHExp: v })}
                disabled={disabled}
              />
              <Slider
                label="V Exp Factor"
                value={params.expansionVExp ?? 0}
                min={-100}
                max={300}
                step={1}
                onChange={(v) => updateParams({ expansionVExp: v })}
                disabled={disabled}
              />
            </ControlGroup>

            <ControlGroup label="Translation">
              <Slider
                label="H Translate"
                value={params.translationH}
                min={-20}
                max={20}
                step={0.1}
                onChange={(v) => updateParams({ translationH: v })}
                disabled={disabled}
              />
              <Slider
                label="V Translate"
                value={params.translationV}
                min={-20}
                max={20}
                step={0.1}
                onChange={(v) => updateParams({ translationV: v })}
                disabled={disabled}
              />
            </ControlGroup>

            <ControlGroup label="Waviness">
              <Slider
                label="H Period (-1=off)"
                value={params.wavinessPH}
                min={-1}
                max={10000}
                step={1}
                format={(v) => v < 0 ? 'Off' : v.toString()}
                onChange={(v) => updateParams({ wavinessPH: v })}
                disabled={disabled}
              />
              <Slider
                label="H Amplitude"
                value={params.wavinessAH}
                min={0}
                max={20}
                step={0.1}
                onChange={(v) => updateParams({ wavinessAH: v })}
                disabled={disabled}
              />
              <Slider
                label="V Period (-1=off)"
                value={params.wavinessPV}
                min={-1}
                max={10000}
                step={1}
                format={(v) => v < 0 ? 'Off' : v.toString()}
                onChange={(v) => updateParams({ wavinessPV: v })}
                disabled={disabled}
              />
              <Slider
                label="V Amplitude"
                value={params.wavinessAV}
                min={0}
                max={20}
                step={0.1}
                onChange={(v) => updateParams({ wavinessAV: v })}
                disabled={disabled}
              />
            </ControlGroup>

            <Slider
              label="Jitter"
              value={params.jitter}
              min={0}
              max={20}
              step={0.1}
              onChange={(v) => updateParams({ jitter: v })}
              disabled={disabled}
            />
          </>
        )}

        {activeTab === 'appearance' && (
          <>
            <Slider
              label="Thickness"
              value={params.thickness}
              min={0.1}
              max={10}
              step={0.1}
              onChange={(v) => updateParams({ thickness: v })}
              disabled={disabled}
            />
            <Slider
              label="Opacity"
              value={params.lineOpacity}
              min={0.01}
              max={1}
              step={0.01}
              format={(v) => `${(v * 100).toFixed(0)}%`}
              onChange={(v) => updateParams({ lineOpacity: v })}
              disabled={disabled}
            />
            <Slider
              label="Hue Speed"
              value={params.hueshiftSpeed}
              min={-10}
              max={10}
              step={0.1}
              onChange={(v) => updateParams({ hueshiftSpeed: v })}
              disabled={disabled}
            />

            <ControlGroup label="Line Options">
              <Slider
                label="Lengthening %"
                value={params.segmentLengthening ?? 100}
                min={10}
                max={500}
                step={10}
                format={(v) => `${v}%`}
                onChange={(v) => updateParams({ segmentLengthening: v })}
                disabled={disabled}
              />
              <Slider
                label="Swappiness"
                value={params.lineSwappiness ?? 0}
                min={0}
                max={100}
                step={1}
                onChange={(v) => updateParams({ lineSwappiness: v })}
                disabled={disabled}
              />
            </ControlGroup>

            <ControlGroup label="Colors">
              <ColorPicker
                label="Line Color"
                r={params.lineR}
                g={params.lineG}
                b={params.lineB}
                onChange={(r, g, b) => updateParams({ lineR: r, lineG: g, lineB: b })}
                disabled={disabled}
              />
              <ColorPicker
                label="Background"
                r={params.bgR}
                g={params.bgG}
                b={params.bgB}
                onChange={(r, g, b) => updateParams({ bgR: r, bgG: g, bgB: b })}
                disabled={disabled}
              />
            </ControlGroup>

            <ControlGroup label="Effects">
              <Slider
                label="Background Opacity"
                value={params.bgOpacity ?? 1}
                min={0}
                max={1}
                step={0.01}
                format={(v) => `${(v * 100).toFixed(0)}%`}
                onChange={(v) => updateParams({ bgOpacity: v })}
                disabled={disabled}
              />
              <Slider
                label="Shadow Blur"
                value={params.shadowBlur ?? 0}
                min={-10}
                max={50}
                step={0.5}
                onChange={(v) => updateParams({ shadowBlur: v })}
                disabled={disabled}
              />
              <Slider
                label="Canvas Noise"
                value={params.canvasNoise ?? 0}
                min={0}
                max={1}
                step={0.01}
                format={(v) => `${(v * 100).toFixed(0)}%`}
                onChange={(v) => updateParams({ canvasNoise: v })}
                disabled={disabled}
              />
            </ControlGroup>

            <ControlGroup label="Blend Mode">
              <select
                value={params.blendMode || 'source-over'}
                onChange={(e) => updateParams({ blendMode: e.target.value as UjiBlendMode })}
                disabled={disabled}
                className="w-full px-2 py-1.5 text-[11px] bg-gray-800 border border-gray-700 rounded text-gray-300 focus:border-[#d4f542] focus:outline-none"
              >
                <option value="source-over">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="darken">Darken</option>
                <option value="lighten">Lighten</option>
                <option value="color-dodge">Color Dodge</option>
                <option value="color-burn">Color Burn</option>
                <option value="hard-light">Hard Light</option>
                <option value="soft-light">Soft Light</option>
                <option value="difference">Difference</option>
                <option value="exclusion">Exclusion</option>
                <option value="lighter">Lighter</option>
              </select>
            </ControlGroup>

            <ControlGroup label="Line Cap">
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'auto', label: 'Auto' },
                  { id: 'butt', label: 'Butt' },
                  { id: 'round', label: 'Round' },
                  { id: 'square', label: 'Square' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => updateParams({ lineCap: id as any })}
                    disabled={disabled}
                    className={`py-1 text-[10px] rounded transition-colors disabled:opacity-40 ${
                      params.lineCap === id ? 'bg-[#d4f542] text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </ControlGroup>

            <ControlGroup label="Fade">
              <Slider
                label="Fade In"
                value={params.fadeInSpeed ?? 0}
                min={0}
                max={200}
                step={1}
                onChange={(v) => updateParams({ fadeInSpeed: v })}
                disabled={disabled}
              />
              <Slider
                label="Fade Out (-1=off)"
                value={params.fadeOutSpeed ?? -1}
                min={-1}
                max={1000}
                step={1}
                format={(v) => v < 0 ? 'Off' : v.toString()}
                onChange={(v) => updateParams({ fadeOutSpeed: v })}
                disabled={disabled}
              />
              <Slider
                label="Fade Out Start"
                value={params.fadeOutStart ?? 0}
                min={0}
                max={1000}
                step={1}
                show={params.fadeOutSpeed !== undefined && params.fadeOutSpeed >= 0}
                onChange={(v) => updateParams({ fadeOutStart: v })}
                disabled={disabled}
              />
              <Slider
                label="Sawtooth Size (-1=off)"
                value={params.sawtoothFadeOutSize ?? -1}
                min={-1}
                max={5000}
                step={10}
                format={(v) => v < 0 ? 'Off' : v.toString()}
                onChange={(v) => updateParams({ sawtoothFadeOutSize: v })}
                disabled={disabled}
              />
              <Slider
                label="Sawtooth Start"
                value={params.sawtoothFadeOutStart ?? 0}
                min={0}
                max={1000}
                step={1}
                onChange={(v) => updateParams({ sawtoothFadeOutStart: v })}
                disabled={disabled}
              />
            </ControlGroup>
          </>
        )}

        {activeTab === 'animation' && (
          <>
            <div className="flex items-center justify-between py-2">
              <span className="text-[11px] text-gray-400 font-medium">Animate</span>
              <Toggle
                checked={params.animate}
                onChange={(v) => updateParams({ animate: v })}
                disabled={disabled}
              />
            </div>

            {params.animate && (
              <>
                <Slider
                  label="Speed (iters/frame)"
                  value={params.itersPerFrame}
                  min={1}
                  max={20}
                  step={1}
                  onChange={(v) => updateParams({ itersPerFrame: v })}
                  disabled={disabled}
                />

                <ControlGroup label="Loop Settings">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">Mode</span>
                      <select
                        value={params.loopMode ?? 'cycle'}
                        onChange={(e) => updateParams({ loopMode: e.target.value as any })}
                        disabled={disabled}
                        className="px-2 py-1 text-[10px] bg-gray-800 border border-gray-700 rounded text-gray-300 focus:border-[#d4f542] focus:outline-none"
                      >
                        <option value="cycle">Cycle (Reset+Clear)</option>
                        <option value="once">Once (Freeze)</option>
                        <option value="infinite">Infinite (⚠️ Fills Screen)</option>
                        <option value="pingpong">Ping-Pong</option>
                      </select>
                    </div>

                    <Slider
                      label="Loop Duration (-1=use iterations)"
                      value={params.loopDuration ?? -1}
                      min={-1}
                      max={2000}
                      step={10}
                      format={(v) => v < 0 ? 'Auto' : v.toString()}
                      onChange={(v) => updateParams({ loopDuration: v })}
                      disabled={disabled}
                    />

                    <div className="flex items-center justify-between py-1">
                      <span className="text-[10px] text-gray-400">Clear on Loop</span>
                      <Toggle
                        checked={params.clearOnLoop !== false}
                        onChange={(v) => updateParams({ clearOnLoop: v })}
                        disabled={disabled || params.loopMode === 'infinite'}
                      />
                    </div>
                  </div>
                </ControlGroup>

                <ControlGroup label="Audio Modulation">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[10px] text-gray-400">Clear on Beat</span>
                    <Toggle
                      checked={params.audioMod.clearOnBeat}
                      onChange={(v) => handleAudioModUpdate({ clearOnBeat: v })}
                      disabled={disabled}
                    />
                  </div>
                  <Slider
                    label="Rot by Low"
                    value={params.audioMod.rotByLow}
                    min={-4}
                    max={4}
                    step={0.1}
                    onChange={(v) => handleAudioModUpdate({ rotByLow: v })}
                    disabled={disabled}
                  />
                  <Slider
                    label="Rot by Beat"
                    value={params.audioMod.rotByBeat}
                    min={-6}
                    max={6}
                    step={0.1}
                    onChange={(v) => handleAudioModUpdate({ rotByBeat: v })}
                    disabled={disabled}
                  />
                  <Slider
                    label="Jitter by High"
                    value={params.audioMod.jitterByHigh}
                    min={0}
                    max={10}
                    step={0.5}
                    onChange={(v) => handleAudioModUpdate({ jitterByHigh: v })}
                    disabled={disabled}
                  />
                  <Slider
                    label="Jitter by Beat"
                    value={params.audioMod.jitterByBeat}
                    min={0}
                    max={10}
                    step={0.5}
                    onChange={(v) => handleAudioModUpdate({ jitterByBeat: v })}
                    disabled={disabled}
                  />
                  <Slider
                    label="Expansion by Low"
                    value={params.audioMod.expansionByLow}
                    min={-0.01}
                    max={0.01}
                    step={0.0005}
                    onChange={(v) => handleAudioModUpdate({ expansionByLow: v })}
                    disabled={disabled}
                  />
                  <Slider
                    label="Hue Shift by Mid"
                    value={params.audioMod.hueshiftByMid}
                    min={-12}
                    max={12}
                    step={0.5}
                    onChange={(v) => handleAudioModUpdate({ hueshiftByMid: v })}
                    disabled={disabled}
                  />
                </ControlGroup>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Subcomponents ─────────────────────────────────────────────────────────────

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 pt-2 border-t border-gray-800">
      <h4 className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{label}</h4>
      {children}
    </div>
  )
}

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  format?: (value: number) => string
  onChange: (value: number) => void
  disabled?: boolean
  show?: boolean
}

function Slider({ label, value, min, max, step = 1, format, onChange, disabled, show = true }: SliderProps) {
  if (!show) return null
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400">{label}</span>
        <span className="text-[10px] text-gray-500 font-mono w-16 text-right">
          {format ? format(value) : value.toFixed(typeof step === 'number' && step < 1 ? 2 : 0)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-40 accent-[#d4f542]"
      />
    </div>
  )
}

interface ColorPickerProps {
  label: string
  r: number
  g: number
  b: number
  onChange: (r: number, g: number, b: number) => void
  disabled?: boolean
}

function ColorPicker({ label, r, g, b, onChange, disabled }: ColorPickerProps) {
  const toHex = (v: number) => Math.round(v).toString(16).padStart(2, '0')
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`

  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => {
            const h = e.target.value
            onChange(
              parseInt(h.slice(1, 3), 16),
              parseInt(h.slice(3, 5), 16),
              parseInt(h.slice(5, 7), 16)
            )
          }}
          disabled={disabled}
          className="w-6 h-6 rounded cursor-pointer disabled:opacity-40 border-0 p-0"
        />
        <span className="text-[10px] text-gray-500 font-mono">
          {r},{g},{b}
        </span>
      </div>
    </div>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`w-9 h-5 rounded-full transition-colors relative disabled:opacity-40 ${
        checked ? 'bg-green-600' : 'bg-gray-700'
      }`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0.5'
      }`} />
    </button>
  )
}
