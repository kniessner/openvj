import { useState } from 'react'

// ─── Small helpers ────────────────────────────────────────────────────────────

function KbdKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-gray-300 font-mono text-xs">
      {children}
    </kbd>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800 pb-2">
        {title}
      </h3>
      {children}
    </div>
  )
}

function Mono({ children }: { children: React.ReactNode }) {
  return <code className="text-purple-300 font-mono">{children}</code>
}

// ─── Tab contents ─────────────────────────────────────────────────────────────

function OverviewContent() {
  return (
    <div className="space-y-6">
      <Section title="Quick Start">
        <ol className="space-y-2 text-xs text-gray-400 list-decimal list-inside">
          <li>Click <strong className="text-gray-200">+ Add Surface</strong> in the Surfaces panel to create a mapping surface</li>
          <li>Click the surface in the viewport to select it — blue outline and red corner handles appear</li>
          <li>Drag the handles to warp the quad to match your projection target</li>
          <li>Assign content in one of three ways:
            <ul className="mt-1 space-y-1 list-disc list-inside pl-4">
              <li><strong className="text-[#d4f542]">Media</strong> panel — drag video/image files or click built-in shaders</li>
              <li><strong className="text-orange-400">p5.js</strong> panel — code generative art, then click the ⛶ icon to assign to the selected surface</li>
              <li>Or select from any asset in the Media panel and click to assign</li>
            </ul>
          </li>
          <li>Press <KbdKey>F</KbdKey> to enter fullscreen presentation mode</li>
        </ol>
      </Section>

      <Section title="Panels">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { name: 'Media',      desc: 'Import visual assets — video, images, shaders, Uji generators, webcam, screen capture. Drag files directly onto the panel.' },
            { name: 'p5.js',      desc: 'Live code generative art sketches with audio/MIDI reactivity. 5 templates included. Click ⛶ to assign to selected surface.' },
            { name: 'Surfaces',   desc: 'Add, reorder (drag rows), show/hide, lock, and delete surfaces. Select a surface to open the Inspector.' },
            { name: 'Inspector',  desc: 'Adjust all surface properties: opacity, FX sliders, blend mode, flip/rotate/zoom, distortion, and per-surface custom shader.' },
            { name: 'Scenes',     desc: 'Save named snapshots of the entire surface layout with canvas thumbnails. Click a scene to restore it instantly.' },
            { name: 'Transport',  desc: 'Play/pause/seek video, control loop and rate, monitor audio levels, tap BPM, bind MIDI, and record the canvas to WebM.' },
          ].map(({ name, desc }) => (
            <div key={name} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
              <p className="text-gray-200 font-medium mb-1">{name}</p>
              <p className="text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Asset Types">
        <div className="space-y-1.5 text-xs">
          {[
            ['Video',   'MP4, WebM, MOV — drag & drop or use Add Asset. Thumbnails shown automatically.'],
            ['Image',   'PNG, JPG, GIF, WebP — animated GIFs loop automatically.'],
            ['Shader',  'Standalone GLSL fragment shaders — write manually or generate with AI.'],
            ['Uji',     'Procedural line-art generator with 6 visual presets and AI-editable shader.'],
            ['p5.js',   'Live-programmed generative art with audio-reactive OpenVJ Bridge API.'],
            ['Webcam',  'Live camera feed — requires browser permission.'],
            ['Screen',  'Capture any window or display via browser API.'],
            ['Depth',   'Real-time 3D depth estimation from any video source. WebGPU required.'],
          ].map(([type, desc]) => (
            <div key={type} className="flex gap-3">
              <span className={type === 'Depth' ? 'text-blue-400 font-medium w-16 flex-shrink-0' : 'text-[#d4f542] font-medium w-16 flex-shrink-0'}>{type}</span>
              <span className="text-gray-500">{desc}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Depth Estimation (v0.3)">
        <div className="space-y-2 text-xs text-gray-400">
          <p>Transform any video source into real-time 3D voxel extrusion using on-device ML:</p>
          <ol className="space-y-1 list-decimal list-inside pl-2">
            <li>Click <strong className="text-blue-400">+ Depth Layer</strong> in the Media panel</li>
            <li>Select a video source (webcam, screen, or video)</li>
            <li>Adjust resolution (3K-12K voxels), extrusion scale, and audio reactivity</li>
            <li>Assign to a surface — see both depth texture AND floating 3D voxel cloud</li>
          </ol>
          <p className="text-gray-500">
            <strong className="text-gray-300">Requirements:</strong> Chrome/Edge with WebGPU enabled. 
            Model downloads on first use (~50MB). Performance varies by GPU.
          </p>
        </div>
      </Section>

      <Section title="Recording & Scenes">
        <div className="text-xs text-gray-400 space-y-2">
          <p><strong className="text-gray-200">Canvas Recording</strong> — click <strong className="text-gray-200">Rec</strong> in the header to capture the Three.js canvas to a WebM video. Click <strong className="text-gray-200">Stop</strong> to download the file. The recorder uses <Mono>canvas.captureStream(30fps)</Mono> + MediaRecorder VP9.</p>
          <p><strong className="text-gray-200">Scenes</strong> — click <strong className="text-gray-200">Save current scene</strong> in the Scenes panel to snapshot all surfaces. The thumbnail is grabbed from the live canvas. Load any scene by clicking its row. Rename with the pencil icon.</p>
        </div>
      </Section>
    </div>
  )
}

function ControlsContent() {
  return (
    <div className="space-y-6">
      <Section title="Keyboard Shortcuts">
        <table className="w-full text-xs">
          <tbody>
            {[
              ['Space',          'Play / Pause active video'],
              ['Esc',            'Deselect active surface (or exit fullscreen)'],
              ['F',              'Toggle fullscreen presentation mode'],
              ['⌘ Z  /  Ctrl Z', 'Undo last surface change'],
              ['⌘ ⇧ Z  /  Ctrl ⇧ Z', 'Redo'],
              ['Double-click name', 'Rename surface or scene inline'],
              ['Tab (shader editor)', 'Insert 2-space indent'],
            ].map(([key, action]) => (
              <tr key={key} className="border-t border-gray-800 first:border-0">
                <td className="py-2 pr-6 whitespace-nowrap"><KbdKey>{key}</KbdKey></td>
                <td className="py-2 text-gray-400">{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Viewport">
        <div className="space-y-2 text-xs text-gray-400">
          {[
            ['Scroll',          'Zoom in / out'],
            ['Right-drag',      'Orbit / pan the camera'],
            ['Click surface',   'Select it — blue outline + red corner handles appear'],
            ['Drag corner',     'Warp that corner independently'],
            ['Click empty',     'Deselect current surface'],
          ].map(([key, desc]) => (
            <div key={key} className="flex gap-3">
              <span className="text-gray-200 w-32 flex-shrink-0">{key}</span>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Surface List">
        <div className="space-y-2 text-xs text-gray-400">
          {[
            ['Drag row',         'Reorder surfaces (affects draw order — lower = front)'],
            ['Eye icon',         'Toggle visibility — hidden surfaces are not rendered'],
            ['Lock icon',        'Prevent editing — corner handles and Inspector are disabled'],
            ['Green dot',        'Surface has a custom GLSL post-process shader active'],
            ['Code icon',        'Open the surface shader editor'],
            ['Trash icon',       'Delete surface (hover to reveal)'],
            ['Double-click name','Rename the surface inline'],
          ].map(([key, desc]) => (
            <div key={key} className="flex gap-3">
              <span className="text-gray-200 w-36 flex-shrink-0">{key}</span>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Inspector Sections">
        <div className="space-y-2 text-xs text-gray-400">
          {[
            ['Opacity / Brightness / Contrast', 'Basic image adjustments via shader uniforms, updated every frame.'],
            ['Color FX',     'Hue rotate (–180°→+180°), saturation (0=grey, 2=vivid), invert toggle.'],
            ['Transform',    'Flip H/V, rotation (±180°), zoom (0.25–4×). All applied before sampling the texture.'],
            ['Distortion',   'Wave warp (amplitude + frequency), chromatic aberration, pixelate, vignette.'],
            ['Shader',       'Assign a per-surface GLSL post-process function that runs after all other FX.'],
            ['Corners',      'Numeric nudge inputs for precise quad positioning. Click arrows or type values.'],
          ].map(([name, desc]) => (
            <div key={name} className="flex gap-3">
              <span className="text-gray-200 w-44 flex-shrink-0">{name}</span>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Transport Bar">
        <div className="space-y-2 text-xs text-gray-400">
          {[
            ['Play / Pause / Stop',  'Controls the video assigned to the active surface.'],
            ['Timeline scrubber',    'Click or drag to seek. Shows current time / duration.'],
            ['Rate buttons (0.5× – 4×)', 'Changes video playback speed.'],
            ['Loop toggle',          'Enable/disable video looping (default: on).'],
            ['Mute / Volume',        'Mute the video audio track; volume slider appears when unmuted.'],
            ['Waveform bars',        'Live L/M/H audio energy from the microphone input.'],
            ['TAP / BPM',            'Tap a rhythm to calculate BPM. Sets uBpm uniform for shaders. Click × to reset.'],
            ['MIDI button',          'Enable Web MIDI and open the CC binding panel.'],
            ['Mic button',           'Enable microphone input for audio-reactive shaders.'],
          ].map(([name, desc]) => (
            <div key={name} className="flex gap-3">
              <span className="text-gray-200 w-48 flex-shrink-0">{name}</span>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

function ShadersContent() {
  return (
    <div className="space-y-6">
      <Section title="Two Shader Modes">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-gray-800/50 rounded-lg p-3 border border-purple-800/40">
            <p className="text-purple-300 font-semibold mb-1.5">Asset Shader (Media panel)</p>
            <p className="text-gray-400">A standalone GLSL fragment program that <em>generates</em> visuals from scratch. Assigned to a surface the same way as a video or image. Write <Mono>void main()</Mono> and set <Mono>gl_FragColor</Mono>.</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 border border-[#d4f542]/30">
            <p className="text-[#d4f542] font-semibold mb-1.5">Surface Post-Process (Inspector)</p>
            <p className="text-gray-400">A per-surface GLSL function applied <em>after</em> all FX sliders (brightness, hue, warp, etc.). Receives the processed color and UV, returns the final color. Write <Mono>vec4 applyFX(vec4 color, vec2 uv)</Mono>.</p>
          </div>
        </div>
      </Section>

      <Section title="Asset Shader — Available Uniforms">
        <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs space-y-1 border border-gray-800">
          {[
            ['uTime',       'float', 'Seconds elapsed since load'],
            ['uResolution', 'vec2',  'Canvas size in pixels (512 × 512)'],
            ['uAudioLow',   'float', '0–1  Bass energy (20–300 Hz)'],
            ['uAudioMid',   'float', '0–1  Mid energy (300–4 kHz)'],
            ['uAudioHigh',  'float', '0–1  High energy (4–20 kHz)'],
            ['uBeat',       'float', '0–1  Beat pulse, decays after each kick'],
            ['uBpm',        'float', 'Tapped BPM (0 = not set)'],
          ].map(([name, type, desc]) => (
            <div key={name} className="flex gap-3 items-baseline">
              <span className="text-purple-400 w-24 flex-shrink-0">{name}</span>
              <span className="text-yellow-600 w-12 flex-shrink-0">{type}</span>
              <span className="text-gray-500">{desc}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Asset Shader — Minimal Example">
        <pre className="bg-gray-950 rounded-lg p-3 font-mono text-xs text-green-300 leading-relaxed overflow-x-auto border border-gray-800">{`void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float t  = uTime * 0.4;
  vec3 col = 0.5 + 0.5 * cos(t + uv.xyx + vec3(0.0, 2.0, 4.0));
  gl_FragColor = vec4(col * (1.0 + uBeat), 1.0);
}`}</pre>
      </Section>

      <Section title="Surface Post-Process — Available in applyFX">
        <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs space-y-1 border border-gray-800">
          <p className="text-gray-500 mb-2">Same uniforms as Asset Shaders (uTime, uBpm, uAudioLow …) plus:</p>
          {[
            ['color', 'vec4',  'Input color after all FX sliders have been applied'],
            ['uv',    'vec2',  'Texture UV after flip / rotate / zoom / warp'],
          ].map(([name, type, desc]) => (
            <div key={name} className="flex gap-3 items-baseline">
              <span className="text-purple-400 w-24 flex-shrink-0">{name}</span>
              <span className="text-yellow-600 w-12 flex-shrink-0">{type}</span>
              <span className="text-gray-500">{desc}</span>
            </div>
          ))}
        </div>
        <pre className="bg-gray-950 rounded-lg p-3 font-mono text-xs text-green-300 leading-relaxed overflow-x-auto border border-gray-800 mt-2">{`// Glitch scan-line + beat flash post-process
vec4 applyFX(vec4 color, vec2 uv) {
  float scan = mod(uv.y * 80.0 + uTime * 2.0, 1.0);
  color.rgb *= 0.85 + 0.15 * step(0.5, scan);
  color.rgb += vec3(uBeat * 0.3);
  return color;
}`}</pre>
      </Section>

      <Section title="BPM-Sync Example">
        <pre className="bg-gray-950 rounded-lg p-3 font-mono text-xs text-green-300 leading-relaxed overflow-x-auto border border-gray-800">{`// Strobe that pulses on the beat at the tapped BPM
void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  // Phase within current beat (0–1)
  float bps   = uBpm / 60.0;
  float phase = fract(uTime * bps);
  float strobe = step(0.5, phase) * uAudioLow;

  vec3 col = mix(vec3(0.05), vec3(1.0, 0.4, 0.1), strobe);
  gl_FragColor = vec4(col, 1.0);
}`}</pre>
      </Section>

      <Section title="Tips">
        <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside">
          <li>Click <strong className="text-gray-200">Generate with AI</strong> in the shader editor — describe the effect in plain English</li>
          <li>The live preview canvas in the surface shader editor updates with a 350 ms debounce while you type</li>
          <li>Built-in shaders are read-only — view them, then copy code to a new shader to modify</li>
          <li>Compilation errors show the raw GLSL error — look for the line number hint</li>
          <li>Use <Mono>fract(uTime * uBpm / 60.0)</Mono> to sync animations to the tapped tempo</li>
        </ul>
      </Section>
    </div>
  )
}

function AudioContent() {
  return (
    <div className="space-y-6">
      <Section title="Microphone Input">
        <div className="text-xs text-gray-400 space-y-2">
          <p>Click the <strong className="text-gray-200">microphone icon</strong> in the transport bar to start mic input. Three animated bars (bass / mid / high) and a white beat dot appear. Audio is analysed at 60 fps via Web Audio API FFT and fed to all running shader uniforms.</p>
          <p>The Audio Settings gear (next to the mic icon) controls <strong className="text-gray-200">Sensitivity</strong>, <strong className="text-gray-200">Smoothing</strong>, and <strong className="text-gray-200">Beat threshold</strong>.</p>
        </div>
      </Section>

      <Section title="Audio Settings">
        <div className="space-y-2 text-xs text-gray-400">
          {[
            ['Sensitivity',      'Multiplies all band values — raise for quiet mics or line-level input'],
            ['Smoothing',        '0–0.99: higher = averaged/stable, lower = fast/reactive. Good default: 0.8'],
            ['Beat threshold',   'Bass level required to trigger a beat pulse. Lower = more triggers. Try 0.2–0.4 for drums'],
          ].map(([name, desc]) => (
            <div key={name} className="flex gap-3">
              <span className="text-gray-200 w-32 flex-shrink-0">{name}</span>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="BPM Tap Tempo">
        <div className="text-xs text-gray-400 space-y-2">
          <p>Click <strong className="text-gray-200">TAP</strong> in the transport bar to the beat. After two taps, OpenVJ calculates the average interval of the last 8 taps (within an 8-second window). The resulting BPM is:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Shown next to the TAP button</li>
            <li>Stored in <Mono>uBpm</Mono> and sent to every shader as a uniform every frame</li>
            <li>Used for BPM-sync effects without needing microphone access</li>
          </ul>
          <p>Click the <strong className="text-gray-200">×</strong> next to the BPM display to reset.</p>
        </div>
      </Section>

      <Section title="Audio-Reactive Shader Example">
        <pre className="bg-gray-950 rounded-lg p-3 font-mono text-xs text-green-300 leading-relaxed border border-gray-800">{`void main() {
  vec2 uv = gl_FragCoord.xy / uResolution - 0.5;
  float r = length(uv);

  // Ring that expands on each beat
  float ring = sin(r * 20.0 - uTime * 5.0 - uBeat * 8.0);
  float glow = exp(-r * (2.0 + uAudioLow * 6.0));

  vec3 col = vec3(uAudioLow, uAudioMid * 0.5, uAudioHigh);
  gl_FragColor = vec4(col * ring * glow, 1.0);
}`}</pre>
      </Section>

      <Section title="Tips">
        <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside">
          <li>Start with the built-in <strong className="text-gray-200">Audio Pulse</strong> or <strong className="text-gray-200">Frequency Wave</strong> shaders — pre-wired to all audio uniforms</li>
          <li>Use <Mono>uBeat</Mono> for punch/flash effects — resets to 1.0 on each kick then decays</li>
          <li>Combine <strong className="text-gray-200">Add</strong> blend mode with audio shaders for layered light effects</li>
          <li>Lower smoothing for live drums; raise it for ambient or drone music</li>
          <li>The live waveform bars in the transport reflect <Mono>uAudioLow / uAudioMid / uAudioHigh</Mono> in real time</li>
        </ul>
      </Section>
    </div>
  )
}

function MidiContent() {
  return (
    <div className="space-y-6">
      <Section title="Getting Started">
        <div className="text-xs text-gray-400 space-y-2">
          <p>Click the <strong className="text-gray-200">piano icon</strong> in the transport bar to request Web MIDI access. Once granted, OpenVJ connects to all detected MIDI inputs (USB controllers, virtual ports) and hot-plugs new devices automatically.</p>
          <p>Click the <strong className="text-gray-200">gear icon</strong> next to it to open the binding panel. A violet dot next to the piano icon indicates MIDI is active.</p>
        </div>
      </Section>

      <Section title="Default Bindings (Channel 1, CC 1–8)">
        <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs space-y-1 border border-gray-800">
          {[
            ['CC 1', 'Opacity'],
            ['CC 2', 'Brightness'],
            ['CC 3', 'Contrast'],
            ['CC 4', 'Hue'],
            ['CC 5', 'Saturation'],
            ['CC 6', 'Zoom'],
            ['CC 7', 'Warp amplitude'],
            ['CC 8', 'Chromatic aberration'],
          ].map(([cc, target]) => (
            <div key={cc} className="flex gap-4">
              <span className="text-violet-400 w-16 flex-shrink-0">{cc}</span>
              <span className="text-gray-400">{target}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-1">These match a typical 8-knob MIDI controller on CH1. All 11 targets are bindable.</p>
      </Section>

      <Section title="MIDI Learn">
        <ol className="text-xs text-gray-400 space-y-2 list-decimal list-inside">
          <li>Open the binding panel (gear icon)</li>
          <li>Click <strong className="text-gray-200">learn</strong> on the row you want to bind — the button flashes "listening…"</li>
          <li>Move any knob, fader, or mod wheel on your controller</li>
          <li>The binding is saved immediately: channel + CC number are stored</li>
          <li>Click <strong className="text-gray-200">learn</strong> again (or anywhere else) to cancel without saving</li>
        </ol>
      </Section>

      <Section title="How CC Values Are Applied">
        <div className="text-xs text-gray-400 space-y-2">
          <p>CC values (0–127) are normalised to 0–1, then scaled to each prop's range:</p>
          <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs space-y-1 border border-gray-800">
            {[
              ['opacity',    '0 → 1'],
              ['brightness', '–0.5 → +0.5'],
              ['hue',        '–180° → +180°'],
              ['saturation', '0 (grey) → 2 (vivid)'],
              ['zoom',       '0.25× → 4×'],
              ['warpAmp',    '0 → 0.15'],
            ].map(([prop, range]) => (
              <div key={prop} className="flex gap-4">
                <span className="text-violet-400 w-28 flex-shrink-0">{prop}</span>
                <span className="text-gray-400">{range}</span>
              </div>
            ))}
          </div>
          <p>CC messages apply to the <strong className="text-gray-200">currently selected surface</strong> only. Select a different surface and the same knobs control that one.</p>
        </div>
      </Section>

      <Section title="Tips">
        <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside">
          <li>Use <strong className="text-gray-200">Reset defaults</strong> in the panel footer to restore the 8-knob mapping after clearing</li>
          <li>MIDI bindings are persisted across sessions (stored in localStorage)</li>
          <li>Works with any class-compliant USB MIDI device — no drivers needed in Chrome</li>
          <li>Combine MIDI CC control with BPM tap for fully hardware-driven sets</li>
          <li>Web MIDI requires Chrome/Edge — Firefox and Safari are not supported</li>
        </ul>
      </Section>
    </div>
  )
}

function P5JsContent() {
  return (
    <div className="space-y-6">
      <Section title="Quick Start">
        <ol className="space-y-2 text-xs text-gray-400 list-decimal list-inside">
          <li>Open the <strong className="text-gray-200">p5.js Creative Coding</strong> panel in the sidebar</li>
          <li>Click <strong className="text-gray-200">New Sketch</strong> or <strong className="text-gray-200">Templates</strong> to start from a preset</li>
          <li>Click the <strong className="text-gray-200">edit icon</strong> on a sketch to open the full code editor</li>
          <li>Write p5.js code — changes apply automatically (with debounce)</li>
          <li>Press <KbdKey>Ctrl+Enter</KbdKey> to force-run your code immediately</li>
          <li>Enable microphone (🎤 icon) to make sketches audio-reactive</li>
        </ol>
      </Section>

      <Section title="How to Apply p5.js to a Surface">
        <div className="text-xs text-gray-400 space-y-2">
          <p>p5.js sketches do <strong>not</strong> appear in the Media panel. Instead:</p>
          <ol className="space-y-1.5 list-decimal list-inside">
            <li>Create or select an existing <strong className="text-gray-200">surface</strong> in the Surfaces panel</li>
            <li>Toggle the p5.js sketch's <strong className="text-gray-200">play icon</strong> to start rendering</li>
            <li>The sketch automatically renders as a texture on the selected surface at its configured size</li>
            <li>Use the <strong className="text-gray-200">opacity slider</strong> and <strong className="text-gray-200">blend mode</strong> in the p5.js panel to layer effects</li>
            <li>Multiple sketches can run simultaneously — each appears on its assigned surface</li>
          </ol>
        </div>
      </Section>

      <Section title="OpenVJ Bridge API">
        <div className="text-xs text-gray-400 space-y-2">
          <p>Access OpenVJ's audio and MIDI data directly in your sketches via the <Mono>openvj</Mono> global object:</p>
        </div>
        <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs space-y-1 border border-gray-800 mt-3">
          {[
            ['openvj.audio.getLow()',   '0–255  Bass energy (20–300 Hz)'],
            ['openvj.audio.getMid()',   '0–255  Mid energy (300–4 kHz)'],
            ['openvj.audio.getHigh()',  '0–255  High energy (4–20 kHz)'],
            ['openvj.audio.getBeat()',  '0–1    Beat pulse, decays after kick'],
            ['openvj.audio.getBPM()',   'float  Detected tempo (0 = not set)'],
            ['openvj.midi.getCC(n)',    '0–1    MIDI CC value, n = 0-127'],
          ].map(([fn, desc]) => (
            <div key={fn} className="flex gap-3 items-baseline">
              <span className="text-pink-400 w-48 flex-shrink-0">{fn}</span>
              <span className="text-gray-500">{desc}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Audio-Reactive Sketch Example">
        <pre className="bg-gray-950 rounded-lg p-3 font-mono text-xs text-green-300 leading-relaxed overflow-x-auto border border-gray-800">{`function setup() {
  createCanvas(512, 512);
  colorMode(HSB);
}

function draw() {
  // Clear on beat
  if (openvj.audio.getBeat() > 0.5) {
    background(0);
  } else {
    background(0, 0, 10);
  }
  
  // Scale with bass
  const bass = openvj.audio.getLow() / 255;
  fill(200, 80, 100);
  noStroke();
  circle(width/2, height/2, 100 + bass * 200);
  
  // Rotate with MIDI
  translate(width/2, height/2);
  rotate(openvj.midi.getCC(1) * TWO_PI);
  stroke(255);
  line(0, 0, 100, 0);
}`}</pre>
      </Section>

      <Section title="Templates">
        <div className="space-y-2 text-xs text-gray-400">
          <p>Five built-in templates to jump-start your creativity:</p>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[
            ['Audio Waveform', 'Frequency bars visualization with audio-reactive coloring'],
            ['Particles', 'Particle system that responds to beat and bass'],
            ['Kaleidoscope', 'Mirror symmetry patterns with rotation control'],
            ['Neon Grid', 'Cyberpunk-style grid with scrolling effects'],
            ['Liquid Flow', 'Perlin noise fluid simulation'],
          ].map(([name, desc]) => (
            <div key={name} className="bg-gray-800/50 rounded p-2 border border-gray-700/50">
              <p className="text-gray-200 font-medium text-xs">{name}</p>
              <p className="text-gray-500 text-[10px]">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tips">
        <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside">
          <li>Start with a <strong className="text-gray-200">template</strong> then modify the code — faster than writing from scratch</li>
          <li>Use <Mono>colorMode(HSB)</Mono> for smoother color transitions with audio values</li>
          <li><Mono>ADD</Mono> blend mode is great for glowing/light effects with p5.js</li>
          <li>Keep particle counts under 500 for 60fps on most GPUs</li>
          <li>Use <Mono>push()</Mono>/<Mono>pop()</Mono> to save/restore the drawing state before transforms</li>
          <li>Sketches run independently in "instance mode" — no global p5 conflicts</li>
          <li>Export sketches as JSON to back them up or share with others</li>
        </ul>
      </Section>

      <Section title="Editor Shortcuts">
        <table className="w-full text-xs">
          <tbody>
            {[
              ['Ctrl+Enter', 'Force-run current code immediately'],
              ['Ctrl+S', 'Save (same as run)'],
              ['Tab', 'Insert 2 spaces'],
              ['Ctrl+/', 'Toggle comment (coming soon)'],
            ].map(([key, action]) => (
              <tr key={key} className="border-t border-gray-800 first:border-0">
                <td className="py-2 pr-6 whitespace-nowrap"><KbdKey>{key}</KbdKey></td>
                <td className="py-2 text-gray-400">{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

type Tab = 'Overview' | 'Controls' | 'Shaders' | 'p5.js' | 'Audio' | 'MIDI'
const TABS: Tab[] = ['Overview', 'Controls', 'Shaders', 'p5.js', 'Audio', 'MIDI']

interface HelpModalProps {
  onClose: () => void
}

export function HelpModal({ onClose }: HelpModalProps) {
  const [tab, setTab] = useState<Tab>('Overview')

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[84vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" />
              </svg>
            </div>
            <span className="font-semibold text-sm text-gray-100">OpenVJ Help</span>
            <span className="text-xs text-gray-600 font-mono">v0.5.0</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-0.5 px-6 pt-3 flex-shrink-0">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-xs rounded-t border-b-2 transition-colors cursor-pointer ${
                tab === t
                  ? 'text-gray-100 border-[#d4f542] bg-gray-800/60'
                  : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-800/30'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="h-px bg-gray-700 flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {tab === 'Overview' && <OverviewContent />}
          {tab === 'Controls' && <ControlsContent />}
          {tab === 'Shaders'  && <ShadersContent />}
          {tab === 'p5.js'    && <P5JsContent />}
          {tab === 'Audio'    && <AudioContent />}
          {tab === 'MIDI'     && <MidiContent />}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-700 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-gray-700">Open-source projection mapping · OpenVJ</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default HelpModal
