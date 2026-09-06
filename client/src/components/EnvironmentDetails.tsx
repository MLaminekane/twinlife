import { useMemo } from 'react'
import * as THREE from 'three'
import { useStore } from '../state/store'
import { CityInstances, type CityInstance } from './CityInstances'
import {
  CITY_ROADS,
  nightAmount,
  overlapsBuilding,
  overlapsRoad,
  seededCityRandom,
} from './cityLayout'

export function EnvironmentDetails() {
  const season = useStore((s) => s.environment.season)
  const snow = useStore((s) => s.environment.condition === 'snow')
  const night = useStore(
    (s) => Math.round(nightAmount(s.environment.gameTime) * 5) / 5,
  )
  const shadows = useStore((s) => s.settings.shadows)
  const layoutKey = useStore((s) =>
    s.buildings.map((b) => `${b.id}:${b.position}:${b.size}`).join('|'),
  )
  const landscape = useMemo(() => {
    const buildings = useStore.getState().buildings
    const random = seededCityRandom(4701)
    const trunks: CityInstance[] = [],
      crowns: CityInstance[] = [],
      shrubs: CityInstance[] = []
    const poles: CityInstance[] = [],
      fixtures: CityInstance[] = [],
      seats: CityInstance[] = []
    const greens = snow
      ? ['#bcc9b6', '#d0d9c5', '#a5b5a2']
      : season === 'automne'
        ? ['#859363', '#b5a065', '#aa8551', '#73875d', '#b1a574']
        : season === 'hiver'
          ? ['#6d8069', '#758a6c', '#839174']
          : ['#719160', '#809c65', '#64845b', '#8d9e6b']
    for (let i = 0; i < 900; i++) {
      const x = (random() - 0.5) * 88
      const z = (random() - 0.5) * 82
      if (overlapsBuilding(x, z, buildings, 1.1) || overlapsRoad(x, z, 1.0))
        continue
      if (
        trunks.some(
          (t) => Math.hypot(t.position[0] - x, t.position[2] - z) < 2.0,
        )
      )
        continue
      const scale = 0.75 + random() * 0.75
      const color = greens[Math.floor(random() * greens.length)]
      trunks.push({
        position: [x, 0.63 * scale, z],
        scale: [0.075 * scale, 1.27 * scale, 0.075 * scale],
        color: '#766451',
      })
      crowns.push({
        position: [x, 1.65 * scale, z],
        scale: [0.69 * scale, 0.84 * scale, 0.66 * scale],
        color,
      })
      crowns.push({
        position: [x + 0.23 * scale, 1.42 * scale, z - 0.13 * scale],
        scale: [0.61 * scale, 0.58 * scale, 0.63 * scale],
        color,
      })
      if (random() > 0.45)
        shrubs.push({
          position: [x + 0.5, 0.19, z - 0.25],
          scale: [0.37, 0.27, 0.4],
          color: greens[0],
        })
    }
    CITY_ROADS.forEach((road, roadIndex) => {
      for (
        let along = -road.length / 2 + 3;
        along < road.length / 2 - 2;
        along += 7.5
      ) {
        const side = roadIndex % 2 ? 1 : -1
        const x =
          road.x + (road.vertical ? side * (road.width / 2 + 0.43) : along)
        const z =
          road.z + (road.vertical ? along : side * (road.width / 2 + 0.43))
        if (overlapsBuilding(x, z, buildings, 0.65)) continue
        poles.push({ position: [x, 1.13, z], scale: [0.045, 2.25, 0.045] })
        const dx = road.vertical ? -side * 0.22 : 0
        const dz = road.vertical ? 0 : -side * 0.22
        fixtures.push({
          position: [x + dx, 2.26, z + dz],
          scale: road.vertical ? [0.5, 0.055, 0.16] : [0.16, 0.055, 0.5],
        })
        if (roadIndex < 6 && along % 3 < 1.5) {
          const bx = x + (road.vertical ? -side * 0.45 : 0.7)
          const bz = z + (road.vertical ? 0.7 : -side * 0.45)
          if (!overlapsBuilding(bx, bz, buildings, 1)) {
            seats.push({
              position: [bx, 0.28, bz],
              scale: road.vertical ? [0.35, 0.095, 0.9] : [0.9, 0.095, 0.35],
              color: '#94724d',
            })
            poles.push({
              position: [bx, 0.13, bz],
              scale: road.vertical ? [0.2, 0.23, 0.67] : [0.67, 0.23, 0.2],
            })
          }
        }
      }
    })
    return { trunks, crowns, shrubs, poles, fixtures, seats }
  }, [layoutKey, season, snow])
  const hills = useMemo(() => {
    const random = seededCityRandom(9201)
    return Array.from({ length: 16 }, (_, index): CityInstance => ({
      position: [-105 + index * 14, -5, -90 - random() * 22],
      scale: [22 + random() * 15, 11 + random() * 14, 18 + random() * 16],
      color: ['#78928a', '#87978a', '#7d948a'][index % 3],
    }))
  }, [])
  const riverGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-90, -44)
    shape.bezierCurveTo(-35, -38, -8, -49, 80, -43)
    shape.lineTo(80, -50)
    shape.bezierCurveTo(-10, -54, -38, -44, -90, -50)
    shape.closePath()
    const geometry = new THREE.ShapeGeometry(shape, 64)
    geometry.rotateX(Math.PI / 2)
    return geometry
  }, [])
  return (
    <group>
      <CityInstances
        items={landscape.trunks}
        geometry="cylinder"
        castShadow={shadows}
      />
      <CityInstances
        items={landscape.crowns}
        geometry="sphere"
        castShadow={shadows}
        roughness={0.92}
      />
      <CityInstances items={landscape.shrubs} geometry="sphere" roughness={1} />
      <CityInstances items={landscape.poles} color="#47534e" metalness={0.45} />
      <CityInstances
        items={landscape.fixtures}
        color="#eee4b9"
        emissive="#ffda91"
        emissiveIntensity={night * 2.5 + 0.1}
      />
      <CityInstances items={landscape.seats} roughness={0.92} />
      <CityInstances items={hills} geometry="sphere" roughness={1} />
      <mesh geometry={riverGeometry} position={[0, -0.015, 0]} receiveShadow>
        <meshStandardMaterial
          color="#759c9d"
          metalness={0.47}
          roughness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[-2, 0.07, -44.5]} receiveShadow>
        <boxGeometry args={[2.8, 0.2, 9.5]} />
        <meshStandardMaterial color="#a9aaa0" roughness={0.9} />
      </mesh>
    </group>
  )
}
