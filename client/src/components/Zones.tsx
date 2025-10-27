import { Text } from '@react-three/drei'

export function Zones() {
  const size = 40
  const alpha = 0.04
  return (
    <group>
      {/* Quadrants */}
      <mesh rotation-x={-Math.PI/2} position={[-size/2, 0.001, size/2]}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial color="#166534" transparent opacity={alpha} />
      </mesh>
      <mesh rotation-x={-Math.PI/2} position={[ size/2, 0.001, size/2]}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial color="#1e3a8a" transparent opacity={alpha} />
      </mesh>
      <mesh rotation-x={-Math.PI/2} position={[-size/2, 0.001, -size/2]}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial color="#78350f" transparent opacity={alpha} />
      </mesh>
      <mesh rotation-x={-Math.PI/2} position={[ size/2, 0.001, -size/2]}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial color="#701a75" transparent opacity={alpha} />
      </mesh>

      {/* Labels */}
      <Text position={[-size/2, 0.01, size/2]} fontSize={1.2} color="#9ca3af" anchorX="center" anchorY="middle">Université</Text>
      <Text position={[ size/2, 0.01, size/2]} fontSize={1.2} color="#9ca3af" anchorX="center" anchorY="middle">Logement étudiant</Text>
      <Text position={[-size/2, 0.01, -size/2]} fontSize={1.2} color="#9ca3af" anchorX="center" anchorY="middle">Centre-ville</Text>
      <Text position={[ size/2, 0.01, -size/2]} fontSize={1.2} color="#9ca3af" anchorX="center" anchorY="middle">Place du Royaume</Text>
    </group>
  )
}
