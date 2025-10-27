import { Text } from '@react-three/drei'

export function Roads() {
  return (
    <group>
      {/* Avenue Principale */}
      <mesh rotation-x={-Math.PI/2} position={[0, 0.001, 0]}>
        <planeGeometry args={[80, 2]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <Text position={[0, 0.05, 0]} rotation-x={-Math.PI/2} fontSize={1} color="#94a3b8" anchorX="center" anchorY="middle">
        Avenue Principale
      </Text>

      {/* Allée Ouest */}
      <mesh rotation-x={-Math.PI/2} position={[-10, 0.001, 0]}>
        <planeGeometry args={[2, 80]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <Text position={[-10, 0.05, 0]} rotation-x={-Math.PI/2} fontSize={0.8} color="#94a3b8" anchorX="center" anchorY="middle">
        Allée Ouest
      </Text>
    </group>
  )
}
