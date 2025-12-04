import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useMemo } from 'react'

function RoundedQuad({ pos, color, w=36, h=36, r=4, alpha=0.06 }: { pos: [number, number, number], color: string, w?: number, h?: number, r?: number, alpha?: number }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    const rr = Math.min(r, w/2, h/2)
    const x = -w/2, y = -h/2
    s.moveTo(x+rr, y)
    s.lineTo(x+w-rr, y)
    s.quadraticCurveTo(x+w, y, x+w, y+rr)
    s.lineTo(x+w, y+h-rr)
    s.quadraticCurveTo(x+w, y+h, x+w-rr, y+h)
    s.lineTo(x+rr, y+h)
    s.quadraticCurveTo(x, y+h, x, y+h-rr)
    s.lineTo(x, y+rr)
    s.quadraticCurveTo(x, y, x+rr, y)
    return s
  }, [w,h,r])
  return (
    <mesh rotation-x={-Math.PI/2} position={pos}>
      <shapeGeometry args={[shape]} />
      <meshBasicMaterial color={color} transparent opacity={alpha} />
    </mesh>
  )
}

export function Zones() {
  const size = 40
  return (
    <group>
      {/* Rounded quadrants with soft tints */}
      <RoundedQuad pos={[-size/2, 0.001,  size/2]} color="#16a34a" />
      <RoundedQuad pos={[ size/2, 0.001,  size/2]} color="#2563eb" />
      <RoundedQuad pos={[-size/2, 0.001, -size/2]} color="#b45309" />
      <RoundedQuad pos={[ size/2, 0.001, -size/2]} color="#a21caf" />

    </group>
  )
}
