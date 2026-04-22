import { useState, useEffect, useCallback } from 'react'
import { Asset, DepthAssetConfig } from '../stores/assetStore'
import { useAssetStore } from '../stores/assetStore'
import { assetTextureManager } from '../lib/assetTextureManager'
import { depthTextureManager } from '../lib/depthTextureManager'

// Default depth configuration
const DEFAULT_DEPTH_CONFIG: DepthAssetConfig = {
  enabled: true,
  resolutionX: 64,
  resolutionY: 48,
  extrusionScale: 2.0,
  pointSize: 3.0,
  colorByDepth: true,
  renderMode: 'points',
  audioReactivity: 0.5,
}

interface DepthConfigPanelProps {
  asset: Asset | null
  onClose: () => void
}

export function DepthConfigPanel({ asset, onClose }: DepthConfigPanelProps) {
  const { updateAsset, assets } = useAssetStore()
  const [config, setConfig] = useState<DepthAssetConfig>(DEFAULT_DEPTH_CONFIG)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [depthFps, setDepthFps] = useState(0)

  // Get source asset name if exists
  const sourceAsset = asset?.depthSourceId 
    ? assets.find(a => a.id === asset.depthSourceId)
    : null

  useEffect(() => {
    if (asset?.depthConfig) {
      setConfig({ ...DEFAULT_DEPTH_CONFIG, ...asset.depthConfig })
    }
  }, [asset])

  // Update FPS display
  useEffect(() => {
    if (!asset) return
    const interval = setInterval(() => {
      const fps = depthTextureManager.getDepthFPS(asset.id)
      setDepthFps(fps)
    }, 1000)
    return () => clearInterval(interval)
  }, [asset])

  const handleUpdate = useCallback((updates: Partial<DepthAssetConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates }
      if (asset) {
        updateAsset(asset.id, { depthConfig: newConfig })
        // Update running depth texture manager
        depthTextureManager.updateConfig(asset.id, updates)
      }
      return newConfig
    })
  }, [asset, updateAsset])

  const handleCreateFromSource = async (sourceId: string) => {
    if (!asset) return
    setIsLoading(true)
    setError(null)
    
    try {
      updateAsset(asset.id, { depthSourceId: sourceId })
      
      // Load the source first
      const sourceAsset = assets.find(a => a.id === sourceId)
      if (!sourceAsset) {
        throw new Error('Source asset not found')
      }
      
      // Load source texture to get video element
      await assetTextureManager.load(sourceAsset)
      const videoEl = assetTextureManager.getMediaEl(sourceId)
      
      if (!videoEl) {
        throw new Error('Could not get video element from source')
      }
      
      // Now load depth texture
      await depthTextureManager.loadDepthTexture(
        asset.id,
        videoEl,
        config
      )
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create depth layer')
    } finally {
      setIsLoading(false)
    }
  }

  if (!asset || asset.type !== 'depth') return null

  // Get available video sources (webcam, screen capture, video)
  const videoSources = assets.filter(a => 
    a.type === 'webcam' || a.type === 'screencapture' || a.type === 'video'
  )

  const voxelCount = config.resolutionX * config.resolutionY
  const voxelDisplay = voxelCount >= 1000 
    ? `${(voxelCount / 1000).toFixed(1)}K` 
    : voxelCount.toString()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Panel */}
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 2L2 7l10 5 10-5-10-5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2 17l10 5 10-5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2 12l10 5 10-5" />
            </svg>
            <h2 className="text-sm font-semibold text-gray-200">Depth Estimation Config</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Source Selection */}
          {!sourceAsset ? (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Select Video Source
              </label>
              <div className="space-y-1">
                {videoSources.length === 0 ? (
                  <p className="text-xs text-gray-500 py-2">
                    No video sources available. Add a webcam, screen capture, or video first.
                  </p>
                ) : (
                  videoSources.map(source => (
                    <button
                      key={source.id}
                      onClick={() => handleCreateFromSource(source.id)}
                      disabled={isLoading}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-left transition-colors disabled:opacity-50"
                    >
                      <SourceIcon type={source.type} />
                      <span className="text-xs text-gray-300">{source.name}</span>
                      {isLoading && (
                        <div className="ml-auto w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <SourceIcon type={sourceAsset.type} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 truncate">{sourceAsset.name}</p>
                <p className="text-xs text-blue-400">Source Connected</p>
              </div>
              <button
                onClick={() => handleUpdate({ enabled: !config.enabled })}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  config.enabled 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {config.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
          )}

          {/* Resolution */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Voxel Resolution
              </label>
              <span className="text-xs font-mono text-blue-400">
                {config.resolutionX}x{config.resolutionY} ({voxelDisplay} voxels)
              </span>
            </div>
            <input
              type="range"
              min="32"
              max="128"
              step="16"
              value={config.resolutionX}
              onChange={(e) => {
                const value = parseInt(e.target.value)
                const height = Math.round(value * 0.75)
                handleUpdate({ resolutionX: value, resolutionY: height })
              }}
              disabled={!sourceAsset}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>Low (3K)</span>
              <span>High (12K)</span>
            </div>
          </div>

          {/* Extrusion Scale */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Extrusion Scale
              </label>
              <span className="text-xs font-mono text-blue-400">
                {config.extrusionScale.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={config.extrusionScale}
              onChange={(e) => handleUpdate({ extrusionScale: parseFloat(e.target.value) })}
              disabled={!sourceAsset}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
          </div>

          {/* Point Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Point Size
              </label>
              <span className="text-xs font-mono text-blue-400">
                {config.pointSize.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={config.pointSize}
              onChange={(e) => handleUpdate({ pointSize: parseFloat(e.target.value) })}
              disabled={!sourceAsset}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
          </div>

          {/* Audio Reactivity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Audio Reactivity
              </label>
              <span className="text-xs font-mono text-blue-400">
                {Math.round(config.audioReactivity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.audioReactivity}
              onChange={(e) => handleUpdate({ audioReactivity: parseFloat(e.target.value) })}
              disabled={!sourceAsset}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
          </div>

          {/* Toggles */}
          <div className="flex gap-2">
            <button
              onClick={() => handleUpdate({ colorByDepth: !config.colorByDepth })}
              disabled={!sourceAsset}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                config.colorByDepth
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}
            >
              Color by Depth
            </button>
          </div>

          {/* Stats */}
          {sourceAsset && (
            <div className="grid grid-cols-2 gap-2 p-3 bg-gray-800/50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">{depthFps}</div>
                <div className="text-xs text-gray-500">Depth FPS</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">{voxelDisplay}</div>
                <div className="text-xs text-gray-500">Voxels</div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-3 bg-gray-800/30 rounded-lg text-xs text-gray-500 leading-relaxed">
            <p className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Depth estimation uses WebGPU for local ML inference. 
                Higher voxel counts may impact performance on slower devices.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SourceIcon({ type }: { type: string }) {
  switch (type) {
    case 'webcam':
      return (
        <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        </svg>
      )
    case 'screencapture':
      return (
        <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    case 'video':
      return (
        <svg className="w-4 h-4 text-[#d4f542]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    default:
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      )
  }
}

export { DEFAULT_DEPTH_CONFIG }
