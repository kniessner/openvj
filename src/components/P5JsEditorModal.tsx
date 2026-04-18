/**
 * OpenVJ - p5.js Editor Modal
 * 
 * Full-screen modal editor with syntax highlighting for p5.js sketches.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useP5JsStore } from '../stores/p5jsStore';

// Simple syntax highlighter for p5.js / JavaScript
function highlightCode(code: string): string {
  const keywords = ['function', 'var', 'let', 'const', 'if', 'else', 'for', 'while', 'return', 'class', 'new', 'this', 'true', 'false', 'null', 'undefined', 'setup', 'draw', 'createCanvas', 'background', 'fill', 'stroke', 'circle', 'rect', 'line', 'point', 'ellipse', 'triangle', 'quad', 'arc', 'bezier', 'curve', 'text', 'push', 'pop', 'translate', 'rotate', 'scale', 'noise', 'random', 'map', 'lerp', 'constrain', 'dist', 'abs', 'floor', 'ceil', 'round', 'sin', 'cos', 'tan', 'atan2', 'PI', 'TWO_PI', 'HALF_PI', 'colorMode', 'RGB', 'HSB'];
  const keywordsRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
  
  // Replace special characters for HTML display
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Comments
  highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span style="color:#6b7280">$1</span>');
  highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6b7280">$1</span>');
  
  // Strings
  highlighted = highlighted.replace(/(['"`])(.*?)\1/g, '<span style="color:#22c55e">$1$2$1</span>');
  
  // Numbers
  highlighted = highlighted.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span style="color:#f97316">$1</span>');
  
  // Keywords
  highlighted = highlighted.replace(keywordsRegex, '<span style="color:#c084fc">$1</span>');
  
  // p5 functions
  highlighted = highlighted.replace(/\b(createCanvas|background|fill|stroke|noFill|noStroke|circle|ellipse|rect|line|point|triangle|quad|arc|beginShape|endShape|vertex|bezierVertex|curveVertex|text|textSize|push|pop|translate|rotate|scale|resetMatrix|colorMode|strokeWeight|strokeCap|strokeJoin|smooth|noSmooth|frameRate|loop|noLoop|redraw|width|height|mouseX|mouseY|pmouseX|pmouseY|winMouseX|winMouseY|mouseButton|mouseIsPressed|key|keyCode|keyIsPressed|keyIsDown|touchX|touchY|touches|deviceOrientation|turnAxis|accelerationX|accelerationY|accelerationZ|rotationX|rotationY|rotationZ|pAccelerationX|pAccelerationY|pAccelerationZ|setShakeThreshold|isKeyPressed)\b/g, '<span style="color:#38bdf8">$1</span>');
  
  // OpenVJ API
  highlighted = highlighted.replace(/\b(openvj)\b/g, '<span style="color:#ec4899">$1</span>');
  highlighted = highlighted.replace(/\b(audio|midi)\b/g, '<span style="color:#f59e0b">$1</span>');
  highlighted = highlighted.replace(/\b(getLow|getMid|getHigh|getBeat|getBPM|getCC)\b/g, '<span style="color:#10b981">$1</span>');
  
  return highlighted;
}

interface P5JsEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  layerId: string | null;
}

export const P5JsEditorModal: React.FC<P5JsEditorModalProps> = ({ isOpen, onClose, layerId }) => {
  const {
    layers,
    updateSketchCode,
    updateSketchName,
    templates,
    loadTemplate,
    toggleLayer,
    addLayer,
    removeLayer,
    setLayerOpacity,
    setLayerBlendMode,
  } = useP5JsStore();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState<'code' | 'help'>('code');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const activeLayer = layerId ? layers.find(l => l.id === layerId) : null;

  // Update code when layer changes
  useEffect(() => {
    if (activeLayer) {
      setCode(activeLayer.sketch.code);
      setIsPlaying(activeLayer.isPlaying);
      setError(null);
    }
  }, [layerId, activeLayer?.sketch.code]);

  // Sync scroll between textarea and pre
  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Debounced code update
  const updateCode = useCallback((newCode: string) => {
    setCode(newCode);
    setError(null);
    
    if (layerId && isPlaying) {
      const timeout = setTimeout(() => {
        try {
          updateSketchCode(layerId, newCode);
        } catch (err) {
          setError((err as Error).message);
        }
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [layerId, isPlaying, updateSketchCode]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (layerId) {
        updateSketchCode(layerId, code);
      }
    }
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (layerId) {
        updateSketchCode(layerId, code);
      }
    }
    // Tab to insert spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  // Export sketch
  const handleExport = () => {
    if (!activeLayer) return;
    const data = {
      name: activeLayer.name,
      code: code,
      mode: activeLayer.sketch.mode,
      width: activeLayer.sketch.width,
      height: activeLayer.sketch.height,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeLayer.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Duplicate layer
  const handleDuplicate = () => {
    if (!activeLayer) return;
    const newLayerId = addLayer({
      ...activeLayer.sketch,
      id: `sketch-${Date.now()}`,
      name: `${activeLayer.name} Copy`,
    });
    // Close modal and let user know
    onClose();
  };

  if (!isOpen || !activeLayer) return null;

  const highlightedCode = highlightCode(code);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <input
              type="text"
              value={activeLayer.name}
              onChange={(e) => layerId && updateSketchName(layerId, e.target.value)}
              className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-100 border border-gray-700 focus:border-blue-500 focus:outline-none"
              placeholder="Sketch name..."
            />
          </div>
          
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={() => {
                layerId && toggleLayer(layerId);
                setIsPlaying(!isPlaying);
              }}
              className={`px-3 py-1.5 rounded text-sm flex items-center gap-1.5 ${
                isPlaying 
                  ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' 
                  : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
              }`}
            >
              {isPlaying ? (
                <><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg> Pause</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg> Play</>
              )}
            </button>

            {/* Blend Mode */}
            <select
              value={activeLayer.blendMode}
              onChange={(e) => layerId && setLayerBlendMode(layerId, e.target.value as any)}
              className="px-2 py-1.5 bg-gray-800 rounded text-sm border border-gray-700"
            >
              <option value="NORMAL">Normal</option>
              <option value="ADD">Add</option>
              <option value="SCREEN">Screen</option>
              <option value="MULTIPLY">Multiply</option>
            </select>

            {/* Opacity */}
            <div className="flex items-center gap-2 px-2 py-1 bg-gray-800 rounded border border-gray-700">
              <span className="text-xs text-gray-500">Opac</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={activeLayer.opacity}
                onChange={(e) => layerId && setLayerOpacity(layerId, parseFloat(e.target.value))}
                className="w-20 h-1 bg-gray-700 rounded appearance-none"
              />
              <span className="text-xs text-gray-400 w-8 text-right">{Math.round(activeLayer.opacity * 100)}%</span>
            </div>

            <div className="w-px h-6 bg-gray-700 mx-1" />

            {/* Templates */}
            <div className="relative">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300"
              >
                Templates
              </button>
              {showTemplates && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
                  {templates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => {
                        loadTemplate(template.id);
                        setShowTemplates(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Run */}
            <button
              onClick={() => layerId && updateSketchCode(layerId, code)}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Run (Ctrl+Enter)
            </button>

            <div className="w-px h-6 bg-gray-700 mx-1" />

            {/* Export/Duplicate */}
            <button
              onClick={handleExport}
              title="Export sketch as JSON"
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300"
            >
              Export
            </button>
            <button
              onClick={handleDuplicate}
              title="Duplicate this sketch"
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300"
            >
              Duplicate
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="ml-2 p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              activeTab === 'code' 
                ? 'text-blue-400 border-blue-500' 
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            Code Editor
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              activeTab === 'help' 
                ? 'text-blue-400 border-blue-500' 
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            Reference & Help
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'code' ? (
            <div className="relative h-full">
              {/* Error display */}
              {error && (
                <div className="absolute top-0 left-0 right-0 z-10 p-3 bg-red-900/90 text-red-200 text-sm border-b border-red-700">
                  <strong>Error:</strong> {error}
                </div>
              )}

              {/* Editor with syntax highlighting */}
              <div className="relative h-full">
                {/* Highlighted code layer */}
                <pre
                  ref={preRef}
                  className="absolute inset-0 m-0 p-4 bg-gray-950 text-sm font-mono leading-6 overflow-auto pointer-events-none"
                  dangerouslySetInnerHTML={{ __html: highlightedCode + '\n' }}
                  style={{ 
                    whiteSpace: 'pre',
                    fontFamily: 'ui-monospace, SFMono-Regular, Monaco, Consolas, monospace'
                  }}
                />
                {/* Input layer */}
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => updateCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onScroll={handleScroll}
                  className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-white text-sm font-mono leading-6 resize-none focus:outline-none"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  style={{ 
                    whiteSpace: 'pre',
                    fontFamily: 'ui-monospace, SFMono-Regular, Monaco, Consolas, monospace'
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="h-full overflow-auto p-6 space-y-6">
              {/* OpenVJ Bridge API */}
              <section>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">OpenVJ Bridge API</h3>
                <div className="bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex gap-4">
                    <code className="text-pink-400 w-48">openvj.audio.getLow()</code>
                    <span className="text-gray-400">Bass frequencies (0-255) — 20-300Hz</span>
                  </div>
                  <div className="flex gap-4">
                    <code className="text-pink-400 w-48">openvj.audio.getMid()</code>
                    <span className="text-gray-400">Mid frequencies (0-255) — 300-4kHz</span>
                  </div>
                  <div className="flex gap-4">
                    <code className="text-pink-400 w-48">openvj.audio.getHigh()</code>
                    <span className="text-gray-400">High frequencies (0-255) — 4k-20kHz</span>
                  </div>
                  <div className="flex gap-4">
                    <code className="text-pink-400 w-48">openvj.audio.getBeat()</code>
                    <span className="text-gray-400">Beat trigger (0-1), decays after kick</span>
                  </div>
                  <div className="flex gap-4">
                    <code className="text-pink-400 w-48">openvj.audio.getBPM()</code>
                    <span className="text-gray-400">Detected tempo from tap or analysis</span>
                  </div>
                  <div className="flex gap-4">
                    <code className="text-pink-400 w-48">openvj.midi.getCC(n)</code>
                    <span className="text-gray-400">MIDI CC value (0-1), n = 0-127</span>
                  </div>
                </div>
              </section>

              {/* Quick Example */}
              <section>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Quick Example</h3>
                <pre className="bg-gray-950 rounded-lg p-4 text-sm font-mono text-green-300 overflow-x-auto">
{`function setup() {
  createCanvas(512, 512);
  colorMode(HSB);
}

function draw() {
  // React to beat
  const beat = openvj.audio.getBeat();
  if (beat > 0.5) {
    background(0);
  } else {
    background(0, 0, 10);
  }
  
  // Scale circle with bass
  const bass = openvj.audio.getLow() / 255;
  fill(beat * 360, 80, 100);
  noStroke();
  circle(width/2, height/2, 50 + bass * 200);
  
  // Use MIDI CC 1 for rotation
  const knob = openvj.midi.getCC(1);
  translate(width/2, height/2);
  rotate(knob * TWO_PI);
  stroke(255);
  line(0, 0, 100, 0);
}`}
                </pre>
              </section>

              {/* Tips */}
              <section>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Performance Tips</h3>
                <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                  <li>Keep particle counts under 500 for 60fps</li>
                  <li>Use <code className="text-purple-300">ADD</code> blend mode for glowing effects</li>
                  <li>Cache audio values in variables instead of calling API every frame when possible</li>
                  <li>Use WEBGL mode only when you need 3D—2D is faster</li>
                  <li>Press <kbd className="px-1 bg-gray-700 rounded">Ctrl</kbd>+<kbd className="px-1 bg-gray-700 rounded">Enter</kbd> to run code</li>
                  <li>Press <kbd className="px-1 bg-gray-700 rounded">Tab</kbd> to insert 2 spaces</li>
                </ul>
              </section>

              {/* Common p5 Functions */}
              <section>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Common p5.js Functions</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                  <div><code className="text-blue-300">createCanvas(w, h)</code> – Create drawing area</div>
                  <div><code className="text-blue-300">background(color)</code> – Clear background</div>
                  <div><code className="text-blue-300">fill(color)</code> – Set fill color</div>
                  <div><code className="text-blue-300">stroke(color)</code> – Set stroke color</div>
                  <div><code className="text-blue-300">circle(x, y, d)</code> – Draw circle</div>
                  <div><code className="text-blue-300">rect(x, y, w, h)</code> – Draw rectangle</div>
                  <div><code className="text-blue-300">line(x1, y1, x2, y2)</code> – Draw line</div>
                  <div><code className="text-blue-300">random(min, max)</code> – Random number</div>
                  <div><code className="text-blue-300">noise(x)</code> – Perlin noise</div>
                  <div><code className="text-blue-300">map(value, a, b, c, d)</code> – Remap range</div>
                  <div><code className="text-blue-300">sin(angle)</code> / <code className="text-blue-300">cos(angle)</code> – Trig functions</div>
                  <div><code className="text-blue-300">push()</code> / <code className="text-blue-300">pop()</code> – Save/restore state</div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-700 bg-gray-800 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>Mode: {activeLayer.sketch.mode}</span>
            <span>Size: {activeLayer.sketch.width}×{activeLayer.sketch.height}</span>
            <span>{code.split('\n').length} lines</span>
            <span>{code.length} characters</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Press Ctrl+Enter to run</span>
            <span className={error ? 'text-red-400' : 'text-green-400'}>
              {error ? 'Error' : 'Ready'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
