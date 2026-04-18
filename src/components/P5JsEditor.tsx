/**
 * OpenVJ - p5.js Editor Component
 * 
 * Live code editor for p5.js sketches with preview and error handling.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useP5JsStore } from '../stores/p5jsStore';

// Simple code editor (you could integrate Monaco or CodeMirror for full features)
interface P5JsEditorProps {
  className?: string;
}

export const P5JsEditor: React.FC<P5JsEditorProps> = ({ className = '' }) => {
  const {
    layers,
    activeLayerId,
    templates,
    updateSketchCode,
    updateSketchName,
    loadTemplate,
    addLayer,
    exportLayer,
    importLayer
  } = useP5JsStore();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeLayer = layers.find(l => l.id === activeLayerId);

  // Update code when active layer changes
  useEffect(() => {
    if (activeLayer) {
      setCode(activeLayer.sketch.code);
      setIsPlaying(activeLayer.isPlaying);
      setError(null);
    } else {
      setCode('');
    }
  }, [activeLayerId, activeLayer?.sketch.code]);

  // Debounced code update
  const updateCode = useCallback((newCode: string) => {
    setCode(newCode);
    
    if (activeLayerId && isPlaying) {
      // Clear previous error
      setError(null);
      
      // Update after a short delay for debouncing
      const timeout = setTimeout(() => {
        try {
          updateSketchCode(activeLayerId, newCode);
        } catch (err) {
          setError((err as Error).message);
        }
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [activeLayerId, isPlaying, updateSketchCode]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (activeLayerId) {
        updateSketchCode(activeLayerId, code);
      }
    }
  };

  // Export current sketch
  const handleExport = () => {
    if (activeLayerId) {
      const json = exportLayer(activeLayerId);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeLayer?.name || 'sketch'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Import sketch
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        importLayer(json);
      };
      reader.readAsText(file);
    }
  };

  // Format code (basic indentation)
  const formatCode = () => {
    // Simple auto-format: fix indentation
    const lines = code.split('\n');
    let indent = 0;
    const formatted = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.endsWith('}') || trimmed.endsWith('];')) {
        indent = Math.max(0, indent - 1);
      }
      const result = '  '.repeat(indent) + trimmed;
      if (trimmed.endsWith('{') || trimmed.endsWith('[')) {
        indent++;
      }
      return result;
    }).join('\n');
    
    setCode(formatted);
    if (activeLayerId) {
      updateSketchCode(activeLayerId, formatted);
    }
  };

  if (!activeLayer) {
    return (
      <div className={`flex flex-col items-center justify-center h-full text-gray-400 ${className}`}>
        <p className="mb-4">No p5.js layer selected</p>
        <button
          onClick={() => addLayer()}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
        >
          + Create New p5.js Layer
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
        <input
          type="text"
          value={activeLayer.name}
          onChange={(e) => activeLayerId && updateSketchName(activeLayerId, e.target.value)}
          className="flex-1 px-2 py-1 bg-gray-900 rounded text-sm"
          placeholder="Sketch name..."
        />
        
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
        >
          Templates
        </button>
        
        <button
          onClick={formatCode}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          title="Format Code"
        >
          Format
        </button>
        
        <button
          onClick={() => activeLayerId && useP5JsStore.getState().toggleLayer(activeLayerId)}
          className={`px-3 py-1 rounded text-sm ${
            isPlaying 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        
        <button
          onClick={() => activeLayerId && updateSketchCode(activeLayerId, code)}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          title="Ctrl+Enter to Run"
        >
          ▶ Run
        </button>
        
        <div className="w-px h-6 bg-gray-600 mx-1" />
        
        <button
          onClick={handleExport}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
        >
          Export
        </button>
        
        <label className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm cursor-pointer">
          Import
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>

      {/* Templates Panel */}
      {showTemplates && (
        <div className="p-2 bg-gray-800 border-b border-gray-700">
          <p className="text-xs text-gray-400 mb-2">Click to load template:</p>
          <div className="flex flex-wrap gap-2">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => {
                  loadTemplate(template.id);
                  setShowTemplates(false);
                }}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-2 bg-red-900/50 border-b border-red-700 text-red-200 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Code Editor */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => updateCode(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-full p-4 bg-gray-900 text-gray-100 font-mono text-sm resize-none focus:outline-none"
          spellCheck={false}
          placeholder="// Write your p5.js sketch here..."
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>Mode: {activeLayer.sketch.mode}</span>
          <span>Size: {activeLayer.sketch.width}×{activeLayer.sketch.height}</span>
          <span>{code.split('\n').length} lines</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-500">
            Press Ctrl+Enter to run
          </span>
        </div>
      </div>
    </div>
  );
};

// Preview component for p5.js layer thumbnail
interface P5JsPreviewProps {
  layerId: string;
  className?: string;
}

export const P5JsPreview: React.FC<P5JsPreviewProps> = ({ layerId, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { getOrCreateSource } = useP5JsStore();

  useEffect(() => {
    const updatePreview = () => {
      const source = getOrCreateSource(layerId);
      if (source && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const sourceCanvas = source.getCanvas();
          canvasRef.current.width = sourceCanvas.width;
          canvasRef.current.height = sourceCanvas.height;
          ctx.drawImage(sourceCanvas, 0, 0);
        }
      }
    };

    const interval = setInterval(updatePreview, 100);
    return () => clearInterval(interval);
  }, [layerId, getOrCreateSource]);

  return (
    <canvas
      ref={canvasRef}
      className={`${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};
