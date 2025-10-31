import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../state/store'

export function PeoplePoints() {
  const people = useStore(s => s.people)
  const glow = useStore(s => s.settings.glow)

  const positions = useMemo(() => new Float32Array(people.length * 3), [people.length])
  const ref = useRef<THREE.Points>(null)

  useFrame(() => {
    for (let i = 0; i < people.length; i++) {
      const p = people[i]
      positions[i*3+0] = p.position[0]
      positions[i*3+1] = p.position[1]
      positions[i*3+2] = p.position[2]
    }
    if (ref.current) {
      ;(ref.current.geometry as THREE.BufferGeometry).setAttribute('position', new THREE.BufferAttribute(positions, 3))
      ;(ref.current.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true
    }
  })

  const color = new THREE.Color('#60a5fa')

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.18} sizeAttenuation color={color} depthWrite={false} transparent opacity={glow ? 0.95 : 0.85} />
    </points>
  )
}
