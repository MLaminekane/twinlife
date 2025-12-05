import * as THREE from 'three'
import { useMemo, useRef, useState } from 'react'
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber'
import { Building, useStore } from '../state/store'

export function BuildingMesh({ building, onClick }: { 
  building: Building
  onClick?: (e: ThreeEvent<MouseEvent>) => void
}) {
  const shadows = useStore(s => s.settings.shadows)
  const { camera } = useThree()
  const [lod, setLod] = useState(0)
  const groupRef = useRef<THREE.Group>(null)

  const isEco = building.id === 'bus'
  const color = useMemo(() => new THREE.Color(isEco ? '#0f172a' : '#1e293b'), [isEco])
  const emissive = useMemo(() => new THREE.Color(isEco ? '#10b981' : '#60a5fa'), [isEco])

  // LOD 0: Detailed windows (individual meshes)
  const windowsDetailed = useMemo(() => {
    const planes: { pos: [number, number, number], vis: number }[] = []
    const [sx, sy, sz] = building.size
    const cols = Math.max(3, Math.floor(sx * 2))
    const rows = Math.max(3, Math.floor((sy) * 2))
    for (let side = 0; side < 2; side++) {
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = -sx / 2 + (i + 0.5) * (sx / cols)
          const y = (j + 0.5) * (sy / rows) - sy / 2 + 0.3
          const z = side === 0 ? sz / 2 + 0.01 : -sz / 2 - 0.01
          planes.push({ pos: [x, y, z], vis: Math.random() })
        }
      }
    }
    return planes
  }, [building.size])

  // LOD 1: Simplified windows (fewer, larger quads)
  const windowsSimplified = useMemo(() => {
    const planes: { pos: [number, number, number] }[] = []
    const [sx, sy, sz] = building.size
    const cols = Math.max(2, Math.floor(sx))
    const rows = Math.max(2, Math.floor(sy))
    for (let side = 0; side < 2; side++) {
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = -sx / 2 + (i + 0.5) * (sx / cols)
          const y = (j + 0.5) * (sy / rows) - sy / 2 + 0.3
          const z = side === 0 ? sz / 2 + 0.01 : -sz / 2 - 0.01
          planes.push({ pos: [x, y, z] })
        }
      }
    }
    return planes
  }, [building.size])

  // Update LOD based on camera distance
  useFrame(() => {
    if (!groupRef.current) return

    const distance = camera.position.distanceTo(groupRef.current.position)

    // LOD thresholds
    if (distance < 25) {
      setLod(0) // Detailed
    } else if (distance < 50) {
      setLod(1) // Simplified
    } else {
      setLod(2) // Minimal
    }

    // Flicker windows for LOD 0 (detailed)
    if (lod === 0) {
      const act = building.activity
      for (const w of windowsDetailed) {
        if (Math.random() < 0.02 + act * 0.08) {
          w.vis = Math.random() < (0.2 + act * 0.7) ? 1 : 0
        }
      }
    }
  })

  return (
    <group ref={groupRef}>
      {/* Main building box */}
      <mesh 
        castShadow={shadows} 
        receiveShadow 
        position={[0, building.size[1] / 2, 0]}
        onClick={onClick}
      >
        <boxGeometry args={building.size} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* LOD 0: Detailed individual windows */}
      {lod === 0 && windowsDetailed.map((w, idx) => (
        <mesh key={idx} position={[w.pos[0], w.pos[1] + building.size[1] / 2, w.pos[2]]}>
          <planeGeometry args={[0.25, 0.18]} />
          <meshBasicMaterial color={emissive} transparent opacity={0.85 * w.vis} />
        </mesh>
      ))}

      {/* LOD 1: Simplified larger windows */}
      {lod === 1 && windowsSimplified.map((w, idx) => (
        <mesh key={idx} position={[w.pos[0], w.pos[1] + building.size[1] / 2, w.pos[2]]}>
          <planeGeometry args={[0.5, 0.4]} />
          <meshBasicMaterial
            color={emissive}
            transparent
            opacity={0.6 * (0.3 + building.activity * 0.7)}
          />
        </mesh>
      ))}

      {/* LOD 2: No windows, just emissive building */}
      {lod === 2 && (
        <mesh position={[0, building.size[1] / 2, 0]}>
          <boxGeometry args={building.size} />
          <meshStandardMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={building.activity * 0.3}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      )}
      {/* Special Wall Street Ticker Strip for Eco Building */}
      {isEco && (
        <mesh position={[0, building.size[1] - 0.5, 0]}>
          <boxGeometry args={[building.size[0] + 0.2, 0.4, building.size[2] + 0.2]} />
          <meshStandardMaterial color="#064e3b" emissive="#10b981" emissiveIntensity={0.8} />
        </mesh>
      )}

    </group>
  )
}


