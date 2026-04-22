import { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Asset } from '../stores/assetStore'
import { assetTextureManager } from '../lib/assetTextureManager'
import { depthTextureManager } from '../lib/depthTextureManager'
import { audioEngine } from '../lib/audioEngine'

interface DepthVoxelMeshProps {
  asset: Asset
  position?: THREE.Vector3
  scale?: number
  autoRotate?: boolean
}

export function DepthVoxelMesh({ 
  asset, 
  position = new THREE.Vector3(0, 0, 0),
  scale = 1,
  autoRotate = true 
}: DepthVoxelMeshProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Load depth texture on mount
  useEffect(() => {
    const sourceId = asset.depthSourceId
    if (!sourceId || isLoaded) return
    
    let isMounted = true
    
    const loadDepth = async () => {
      try {
        // First ensure source is loaded
        const sourceVideo = assetTextureManager.getMediaEl(sourceId)
        if (!sourceVideo) {
          return
        }
        
        // Load depth texture
        await depthTextureManager.loadDepthTexture(
          asset.id,
          sourceVideo,
          asset.depthConfig
        )
        
        if (isMounted) {
          setIsLoaded(true)
        }
      } catch (_err) {
        // Silently handle errors
      }
    }
    
    loadDepth()
    
    return () => {
      isMounted = false
    }
  }, [asset.id, asset.depthSourceId, asset.depthConfig, isLoaded])

  // Update mesh position and rotation
  useFrame(() => {
    if (!pointsRef.current) return
    
    // Get the voxel mesh from depth texture manager
    const mesh = depthTextureManager.getVoxelMesh(asset.id)
    if (!mesh) return
    
    // Sync transform
    mesh.position.copy(position)
    mesh.scale.setScalar(scale * 0.5) // Scale down a bit
    
    // Auto rotation
    if (autoRotate) {
      mesh.rotation.y += 0.005
    }
    
    // Update audio uniforms
    const material = mesh.material as THREE.ShaderMaterial
    if (material && material.uniforms) {
      material.uniforms.uAudioLow.value = audioEngine.low
      material.uniforms.uAudioMid.value = audioEngine.mid
      material.uniforms.uAudioHigh.value = audioEngine.high
      material.uniforms.uBeat.value = audioEngine.beat
    }
  })

  // Return the voxel mesh as a primitive
  const mesh = depthTextureManager.getVoxelMesh(asset.id)
  if (!mesh || asset.depthConfig === undefined) return null
  
  return (
    <primitive 
      object={mesh} 
      ref={pointsRef}
      position={position}
      scale={scale * 0.5}
    />
  )
}

// Alternative: Simple depth visualization using the depth texture
interface DepthTextureMeshProps {
  asset: Asset
  surfaceCorners: Array<{ x: number; y: number }>
}

export function DepthTextureMesh({ asset, surfaceCorners }: DepthTextureMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  
  useEffect(() => {
    const sourceId = asset.depthSourceId
    if (!sourceId) return
    
    let isMounted = true
    
    const loadTexture = async () => {
      const sourceVideo = assetTextureManager.getMediaEl(sourceId)
      if (!sourceVideo) return
      
      const tex = await depthTextureManager.loadDepthTexture(
        asset.id,
        sourceVideo,
        asset.depthConfig
      )
      
      if (isMounted && tex) {
        setTexture(tex)
      }
    }
    
    loadTexture()
    
    return () => {
      isMounted = false
    }
  }, [asset])

  // Build surface geometry from corners
  const geometry = useMemo(() => {
    if (surfaceCorners.length < 3) return null
    
    const positions: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    
    const N = surfaceCorners.length
    const cx = surfaceCorners.reduce((s, c) => s + c.x, 0) / N
    const cy = surfaceCorners.reduce((s, c) => s + c.y, 0) / N
    
    // Add corner vertices
    for (let i = 0; i < N; i++) {
      const c = surfaceCorners[i]
      positions.push(c.x, c.y, 0)
      uvs.push(i / N, 0.5)
    }
    
    // Centroid
    positions.push(cx, cy, 0)
    uvs.push(0.5, 0.5)
    
    // Fan triangles
    for (let i = 0; i < N; i++) {
      indices.push(N, i, (i + 1) % N)
    }
    
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geo.setIndex(indices)
    geo.computeVertexNormals()
    return geo
  }, [surfaceCorners])

  // Safely check if depth config exists and is enabled
  const isEnabled = asset.depthConfig !== undefined;
  
  if (!geometry || !texture || !isEnabled) return null
  
  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial 
        map={texture} 
        transparent 
        opacity={0.9}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
