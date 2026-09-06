import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../state/store'
import { BuildingMesh } from './BuildingMesh'
import { EnvironmentDetails } from './EnvironmentDetails'
import { Roads } from './Roads'
import { CityTraffic } from './CityTraffic'
import { CityPeople } from './CityPeople'
import { ZONE_COLORS } from './MiniMap'

const DISTRICTS = [
  { id: 'campus', name: 'CAMPUS UNIVERSITAIRE', position: [-20, 0.3, 34] },
  { id: 'downtown', name: 'CENTRE-VILLE', position: [17, 0.3, 36] },
  {
    id: 'residential',
    name: 'QUARTIER RÉSIDENTIEL',
    position: [-21, 0.3, -34],
  },
  { id: 'commercial', name: 'QUARTIER COMMERCIAL', position: [17, 0.3, -28] },
] as const
export function CampusScene({
  layer = 'standard',
}: {
  layer?: 'standard' | 'activity' | 'mobility'
}) {
  const buildings = useStore((s) => s.buildings)
  const visible = useStore((s) => s.settings.visibleBuildings)
  const labels = useStore((s) => s.settings.labels)
  const selected = useStore((s) => s.selectedBuildingId)
  const hovered = useStore((s) => s.hoveredBuildingId)
  const snow = useStore((s) => s.environment.condition === 'snow')
  const accumulator = useRef(0)
  useFrame((_, dt) => {
    accumulator.current += Math.min(dt, 0.15)
    if (accumulator.current >= 0.05) {
      const elapsed = accumulator.current
      accumulator.current = 0
      useStore.getState().tick(elapsed)
    }
  })
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.075, 0]} receiveShadow>
        <planeGeometry args={[250, 250]} />
        <meshStandardMaterial
          color={snow ? '#ccd4c6' : '#91a08a'}
          roughness={1}
        />
      </mesh>
      <mesh position={[0, -0.11, 0]} receiveShadow>
        <boxGeometry args={[89, 0.17, 85]} />
        <meshStandardMaterial
          color={snow ? '#dce0d5' : '#a3ad95'}
          roughness={0.97}
        />
      </mesh>
      <Roads mobility={layer === 'mobility'} />
      <EnvironmentDetails />
      {buildings
        .filter((b) => visible.has(b.id))
        .map((b) => (
          <group
            key={b.id}
            position={[b.position[0], 0, b.position[2]]}
            onPointerOver={(e) => {
              e.stopPropagation()
              useStore.getState().setHoveredBuilding(b.id)
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              useStore.getState().setHoveredBuilding(null)
              document.body.style.cursor = ''
            }}
            onClick={(e) => {
              e.stopPropagation()
              useStore.getState().setSelectedPerson(null)
              useStore.getState().setSelectedBuilding(b.id)
            }}
          >
            <BuildingMesh building={b} />
            {layer === 'activity' && (
              <mesh
                position={[0, b.size[1] + 0.39, 0]}
                rotation-x={-Math.PI / 2}
              >
                <planeGeometry args={[b.size[0], b.size[2]]} />
                <meshBasicMaterial
                  color={new THREE.Color().setHSL(
                    0.36 - b.activity * 0.35,
                    0.65,
                    0.56,
                  )}
                  transparent
                  opacity={0.68}
                  depthWrite={false}
                />
              </mesh>
            )}
            {(b.id === selected || b.id === hovered) && (
              <>
                <mesh position={[0, 0.1, 0]} rotation-x={-Math.PI / 2}>
                  <ringGeometry
                    args={[
                      Math.max(b.size[0], b.size[2]) * 0.75,
                      Math.max(b.size[0], b.size[2]) * 0.75 + 0.08,
                      64,
                    ]}
                  />
                  <meshBasicMaterial
                    color="#dbffa9"
                    transparent
                    opacity={0.85}
                    depthWrite={false}
                  />
                </mesh>
                <Html
                  position={[0, b.size[1] + 1.8, 0]}
                  center
                  style={{ pointerEvents: 'none' }}
                >
                  <div className="city-building-tag">
                    <b>{b.name}</b>
                    <span>
                      {b.occupancy} personnes · {Math.round(b.activity * 100)} %
                      d’activité
                    </span>
                  </div>
                </Html>
              </>
            )}
          </group>
        ))}
      <CityTraffic mobility={layer === 'mobility'} />
      <CityPeople />
      {layer === 'mobility' && <MobilityRoutes />}
      {labels &&
        DISTRICTS.map((d) => (
          <Html
            key={d.id}
            position={[...d.position]}
            center
            distanceFactor={70}
            style={{ pointerEvents: 'none' }}
          >
            <span
              className="city-zone-tag"
              style={{ borderColor: ZONE_COLORS[d.id] + '88' }}
            >
              <i style={{ background: ZONE_COLORS[d.id] }} />
              {d.name}
            </span>
          </Html>
        ))}
    </group>
  )
}
function MobilityRoutes() {
  const people = useStore((s) => s.people)
  const geometry = useMemo(() => {
    const vertices: number[] = []
    for (const p of people
      .filter((p) => p.presence === 'walking')
      .slice(0, 100)) {
      let previous = p.position
      for (const next of (p.route ?? []).slice(p.routeIndex ?? 0)) {
        vertices.push(previous[0], 0.15, previous[2], next[0], 0.15, next[2])
        previous = next
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    return g
  }, [people])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color="#a9f2cf"
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </lineSegments>
  )
}
