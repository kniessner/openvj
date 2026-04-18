/**
 * OpenVJ - p5.js Panel Component
 * 
 * Sidebar panel for managing p5.js generative layers.
 */

import React, { useState } from 'react';
import { useP5JsStore } from '../stores/p5jsStore';
import { P5JsEditor } from './P5JsEditor';

interface P5JsPanelProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const P5JsPanel: React.FC<P5JsPanelProps> = ({ collapsed, onToggle }) => {
  const {
    layers,
    activeLayerId,
    templates,
    addLayer,
    removeLayer,
    setActiveLayer,
    toggleLayer,
    loadTemplate,
    setLayerOpacity,
  } = useP5JsStore();

  const [showTemplates, setShowTemplates] = useState(false);
  const [editingLayer, setEditingLayer] = useState<string | null>(null);

  // Get blend mode color
  const getBlendModeColor = (mode: string) => {
    switch (mode) {
      case 'ADD': return 'text-yellow-400';
      case 'MULTIPLY': return 'text-purple-400';
      case 'SCREEN': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="flex flex-col overflow-hidden flex-shrink-0 border-t border-gray-700/60">
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:bg-gray-800/60 transition-colors cursor-pointer flex-shrink-0"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          p5.js Creative Coding
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-600 normal-case font-normal">{layers.length}</span>
          <svg className={`w-3 h-3 text-gray-600 transition-transform ${collapsed ? '-rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {!collapsed && (
        <div className="flex flex-col overflow-hidden flex-1 min-h-0">
          {/* Add buttons */}
          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-700/40">
            <button
              onClick={() => addLayer()}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 transition-colors cursor-pointer rounded"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Sketch
            </button>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className={`px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
                showTemplates 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'
              }`}
            >
              Templates
            </button>
          </div>

          {/* Template selector */}
          {showTemplates && (
            <div className="px-2 py-2 border-b border-gray-700/40 bg-gray-800/30">
              <p className="text-xs text-gray-500 mb-1.5">Click to load template:</p>
              <div className="flex flex-wrap gap-1">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => {
                      loadTemplate(template.id);
                      setShowTemplates(false);
                    }}
                    className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Layer list */}
          <div className="flex-1 overflow-y-auto min-h-0 py-1">
            {layers.length === 0 && (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-gray-600 mb-2">No p5.js sketches yet</p>
                <p className="text-xs text-gray-500">Create generative art with code!</p>
              </div>
            )}

            {layers.map((layer, index) => (
              <div
                key={layer.id}
                className={`group flex flex-col gap-1 px-2 py-1.5 cursor-pointer hover:bg-gray-800/60 transition-colors ${
                  activeLayerId === layer.id ? 'bg-blue-900/20 border-l-2 border-blue-500' : 'border-l-2 border-transparent'
                }`}
              >
                {/* Layer header row */}
                <div className="flex items-center gap-2">
                  {/* Visibility toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleLayer(layer.id); }}
                    className={`flex-shrink-0 ${layer.isPlaying ? 'text-green-400' : 'text-gray-600'}`}
                  >
                    {layer.isPlaying ? (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    )}
                  </button>

                  {/* Layer name */}
                  <span 
                    onClick={() => setActiveLayer(layer.id)}
                    className="flex-1 text-xs text-gray-300 truncate"
                  >
                    {index + 1}. {layer.sketch.name}
                  </span>

                  {/* Blend mode indicator */}
                  <span className={`text-[10px] ${getBlendModeColor(layer.blendMode)}`}>
                    {layer.blendMode === 'NORMAL' ? 'N' : layer.blendMode[0]}
                  </span>

                  {/* Edit button */}
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setActiveLayer(layer.id);
                      setEditingLayer(editingLayer === layer.id ? null : layer.id);
                    }}
                    className={`p-1 rounded transition-colors ${
                      editingLayer === layer.id 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-600 hover:text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                    className="p-1 text-gray-600 hover:text-red-400 hover:bg-gray-700 rounded transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Opacity slider when active */}
                {activeLayerId === layer.id && (
                  <div className="flex items-center gap-2 pl-5">
                    <span className="text-[10px] text-gray-500 w-8">Opac</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={layer.opacity}
                      onChange={(e) => setLayerOpacity(layer.id, parseFloat(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[10px] text-gray-500 w-6 text-right">
                      {Math.round(layer.opacity * 100)}%
                    </span>
                  </div>
                )}

                {/* Inline editor */}
                {editingLayer === layer.id && (
                  <div className="mt-1 border border-gray-700 rounded bg-gray-900">
                    <div className="h-48">
                      <P5JsEditor />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Info footer */}
          <div className="px-3 py-1.5 border-t border-gray-700/60 text-[10px] text-gray-600">
            <p>Use openvj.audio.getLow() / getMid() / getHigh() / getBeat()</p>
            <p>Use openvj.midi.getCC(n) for MIDI control</p>
          </div>
        </div>
      )}
    </div>
  );
};
