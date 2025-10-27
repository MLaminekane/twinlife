import * as THREE from 'three'
import { useStore } from '../state/store'

export function ActivityBars() {
  const buildings = useStore(s => s.buildings)
  return (
    <group>
      {buildings.map((b) => {
        const height = 0.2 + b.activity * 2.0
        return (
          <mesh key={b.id} position={[b.position[0], height/2, b.position[2] + b.size[2]/2 + 0.4]}>
            <boxGeometry args={[Math.max(0.4, b.size[0]/2), height, 0.2]} />
            <meshStandardMaterial color={'#38bdf8'} emissive={'#0ea5e9'} emissiveIntensity={0.6} />
          </mesh>
        )
      })}
    </group>
  )
}
