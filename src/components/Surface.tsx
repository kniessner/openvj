import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import { Corner, Surface as SurfaceType, useSurfaceStore, defaultUVForIndex } from '../stores/surfaceStore'
import { ProjectedMaterial } from '../shaders/ProjectedMaterial'
import { useAssetStore, BUILTIN_ASSETS } from '../stores/assetStore'
import { assetTextureManager } from '../lib/assetTextureManager'
import { audioEngine } from '../lib/audioEngine'
import { useP5JsStore } from '../stores/p5jsStore'

// ─── Polygon geometry ─────────────────────────────────────────────────────────
// Fan-triangulation from centroid. UVs are either per-corner stored values or
// computed from the perimeter-distribution fallback for legacy saves.

function buildPolygonGeometry(corners: Corner[]): THREE.BufferGeometry {
  const N = corners.length
  const cx = corners.reduce((s, c) => s + c.x, 0) / N
  const cy = corners.reduce((s, c) => s + c.y, 0) / N

  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let i = 0; i < N; i++) {
    const c = corners[i]
    const def = defaultUVForIndex(i, N)
    positions.push(c.x, c.y, 0)
    uvs.push(c.u ?? def.u, c.v ?? def.v)
  }
  // Centroid vertex — UV is the average of all corner UVs
  let cu = 0, cv = 0
  for (let i = 0; i < N; i++) {
    const def = defaultUVForIndex(i, N)
    cu += corners[i].u ?? def.u
    cv += corners[i].v ?? def.v
  }
  positions.push(cx, cy, 0)
  uvs.push(cu / N, cv / N)

  // Fan triangles: centroid(N), corner[i], corner[(i+1)%N]
  for (let i = 0; i < N; i++) {
    indices.push(N, i, (i + 1) % N)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

// ─── Corner handle ────────────────────────────────────────────────────────────

interface CornerHandleProps {
  position: THREE.Vector3
  isHovered: boolean
  isLocked: boolean
  canRemove: boolean   // only when polygon has > 3 corners
  onDrag: (delta: THREE.Vector3) => void
  onHover: (hovered: boolean) => void
  onRemove: () => void
}

function CornerHandle({ position, isHovered, isLocked, canRemove, onDrag, onHover, onRemove }: CornerHandleProps) {
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  const onDragRef = useRef(onDrag)
  useEffect(() => { onDragRef.current = onDrag })

  const { gl } = useThree()
  const { setDraggingCorner } = useSurfaceStore()

  useEffect(() => {
    const canvas = gl.domElement
    const onMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return
      onDragRef.current(new THREE.Vector3(
        (e.movementX || 0) * 0.005,
        -(e.movementY || 0) * 0.005,
        0,
      ))
    }
    const onUp = (e: PointerEvent) => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      setIsDragging(false)
      setDraggingCorner(false)
      try { canvas.releasePointerCapture(e.pointerId) } catch { /* ignored */ }
      canvas.style.cursor = 'auto'
    }
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    return () => {
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
    }
  }, [gl, setDraggingCorner])

  const color = isLocked ? '#6b7280' : isDragging || isHovered ? '#60a5fa' : '#ef4444'
  const size  = isDragging || isHovered ? 0.13 : 0.09

  return (
    <mesh
      position={position}
      onPointerDown={(e) => {
        if (isLocked) return
        e.stopPropagation()
        isDraggingRef.current = true
        setIsDragging(true)
        setDraggingCorner(true)
        try { gl.domElement.setPointerCapture(e.nativeEvent.pointerId) } catch { /* ignored */ }
        gl.domElement.style.cursor = 'grabbing'
      }}
      onDoubleClick={(e) => {
        if (isLocked || !canRemove) return
        e.stopPropagation()
        onRemove()
      }}
      onPointerEnter={() => {
        if (!isLocked) onHover(true)
        gl.domElement.style.cursor = isLocked ? 'default' : canRemove ? 'pointer' : 'grab'
      }}
      onPointerLeave={() => {
        onHover(false)
        if (!isDraggingRef.current) gl.domElement.style.cursor = 'auto'
      }}
    >
      <sphereGeometry args={[size, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={isDragging ? 1 : 0.9} />
    </mesh>
  )
}

// ─── Edge midpoint handle (click to add a corner) ────────────────────────────

interface EdgeHandleProps {
  position: THREE.Vector3
  onClick: () => void
}

function EdgeHandle({ position, onClick }: EdgeHandleProps) {
  const [hovered, setHovered] = useState(false)
  const { gl } = useThree()
  return (
    <mesh
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      onPointerEnter={() => { setHovered(true); gl.domElement.style.cursor = 'copy' }}
      onPointerLeave={() => { setHovered(false); gl.domElement.style.cursor = 'auto' }}
    >
      <sphereGeometry args={[hovered ? 0.065 : 0.045, 12, 12]} />
      <meshBasicMaterial color="#60a5fa" transparent opacity={hovered ? 0.9 : 0.45} />
    </mesh>
  )
}

// ─── Surface mesh ─────────────────────────────────────────────────────────────

interface SurfaceMeshProps {
  surface: SurfaceType
  presentMode?: boolean
}

export function SurfaceMesh({ surface, presentMode = false }: SurfaceMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { activeSurfaceId, setActiveSurface, updateCorner, addCorner, removeCorner, isPresenting } = useSurfaceStore()
  const [hoveredHandle, setHoveredHandle] = useState<number | null>(null)
  const isActive = activeSurfaceId === surface.id

  const assets = useAssetStore((s) => s.assets)
  const asset = (assets.find((a) => a.id === surface.assetId) ?? BUILTIN_ASSETS.find((a) => a.id === surface.assetId)) ?? null

  // p5.js layer support - get layer if assetId matches a p5.js layer
  const p5Layers = useP5JsStore((s) => s.layers)
  const p5Sources = useP5JsStore((s) => s.sources)
  const getOrCreateSource = useP5JsStore((s) => s.getOrCreateSource)
  const p5Layer = p5Layers.find(l => l.id === surface.assetId)

  // Rebuild polygon geometry only when corners change
  const cornersKey = surface.corners.map(c => `${c.x.toFixed(4)},${c.y.toFixed(4)}`).join('|')
  const geometry = useMemo(
    () => buildPolygonGeometry(surface.corners),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cornersKey]
  )

  // Dispose old geometry on key change
  useEffect(() => () => geometry.dispose(), [geometry])

  // Canvas fallback texture — shows surface name on a grid
  const canvasTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256; canvas.height = 256
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#1a2234'
    ctx.fillRect(0, 0, 256, 256)
    ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 1; ctx.globalAlpha = 0.3
    for (let i = 0; i <= 4; i++) {
      const p = (i / 4) * 256
      ctx.beginPath()
      ctx.moveTo(p, 0); ctx.lineTo(p, 256)
      ctx.moveTo(0, p); ctx.lineTo(256, p)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3
    ctx.strokeRect(2, 2, 252, 252)
    ctx.fillStyle = '#60a5fa'
    ctx.font = 'bold 20px -apple-system, sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(surface.name, 128, 128)
    return new THREE.CanvasTexture(canvas)
  }, [surface.name])

  const customShader = surface.customShader ?? null

  const material = useMemo(() => {
    const mat = new ProjectedMaterial({ transparent: true, side: THREE.DoubleSide, customShader })
    mat.setTexture(canvasTexture)
    return mat
  }, [canvasTexture, customShader])

  useEffect(() => {
    // p5.js layer takes priority
    if (p5Layer) {
      const source = p5Sources.get(p5Layer.id)
      if (source) {
        material.setTexture(source.getTexture())
      } else {
        // Source missing after page reload — recreate it; store update re-triggers this effect
        getOrCreateSource(p5Layer.id)
      }
      return
    }
    // Regular asset
    if (!asset) { material.setTexture(canvasTexture); return }
    assetTextureManager.load(asset).then((tex) => {
      material.setTexture(tex ?? canvasTexture)
    })
  }, [asset, p5Layer, p5Sources, surface.assetId, material, canvasTexture, getOrCreateSource])

  useEffect(() => {
    material.setBlendMode(surface.blendMode ?? 'normal')
  }, [surface.blendMode, material])

  useFrame(() => {
    material.setOpacity(surface.opacity ?? 0.95)
    material.setBrightness(surface.brightness ?? 0)
    material.setContrast(surface.contrast ?? 0)
    material.setHue((surface.hue ?? 0) * Math.PI / 180)
    material.setSaturation(surface.saturation ?? 1)
    material.setInvert(surface.invert ?? false)
    material.setFlipH(surface.flipH ?? false)
    material.setFlipV(surface.flipV ?? false)
    material.setRotation((surface.rotation ?? 0) * Math.PI / 180)
    material.setZoom(surface.zoom ?? 1)
    material.setWarpAmp(surface.warpAmp ?? 0)
    material.setWarpFreq(surface.warpFreq ?? 5)
    material.setChromaAb(surface.chromaAb ?? 0)
    material.setPixelate(surface.pixelate ?? 0)
    material.setVignette(surface.vignette ?? 0)
    material.setChromaKey(surface.chromaKey ?? false)
    const cc = surface.chromaColor ?? [0, 1, 0]
    material.setChromaColor(cc[0], cc[1], cc[2])
    material.setChromaThreshold(surface.chromaThreshold ?? 0.3)
    material.setChromaSoftness(surface.chromaSoftness ?? 0.1)
    material.setMaskShape(surface.maskShape ?? 'none')
    material.setMaskSoftness(surface.maskSoftness ?? 0.02)
    material.setMaskInvert(surface.maskInvert ?? false)
    material.setEdgeBlendLeft(surface.edgeBlendLeft ?? 0)
    material.setEdgeBlendRight(surface.edgeBlendRight ?? 0)
    material.setEdgeBlendTop(surface.edgeBlendTop ?? 0)
    material.setEdgeBlendBottom(surface.edgeBlendBottom ?? 0)
    material.setAudioLow(audioEngine.low ?? 0)
    material.setAudioMid(audioEngine.mid ?? 0)
    material.setAudioHigh(audioEngine.high ?? 0)
    material.setAudioBeat(audioEngine.beat ?? 0)
    material.setBpm(audioEngine.bpm ?? 0)
    material.tick(performance.now() / 1000)
  })

  if (!surface.visible) return null

  const showHandles = isActive && !surface.locked && !presentMode && !isPresenting
  const N = surface.corners.length

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        onClick={(e) => { e.stopPropagation(); setActiveSurface(surface.id) }}
      />

      {/* Corner handles */}
      {showHandles && surface.corners.map((c, i) => (
        <CornerHandle
          key={i}
          position={new THREE.Vector3(c.x, c.y, 0.01)}
          isHovered={hoveredHandle === i}
          isLocked={surface.locked}
          canRemove={N > 3}
          onDrag={(d) => {
            updateCorner(surface.id, i, { x: c.x + d.x, y: c.y + d.y })
          }}
          onHover={(h) => setHoveredHandle(h ? i : null)}
          onRemove={() => removeCorner(surface.id, i)}
        />
      ))}

      {/* Edge midpoint handles — click to insert a corner */}
      {showHandles && surface.corners.map((c, i) => {
        const next = surface.corners[(i + 1) % N]
        return (
          <EdgeHandle
            key={`edge-${i}`}
            position={new THREE.Vector3((c.x + next.x) / 2, (c.y + next.y) / 2, 0.005)}
            onClick={() => addCorner(surface.id, i)}
          />
        )
      })}

      {/* Surface label */}
      {isActive && !presentMode && !isPresenting && (
        <Html
          position={[surface.corners[0].x, surface.corners[0].y + 0.35, 0]}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div className="bg-[#d4f542]/90 backdrop-blur-sm text-gray-900 text-xs px-2 py-0.5 rounded shadow-lg whitespace-nowrap font-medium">
            {surface.name}
            {N !== 4 && <span className="ml-1 opacity-60">{N}pt</span>}
          </div>
        </Html>
      )}

      {/* Selection outline */}
      {isActive && !presentMode && !isPresenting && (
        <Line
          points={[
            ...surface.corners.map(c => [c.x, c.y, 0.005] as [number, number, number]),
            [surface.corners[0].x, surface.corners[0].y, 0.005],
          ]}
          color="#d4f542"
          lineWidth={1.5}
        />
      )}
    </group>
  )
}

export default SurfaceMesh
