import { Text } from '@react-three/drei'
import { useMemo } from 'react'

function RoadSegment({ 
  length, 
  width, 
  position, 
  rotation = 0, 
  name 
}: { 
  length: number, 
  width: number, 
  position: [number, number, number], 
  rotation?: number,
  name?: string 
}) {
  const markingsCount = Math.floor(length / 2)
  
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Asphalt */}
      <mesh rotation-x={-Math.PI/2} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[length, width]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Sidewalks */}
      <mesh rotation-x={-Math.PI/2} position={[0, 0.002, width/2 + 0.2]}>
        <planeGeometry args={[length, 0.4]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>
      <mesh rotation-x={-Math.PI/2} position={[0, 0.002, -width/2 - 0.2]}>
        <planeGeometry args={[length, 0.4]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>

      {/* Dashed Line Markings */}
      {Array.from({ length: markingsCount }).map((_, i) => (
        <mesh 
          key={i} 
          rotation-x={-Math.PI/2} 
          position={[-length/2 + 1 + i * 2, 0.003, 0]}
        >
          <planeGeometry args={[1, 0.1]} />
          <meshStandardMaterial color="#ffffff" opacity={0.6} transparent />
        </mesh>
      ))}

      {/* Road Name */}
      {name && (
        <Text 
          position={[0, 0.02, 0]} 
          fontSize={width * 0.4} 
          color="#94a3b8" 
          anchorX="center" 
          anchorY="middle" 
          rotation-x={-Math.PI/2}
          fillOpacity={0.5}
        >
          {name}
        </Text>
      )}
    </group>
  )
}

export function Roads() {
	return (
		<group>
			{/* Main Avenue (East-West) */}
			<RoadSegment 
        length={80} 
        width={2.5} 
        position={[0, 0, -2]} 
        name="Avenue Principale" 
      />

			{/* West Alley (North-South) */}
			<RoadSegment 
        length={80} 
        width={1.8} 
        position={[-6, 0, 0]} 
        rotation={Math.PI/2} 
        name="Allée Ouest" 
      />

      {/* East Loop (North-South) */}
      <RoadSegment 
        length={60} 
        width={1.8} 
        position={[15, 0, 0]} 
        rotation={Math.PI/2} 
        name="Promenade Est" 
      />

      {/* North Connector */}
      <RoadSegment 
        length={25} 
        width={1.5} 
        position={[4.5, 0, -15]} 
        name="Chemin Nord" 
      />
		</group>
	)
}

