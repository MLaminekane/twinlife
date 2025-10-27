import { Text } from '@react-three/drei'

export function Roads() {
	return (
		<group>
			{/* Main avenue along X axis */}
			<mesh rotation-x={-Math.PI/2} position={[0, 0.0005, -2]}>
				<planeGeometry args={[80, 2.2]} />
				<meshStandardMaterial color="#0b1220" />
			</mesh>
			<Text position={[0, 0.01, -2]} fontSize={0.9} color="#cbd5e1" anchorX="center" anchorY="middle" rotation-x={-Math.PI/2}>
				Avenue Principale
			</Text>
			{/* West alley along Z axis */}
			<mesh rotation-x={-Math.PI/2} rotation-z={Math.PI/2} position={[-6, 0.0005, 0]}>
				<planeGeometry args={[80, 1.6]} />
				<meshStandardMaterial color="#0b1220" />
			</mesh>
			<Text position={[-6, 0.01, 0]} fontSize={0.7} color="#cbd5e1" anchorX="center" anchorY="middle" rotation-x={-Math.PI/2}>
				Allée Ouest
			</Text>
		</group>
	)
}

