import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import { Surface as SurfaceType, useSurfaceStore } from '../stores/surfaceStore'
import { ProjectedMaterial } from '../shaders/ProjectedMaterial'
import { useAssetStore, BUILTIN_ASSETS } from '../stores/assetStore'
import { assetTextureManager } from '../lib/assetTextureManager'
import { audioEngine } from '../lib/audioEngine'

// ─── Corner handle ───────────────────────────────────────────────────────────

interface CornerHandleProps {
  position: THREE.Vector3
  isHovered: boolean
  isLocked: boolean
  onDrag: (delta: THREE.Vector3) => void
  onHover: (hovered: boolean) => void
}

function CornerHandle({ position, isHovered, isLocked, onDrag, onHover }: CornerHandleProps) {
  const [isDragging, setIsDragging] = useState(false)
  // Ref so native event callbacks never go stale
  const isDraggingRef = useRef(false)
  const onDragRef = useRef(onDrag)
  useEffect(() => { onDragRef.current = onDrag })

  const { gl } = useThree()
  const { setDraggingCorner } = useSurfaceStore()

  // Attach native pointer handlers so drag works even when cursor leaves the sphere
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
  const size = isDragging || isHovered ? 0.13 : 0.09

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
      onPointerEnter={() => {
        if (!isLocked) onHover(true)
        gl.domElement.style.cursor = isLocked ? 'default' : 'grab'
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

// ─── Surface mesh ─────────────────────────────────────────────────────────────

interface SurfaceMeshProps {
  surface: SurfaceType
}

export function SurfaceMesh({ surface }: SurfaceMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { activeSurfaceId, setActiveSurface, updateCorner } = useSurfaceStore()
  const [hoveredHandle, setHoveredHandle] = useState<number | null>(null)
  const isActive = activeSurfaceId === surface.id

  const assets = useAssetStore((s) => s.assets)
  const asset = (assets.find((a) => a.id === surface.assetId) ?? BUILTIN_ASSETS.find((a) => a.id === surface.assetId)) ?? null

  // Shared plane geometry (created once)
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1, 32, 32), [])

  // Canvas fallback texture — shows surface name on a grid
  const canvasTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#1a2234'
    ctx.fillRect(0, 0, 256, 256)
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.3
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

  // Material — rebuilt when canvas texture or custom shader changes
  const material = useMemo(() => {
    const mat = new ProjectedMaterial({ transparent: true, side: THREE.DoubleSide, customShader })
    mat.setTexture(canvasTexture)
    return mat
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasTexture, customShader])

  // Load and apply asset texture whenever assetId or shader code changes
  useEffect(() => {
    if (!asset) {
      material.setTexture(canvasTexture)
      return
    }
    assetTextureManager.load(asset).then((tex) => {
      material.setTexture(tex ?? canvasTexture)
    })
  // shader code changes require a reload too
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surface.assetId, asset?.shaderCode, material, canvasTexture])

  // Apply blend mode when it changes
  useEffect(() => {
    material.setBlendMode(surface.blendMode ?? 'normal')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surface.blendMode, material])

  // Sync surface props to material every frame
  useFrame(() => {
    material.setCorners(surface.corners)
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
    material.setAudioLow(audioEngine.low ?? 0)
    material.setAudioMid(audioEngine.mid ?? 0)
    material.setAudioHigh(audioEngine.high ?? 0)
    material.setAudioBeat(audioEngine.beat ?? 0)
    material.setBpm(audioEngine.bpm ?? 0)
    material.tick(performance.now() / 1000)
  })

  const cornerPositions = useMemo(
    () => surface.corners.map((c) => new THREE.Vector3(c.x, c.y, 0.01)),
    [surface.corners]
  )

  if (!surface.visible) return null

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        onClick={(e) => { e.stopPropagation(); setActiveSurface(surface.id) }}
      />

      {isActive && !surface.locked &&
        cornerPositions.map((pos, i) => (
          <CornerHandle
            key={i}
            position={pos}
            isHovered={hoveredHandle === i}
            isLocked={surface.locked}
            onDrag={(d) => {
              const c = surface.corners[i]
              updateCorner(surface.id, i, { x: c.x + d.x, y: c.y + d.y })
            }}
            onHover={(h) => setHoveredHandle(h ? i : null)}
          />
        ))}

      {isActive && (
        <Html
          position={[surface.corners[0].x, surface.corners[0].y + 0.35, 0]}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div className="bg-blue-600/90 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded shadow-lg whitespace-nowrap font-medium">
            {surface.name}
          </div>
        </Html>
      )}

      {isActive && (
        <Line
          points={[
            [surface.corners[0].x, surface.corners[0].y, 0.005],
            [surface.corners[1].x, surface.corners[1].y, 0.005],
            [surface.corners[2].x, surface.corners[2].y, 0.005],
            [surface.corners[3].x, surface.corners[3].y, 0.005],
            [surface.corners[0].x, surface.corners[0].y, 0.005],
          ]}
          color="#3b82f6"
          lineWidth={1.5}
        />
      )}
    </group>
  )
}

export default SurfaceMesh
