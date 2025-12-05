import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Text, Grid } from '@react-three/drei'
import { useRef, useMemo } from 'react'
import { useStore } from '../state/store'
import { InstancedPeople } from './InstancedPeople'
import { PeopleLabels } from './PeopleLabels'
import { PeopleThoughts } from './PeopleThoughts'
import { Zones } from './Zones'
import { ActivityBars } from './ActivityBars'
import { Roads } from './Roads'
import { BuildingMesh } from './BuildingMesh'
import { DepartmentsOverlay } from './DepartmentsOverlay'
import { EnvironmentDetails } from './EnvironmentDetails'

export function CampusScene() {
  const buildings = useStore(s => s.buildings)
  const visible = useStore(s => s.settings.visibleBuildings)
  const labels = useStore(s => s.settings.labels)
  const tick = useStore(s => s.tick)
  const setHovered = useStore(s => s.setHoveredBuilding)
  const setSelectedBuilding = useStore(s => s.setSelectedBuilding)
  const hoveredId = useStore(s => s.hoveredBuildingId)
  const selectedBuildingId = useStore(s => s.selectedBuildingId)

  // Animation loop ticks simulation
  useFrame((_, dt) => tick(Math.min(0.05, dt)))

  return (
    <group>
      {/* Ground */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#0c121a" />
      </mesh>

      {/* Zone overlays and labels */}
      <Zones />

      {/* Subtle ground grid */}
      <Grid position={[0, 0.002, 0]} args={[80, 80]} cellSize={2} cellThickness={0.4} sectionSize={10} sectionThickness={1} fadeDistance={40} fadeStrength={1} infiniteGrid />

      {/* Roads and names */}
      <Roads />
      
      {/* Trees, lamps, etc. */}
      <EnvironmentDetails />

      {/* Departments interactions overlay */}
      <DepartmentsOverlay />

      {/* Buildings */}
      {buildings.filter(b => visible.has(b.id)).map((b) => (
        <group
          key={b.id}
          position={[b.position[0], 0, b.position[2]]}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(b.id) }}
          onPointerOut={(e) => { e.stopPropagation(); setHovered(null) }}
          onClick={(e) => { e.stopPropagation(); setSelectedBuilding(b.id) }}
        >
          <BuildingMesh building={b} />
          {labels && (
            <Text position={[0, b.size[1] + 0.6, 0]} fontSize={0.6} color="#cbd5e1" anchorX="center" anchorY="middle">
              {b.name}
            </Text>
          )}
        </group>
      ))}

      {/* Hover highlight ring for the active building (from 3D or Map) */}
      {hoveredId && (() => {
        const hb = buildings.find(bb => bb.id === hoveredId)
        if (!hb) return null
        const r = Math.max(hb.size[0], hb.size[2]) * 0.75
        return (
          <mesh position={[hb.position[0], 0.02, hb.position[2]]} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[Math.max(0.1, r * 0.9), r, 48]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
          </mesh>
        )
      })()}

      {/* Activity bars under buildings */}
      <ActivityBars />

      {/* People */}
      <InstancedPeople />
      <PeopleThoughts />
      <PeopleLabels />
    </group>
  )
}
