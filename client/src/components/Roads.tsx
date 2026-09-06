import { useMemo } from 'react'
import { useStore } from '../state/store'
import { CityInstances, type CityInstance } from './CityInstances'
import { CITY_ROADS, overlapsBuilding } from './cityLayout'

export function Roads({ mobility = false }: { mobility?: boolean }) {
  const layoutKey = useStore((s) =>
    s.buildings.map((b) => `${b.id}:${b.position}:${b.size}`).join('|'),
  )
  const wet = useStore((s) => s.environment.condition === 'rain')
  const roadwork = useMemo(() => {
    const buildings = useStore.getState().buildings
    const asphalt: CityInstance[] = []
    const sidewalks: CityInstance[] = []
    const markings: CityInstance[] = []
    const crossings: CityInstance[] = []
    CITY_ROADS.forEach((road) => {
      // Clip each continuous road strip to the actual cadastral footprints.
      let start: number | null = null
      const flush = (end: number) => {
        if (start === null || end <= start) return
        const center = (start + end) / 2
        const length = end - start
        asphalt.push({
          position: [
            road.x + (road.vertical ? 0 : center),
            0.024,
            road.z + (road.vertical ? center : 0),
          ],
          scale: road.vertical
            ? [road.width, 0.025, length]
            : [length, 0.025, road.width],
        })
        for (const side of [-1, 1]) {
          const offset = side * (road.width / 2 + 0.19)
          sidewalks.push({
            position: [
              road.x + (road.vertical ? offset : center),
              0.055,
              road.z + (road.vertical ? center : offset),
            ],
            scale: road.vertical
              ? [0.36, 0.075, length]
              : [length, 0.075, 0.36],
          })
        }
        start = null
      }
      for (
        let along = -road.length / 2;
        along <= road.length / 2;
        along += 0.25
      ) {
        const x = road.x + (road.vertical ? 0 : along)
        const z = road.z + (road.vertical ? along : 0)
        if (overlapsBuilding(x, z, buildings, road.width / 2 + 0.22))
          flush(along)
        else if (start === null) start = along
      }
      flush(road.length / 2)
      for (
        let along = -road.length / 2 + 0.8;
        along < road.length / 2;
        along += 1.7
      ) {
        const x = road.x + (road.vertical ? 0 : along)
        const z = road.z + (road.vertical ? along : 0)
        if (overlapsBuilding(x, z, buildings, road.width / 2 + 0.8)) continue
        const intersection = CITY_ROADS.some(
          (other) =>
            other.vertical !== road.vertical &&
            Math.abs(
              (road.vertical ? z : x) - (road.vertical ? other.z : other.x),
            ) <
              other.width / 2 + 0.4,
        )
        if (intersection) continue
        markings.push({
          position: [x, 0.047, z],
          scale: road.vertical ? [0.045, 0.012, 0.7] : [0.7, 0.012, 0.045],
        })
      }
    })
    for (const [x, z] of [
      [-2, -2],
      [-2, 18],
      [-2, -18],
      [-18, -2],
      [18, -2],
    ]) {
      for (const side of [-1, 1])
        for (let stripe = -3; stripe <= 3; stripe++) {
          const px = x + stripe * 0.27
          const pz = z + side * 1.8
          if (!overlapsBuilding(px, pz, buildings, 0.7))
            crossings.push({
              position: [px, 0.056, pz],
              scale: [0.16, 0.018, 0.62],
            })
        }
    }
    return { asphalt, sidewalks, markings, crossings }
  }, [layoutKey])
  return (
    <group>
      <CityInstances
        items={roadwork.sidewalks}
        color="#c6c5b6"
        roughness={0.94}
      />
      <CityInstances
        items={roadwork.asphalt}
        color={mobility ? '#334d52' : '#515956'}
        roughness={wet ? 0.24 : 0.96}
        metalness={wet ? 0.28 : 0.025}
      />
      <CityInstances
        items={roadwork.markings}
        color={mobility ? '#90e4d0' : '#ccc8ad'}
        emissive={mobility ? '#6ebeb1' : '#000000'}
        emissiveIntensity={mobility ? 0.6 : 0}
      />
      <CityInstances items={roadwork.crossings} color="#e7e3cb" />
    </group>
  )
}
