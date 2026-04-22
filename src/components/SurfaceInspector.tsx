import { useState, useCallback, useMemo } from 'react'
import { useSurfaceStore, Surface, MaskShape } from '../stores/surfaceStore'
import { useAssetStore } from '../stores/assetStore'
import { CornerNudge } from './SurfaceList'
import { UjiControls } from './UjiControls'

interface SurfaceInspectorProps {
  surface: Surface
  onEditShader: () => void
  onClose: () => void
}

export function SurfaceInspector({ surface, onEditShader, onClose }: SurfaceInspectorProps) {
  const { updateSurfaceProps, resetSurface } = useSurfaceStore()
  const { assets } = useAssetStore()
  const [activeTab, setActiveTab] = useState<'color' | 'transform' | 'fx' | 'mask' | 'corners'>('color')

  // Get the asset associated with this surface (if any)
  const asset = useMemo(() => 
    surface.assetId ? assets.find(a => a.id === surface.assetId) : null,
    [surface.assetId, assets]
  )
  const isUjiAsset = asset?.type === 'uji'

  const update = useCallback(
    (props: Parameters<typeof updateSurfaceProps>[1]) => updateSurfaceProps(surface.id, props),
    [surface.id, updateSurfaceProps]
  )

  const hue = surface.hue ?? 0
  const saturation = surface.saturation ?? 1
  const invert = surface.invert ?? false
  const flipH = surface.flipH ?? false
  const flipV = surface.flipV ?? false
  const rotation = surface.rotation ?? 0
  const zoom = surface.zoom ?? 1
  const warpAmp = surface.warpAmp ?? 0
  const warpFreq = surface.warpFreq ?? 5
  const chromaAb = surface.chromaAb ?? 0
  const pixelate = surface.pixelate ?? 0
  const vignette = surface.vignette ?? 0

  const maskShape = surface.maskShape ?? 'none'
  const maskSoftness = surface.maskSoftness ?? 0.02
  const maskInvert = surface.maskInvert ?? false

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-700/60 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700/60 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#d4f542]" />
          <span className="text-sm font-semibold text-gray-200">{surface.name}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors"
          title="Close inspector"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700/60 flex-shrink-0">
        {[
          { id: 'color', label: 'Color', icon: '🎨' },
          { id: 'transform', label: 'Transform', icon: '↔️' },
          { id: 'fx', label: 'FX', icon: '✨' },
          { id: 'mask', label: 'Mask', icon: '🔲' },
          { id: 'corners', label: 'Corners', icon: '📐' },
        ].map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={`flex-1 py-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === id
                ? 'border-[#d4f542] text-[#d4f542] bg-gray-800/50'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
            }`}
          >
            <span className="mr-1">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Uji Controls - only for Uji assets */}
        {isUjiAsset && asset && (
          <div className="pb-4 border-b border-[#d4f542]/30">
            <UjiControls asset={asset} disabled={surface.locked} />
          </div>
        )}

        {/* Opacity & Blend - always visible */}
        <div className="space-y-3 pb-4 border-b border-gray-700/60">
          <Slider label="Opacity" value={surface.opacity ?? 0.95} min={0} max={1}
            displayValue={`${Math.round((surface.opacity ?? 0.95) * 100)}%`}
            onChange={(v) => update({ opacity: v })} disabled={surface.locked} />
          <Slider label="Brightness" value={surface.brightness ?? 0} min={-0.5} max={0.5}
            displayValue={(surface.brightness ?? 0) >= 0 ? `+${(surface.brightness ?? 0).toFixed(2)}` : (surface.brightness ?? 0).toFixed(2)}
            onChange={(v) => update({ brightness: v })} disabled={surface.locked} />
          <Slider label="Contrast" value={surface.contrast ?? 0} min={-0.5} max={0.5}
            displayValue={(surface.contrast ?? 0) >= 0 ? `+${(surface.contrast ?? 0).toFixed(2)}` : (surface.contrast ?? 0).toFixed(2)}
            onChange={(v) => update({ contrast: v })} disabled={surface.locked} />
          
          {/* Blend mode */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Blend Mode</span>
            <div className="grid grid-cols-4 gap-1 p-0.5 bg-gray-800/60 rounded-lg">
              {(['normal','add','screen','multiply'] as const).map((mode) => (
                <button key={mode} onClick={() => update({ blendMode: mode })} disabled={surface.locked}
                  className={`py-1.5 text-[10px] font-medium rounded-md transition-all cursor-pointer disabled:opacity-40 capitalize ${
                    (surface.blendMode ?? 'normal') === mode
                      ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'color' && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">Color Adjustments</h3>
            <Slider label="Hue Shift" value={hue} min={-180} max={180} step={1}
              displayValue={`${hue > 0 ? '+' : ''}${hue}°`}
              onChange={(v) => update({ hue: v })} disabled={surface.locked} />
            <Slider label="Saturation" value={saturation} min={0} max={2} step={0.01}
              displayValue={saturation.toFixed(2)}
              onChange={(v) => update({ saturation: v })} disabled={surface.locked} />
            <Toggle label="Invert Colors" value={invert} onChange={(v) => update({ invert: v })} disabled={surface.locked} />

            {/* Chroma Key */}
            <div className="pt-4 border-t border-gray-700/60">
              <Toggle label="Chroma Key" value={surface.chromaKey ?? false} onChange={(v) => update({ chromaKey: v })} disabled={surface.locked} />
              {surface.chromaKey && (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">Color</span>
                    <input
                      type="color"
                      className="w-8 h-8 rounded cursor-pointer"
                      value={`#${Math.round((surface.chromaColor?.[0] ?? 0) * 255).toString(16).padStart(2, '0')}${Math.round((surface.chromaColor?.[1] ?? 1) * 255).toString(16).padStart(2, '0')}${Math.round((surface.chromaColor?.[2] ?? 0) * 255).toString(16).padStart(2, '0')}`}
                      onChange={(e) => {
                        const hex = e.target.value
                        const r = parseInt(hex.slice(1, 3), 16) / 255
                        const g = parseInt(hex.slice(3, 5), 16) / 255
                        const b = parseInt(hex.slice(5, 7), 16) / 255
                        update({ chromaColor: [r, g, b] })
                      }}
                    />
                  </div>
                  <Slider label="Threshold" value={surface.chromaThreshold ?? 0.3} min={0} max={1} step={0.01}
                    displayValue={(surface.chromaThreshold ?? 0.3).toFixed(2)}
                    onChange={(v) => update({ chromaThreshold: v })} disabled={surface.locked} />
                  <Slider label="Softness" value={surface.chromaSoftness ?? 0.1} min={0} max={0.5} step={0.01}
                    displayValue={(surface.chromaSoftness ?? 0.1).toFixed(2)}
                    onChange={(v) => update({ chromaSoftness: v })} disabled={surface.locked} />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'transform' && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">Transform</h3>
            <div className="flex gap-2">
              <button
                onClick={() => update({ flipH: !flipH })}
                disabled={surface.locked}
                className={`flex-1 py-2 text-xs rounded transition-colors cursor-pointer disabled:opacity-40 ${flipH ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400'}`}
              >
                ⟷ Horizontal
              </button>
              <button
                onClick={() => update({ flipV: !flipV })}
                disabled={surface.locked}
                className={`flex-1 py-2 text-xs rounded transition-colors cursor-pointer disabled:opacity-40 ${flipV ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400'}`}
              >
                ↕ Vertical
              </button>
            </div>
            <Slider label="Zoom" value={zoom} min={0.25} max={4} step={0.01}
              displayValue={`${zoom.toFixed(2)}×`}
              onChange={(v) => update({ zoom: v })} disabled={surface.locked} />
            <Slider label="Rotation" value={rotation} min={-180} max={180} step={1}
              displayValue={`${rotation}°`}
              onChange={(v) => update({ rotation: v })} disabled={surface.locked} />
          </div>
        )}

        {activeTab === 'fx' && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">Effects</h3>
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
            <div className="pt-4 border-t border-gray-700/40">
              <h4 className="text-xs font-medium text-gray-500 mb-2">Edge Blend</h4>
              {[
                { key: 'edgeBlendTop' as const, label: 'Top' },
                { key: 'edgeBlendBottom' as const, label: 'Bottom' },
                { key: 'edgeBlendLeft' as const, label: 'Left' },
                { key: 'edgeBlendRight' as const, label: 'Right' },
              ].map(({ key, label }) => (
                <Slider
                  key={key}
                  label={label}
                  value={surface[key] ?? 0}
                  min={0} max={0.5} step={0.005}
                  displayValue={(surface[key] ?? 0) === 0 ? 'Off' : `${Math.round((surface[key] ?? 0) * 100)}%`}
                  onChange={(v) => update({ [key]: v })}
                  disabled={surface.locked}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'mask' && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">Mask Shape</h3>
            <div className="grid grid-cols-4 gap-1">
              {([
                { id: 'none', label: 'None' },
                { id: 'ellipse', label: 'Circle' },
                { id: 'triangle', label: 'Tri' },
                { id: 'diamond', label: 'Dia' },
                { id: 'top', label: 'Top' },
                { id: 'bottom', label: 'Bot' },
                { id: 'left', label: 'Left' },
                { id: 'right', label: 'Right' },
              ] as { id: MaskShape; label: string }[]).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => update({ maskShape: id })}
                  disabled={surface.locked}
                  className={`py-2 text-[10px] rounded transition-colors cursor-pointer disabled:opacity-40 ${
                    maskShape === id ? 'bg-amber-600/80 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {maskShape !== 'none' && (
              <>
                <Slider label="Softness" value={maskSoftness} min={0} max={0.15} step={0.005}
                  displayValue={maskSoftness === 0 ? 'Hard' : maskSoftness.toFixed(3)}
                  onChange={(v) => update({ maskSoftness: v })} disabled={surface.locked} />
                <Toggle label="Invert Mask" value={maskInvert} onChange={(v) => update({ maskInvert: v })} disabled={surface.locked} />
              </>
            )}
          </div>
        )}

        {activeTab === 'corners' && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">Corner Positions</h3>
            <CornerNudge surface={surface} disabled={surface.locked} />
          </div>
        )}

        {/* Custom Shader */}
        <div className="pt-4 border-t border-gray-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Custom Shader</span>
            {surface.customShader && (
              <button
                onClick={() => update({ customShader: null })}
                disabled={surface.locked}
                className="text-xs text-gray-500 hover:text-red-400"
              >
                Clear
              </button>
            )}
          </div>
          <button
            onClick={onEditShader}
            disabled={surface.locked}
            className="mt-2 w-full py-2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded border border-gray-700 transition-colors disabled:opacity-40"
          >
            {surface.customShader ? 'Edit Shader' : '+ Add Shader'}
          </button>
        </div>

        {/* Reset */}
        <button
          onClick={() => resetSurface(surface.id)}
          disabled={surface.locked}
          className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 bg-gray-800/50 hover:bg-gray-800 rounded transition-colors disabled:opacity-40"
        >
          Reset to Default
        </button>
      </div>
    </div>
  )
}

// ─── Shared components ─────────────────────────────────────────────────────────

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  displayValue?: string
  onChange: (value: number) => void
  disabled?: boolean
}

function Slider({ label, value, min, max, step = 0.01, displayValue, onChange, disabled }: SliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400 font-medium">{label}</span>
        <span className="text-[10px] text-gray-500 font-mono w-10 text-right">{displayValue ?? value.toFixed(2)}</span>
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

interface ToggleProps {
  label: string
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

function Toggle({ label, value, onChange, disabled }: ToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-gray-400 font-medium">{label}</span>
      <button
        onClick={() => onChange(!value)}
        disabled={disabled}
        className={`w-10 h-5 rounded-full transition-colors relative disabled:opacity-40 ${value ? 'bg-green-600' : 'bg-gray-700'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}
