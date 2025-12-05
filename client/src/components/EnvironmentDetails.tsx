import { useMemo } from 'react'
import { Instance, Instances } from '@react-three/drei'
import * as THREE from 'three'

// Simple low-poly tree geometry
function TreeInstances({ count = 50, area = 40 }) {
  const trees = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * area * 2
      const z = (Math.random() - 0.5) * area * 2
      // Avoid placing trees on the main roads (approximate exclusion zones)
      if (Math.abs(z + 2) < 2 || Math.abs(x + 6) < 2) continue
      
      const scale = 0.5 + Math.random() * 0.5
      temp.push({ position: [x, 0, z], scale })
    }
    return temp
  }, [count, area])

  return (
    <group>
      {/* Trunks */}
      <Instances range={trees.length}>
        <cylinderGeometry args={[0.1, 0.15, 1, 6]} />
        <meshStandardMaterial color="#5c4033" />
        {trees.map((data, i) => (
          <Instance
            key={i}
            position={[data.position[0], 0.5 * data.scale, data.position[2]]}
            scale={[data.scale, data.scale, data.scale]}
          />
        ))}
      </Instances>

      {/* Foliage (Cone 1) */}
      <Instances range={trees.length}>
        <coneGeometry args={[0.8, 1.5, 7]} />
        <meshStandardMaterial color="#2d4c1e" />
        {trees.map((data, i) => (
          <Instance
            key={i}
            position={[data.position[0], 1.2 * data.scale, data.position[2]]}
            scale={[data.scale, data.scale, data.scale]}
          />
        ))}
      </Instances>
      
      {/* Foliage (Cone 2 - Top) */}
      <Instances range={trees.length}>
        <coneGeometry args={[0.6, 1.2, 7]} />
        <meshStandardMaterial color="#3a5f27" />
        {trees.map((data, i) => (
          <Instance
            key={i}
            position={[data.position[0], 1.8 * data.scale, data.position[2]]}
            scale={[data.scale, data.scale, data.scale]}
          />
        ))}
      </Instances>
    </group>
  )
}

function StreetLamps() {
  // Place lamps along the main avenue (z = -2)
  const lamps = useMemo(() => {
    const temp = []
    // Along X axis (Avenue Principale)
    for (let x = -35; x <= 35; x += 10) {
      temp.push({ x, z: -3.5, rot: 0 }) // Top side
      temp.push({ x, z: -0.5, rot: Math.PI }) // Bottom side
    }
    // Along Z axis (Allée Ouest, x = -6)
    for (let z = -35; z <= 35; z += 10) {
      if (Math.abs(z + 2) < 3) continue // Skip intersection
      temp.push({ x: -7.5, z, rot: -Math.PI/2 })
      temp.push({ x: -4.5, z, rot: Math.PI/2 })
    }
    return temp
  }, [])

  return (
    <group>
      {lamps.map((lamp, i) => (
        <group key={i} position={[lamp.x, 0, lamp.z]} rotation={[0, lamp.rot, 0]}>
          {/* Pole */}
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 3]} />
            <meshStandardMaterial color="#1a202c" />
          </mesh>
          {/* Arm */}
          <mesh position={[0, 2.8, 0.3]} rotation={[Math.PI/4, 0, 0]}>
            <boxGeometry args={[0.05, 0.05, 0.8]} />
            <meshStandardMaterial color="#1a202c" />
          </mesh>
          {/* Light Bulb */}
          <mesh position={[0, 2.6, 0.6]}>
            <sphereGeometry args={[0.15]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} toneMapped={false} />
            <pointLight intensity={1} distance={8} color="#fbbf24" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Benches() {
  const benches = useMemo(() => {
    const temp = []
    // Place benches near intersections or along paths
    temp.push({ x: 2, z: -4, rot: 0 })
    temp.push({ x: -2, z: -4, rot: 0 })
    temp.push({ x: -8, z: 2, rot: Math.PI/2 })
    temp.push({ x: -8, z: -6, rot: Math.PI/2 })
    return temp
  }, [])

  return (
    <group>
      {benches.map((b, i) => (
        <group key={i} position={[b.x, 0.2, b.z]} rotation={[0, b.rot, 0]}>
          {/* Seat */}
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[1.5, 0.1, 0.5]} />
            <meshStandardMaterial color="#854d0e" />
          </mesh>
          {/* Legs */}
          <mesh position={[-0.6, -0.1, 0]}>
            <boxGeometry args={[0.1, 0.4, 0.4]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0.6, -0.1, 0]}>
            <boxGeometry args={[0.1, 0.4, 0.4]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function EnvironmentDetails() {
  return (
    <group>
      <TreeInstances count={80} />
      <StreetLamps />
      <Benches />
    </group>
  )
}
