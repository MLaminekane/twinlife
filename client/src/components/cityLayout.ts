import type { Building } from '../state/types'

export const CITY_ROADS = [
  { x: -2, z: 0, length: 76, width: 2.4, vertical: true },
  { x: 0, z: -2, length: 76, width: 2.4, vertical: false },
  { x: -18, z: 0, length: 72, width: 1.45, vertical: true },
  { x: 18, z: 0, length: 72, width: 1.45, vertical: true },
  { x: 0, z: 18, length: 72, width: 1.45, vertical: false },
  { x: 0, z: -18, length: 72, width: 1.45, vertical: false },
  { x: -39, z: 0, length: 77, width: 2.2, vertical: true },
  { x: 36, z: 0, length: 77, width: 2.2, vertical: true },
  { x: -1.5, z: 37, length: 77, width: 2.2, vertical: false },
  { x: -1.5, z: -37, length: 77, width: 2.2, vertical: false },
] as const

export function seededCityRandom(seed: number) {
  let value = seed >>> 0
  return () => {
    value = (Math.imul(1664525, value) + 1013904223) >>> 0
    return value / 4294967296
  }
}

export function overlapsBuilding(
  x: number,
  z: number,
  buildings: Building[],
  margin = 0.8,
) {
  return buildings.some(
    (b) =>
      Math.abs(x - b.position[0]) < b.size[0] / 2 + margin &&
      Math.abs(z - b.position[2]) < b.size[2] / 2 + margin,
  )
}

export function overlapsRoad(x: number, z: number, margin = 0.8) {
  return CITY_ROADS.some(
    (r) =>
      Math.abs((r.vertical ? x : z) - (r.vertical ? r.x : r.z)) <
        r.width / 2 + margin &&
      Math.abs((r.vertical ? z : x) - (r.vertical ? r.z : r.x)) <
        r.length / 2 + margin,
  )
}

export function nightAmount(hour: number) {
  const sun = Math.sin(((hour - 6) / 24) * Math.PI * 2)
  return 1 - Math.min(1, Math.max(0, (sun + 0.08) / 0.36))
}
