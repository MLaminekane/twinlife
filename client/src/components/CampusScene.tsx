import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Text, Grid } from '@react-three/drei'
import { useRef, useMemo } from 'react'
import { useStore } from '../state/store'
import { PeoplePoints } from './PeoplePoints'
import { PeopleLabels } from './PeopleLabels'
import { Zones } from './Zones'
import { ActivityBars } from './ActivityBars'
import { Roads } from './Roads'
import { BuildingMesh } from './BuildingMesh'

export function CampusScene() {
  const buildings = useStore(s => s.buildings)
  const visible = useStore(s => s.settings.visibleBuildings)
  const labels = useStore(s => s.settings.labels)
  const tick = useStore(s => s.tick)
  const setHovered = useStore(s => s.setHoveredBuilding)

  // Animation loop ticks simulation
  useFrame((_, dt) => tick(Math.min(0.05, dt)))

  return (
    <group>
      {/* Ground */}
      <mesh rotation-x={-Math.PI/2} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#0c121a" />
      </mesh>

      {/* Zone overlays and labels */}
      <Zones />

  {/* Subtle ground grid */}
  <Grid position={[0, 0.002, 0]} args={[80, 80]} cellSize={2} cellThickness={0.4} sectionSize={10} sectionThickness={1} fadeDistance={40} fadeStrength={1} infiniteGrid />

  {/* Roads and names */}
      <Roads />

      {/* Buildings */}
      {buildings.filter(b => visible.has(b.id)).map((b) => (
        <group
          key={b.id}
          position={[b.position[0], 0, b.position[2]]}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(b.id) }}
          onPointerOut={(e) => { e.stopPropagation(); setHovered(null) }}
        >
          <BuildingMesh building={b} />
          {labels && (
            <Text position={[0, b.size[1] + 0.6, 0]} fontSize={0.6} color="#cbd5e1" anchorX="center" anchorY="middle">
              {b.name}
            </Text>
          )}
        </group>
      ))}

      {/* Activity bars under buildings */}
      <ActivityBars />

      {/* People */}
      <PeoplePoints />
      <PeopleLabels />
    </group>
  )
}
