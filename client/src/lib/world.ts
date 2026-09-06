import type { Building, Person, ZoneKey } from '../state/types'

export const MAP_CITY_CENTER = { lon: -71.065, lat: 48.428 }
const DEG_LAT_PER_M = 1 / 111320
const DEG_LON_PER_M = 1 / (111320 * Math.cos((MAP_CITY_CENTER.lat * Math.PI) / 180))
const METERS_PER_WORLD_UNIT = 45

type NodeId =
  | 'nw'
  | 'north'
  | 'ne'
  | 'west'
  | 'cross'
  | 'east'
  | 'sw'
  | 'south'
  | 'se'

type Vec3 = [number, number, number]

const ROUTE_NODES: Record<NodeId, Vec3> = {
  nw: [-18, 0, 18],
  north: [-2, 0, 18],
  ne: [18, 0, 18],
  west: [-18, 0, -2],
  cross: [-2, 0, -2],
  east: [18, 0, -2],
  sw: [-18, 0, -18],
  south: [-2, 0, -18],
  se: [18, 0, -18],
}

const ROUTE_EDGES: Record<NodeId, NodeId[]> = {
  nw: ['north', 'west'],
  north: ['nw', 'cross', 'ne'],
  ne: ['north', 'east'],
  west: ['nw', 'cross', 'sw'],
  cross: ['north', 'west', 'east', 'south'],
  east: ['ne', 'cross', 'se'],
  sw: ['west', 'south'],
  south: ['sw', 'cross', 'se'],
  se: ['south', 'east'],
}

export function worldToGeo(position: [number, number, number]): [number, number] {
  const dLon = position[0] * METERS_PER_WORLD_UNIT * DEG_LON_PER_M
  const dLat = -position[2] * METERS_PER_WORLD_UNIT * DEG_LAT_PER_M
  return [MAP_CITY_CENTER.lon + dLon, MAP_CITY_CENTER.lat + dLat]
}

export function distance2D(a: [number, number, number], b: [number, number, number]): number {
  return Math.hypot(a[0] - b[0], a[2] - b[2])
}

export function isInsideBuilding(position: [number, number, number], building: Building, padding = 0.2): boolean {
  const halfX = building.size[0] / 2 - padding
  const halfZ = building.size[2] / 2 - padding
  return (
    Math.abs(position[0] - building.position[0]) <= Math.max(0.2, halfX) &&
    Math.abs(position[2] - building.position[2]) <= Math.max(0.2, halfZ)
  )
}

export function getBuildingById(buildings: Building[], id: string | null | undefined): Building | undefined {
  if (!id) return undefined
  return buildings.find(building => building.id === id)
}

export function computeDefaultEntrance(position: [number, number, number], size: [number, number, number], zone: ZoneKey): Vec3 {
  const [x, , z] = position
  const halfX = size[0] / 2 + 0.8
  const halfZ = size[2] / 2 + 0.8

  if (zone === 'campus') return [x + Math.sign(-2 - x || 1) * halfX, 0, z]
  if (zone === 'downtown') return [x, 0, z - halfZ]
  if (zone === 'residential') return [x, 0, z + halfZ]
  return [x, 0, z + halfZ]
}

export function getPrimaryEntrance(building: Building): Vec3 {
  return building.entrances[0] ?? computeDefaultEntrance(building.position, building.size, building.zone)
}

export function sampleInsideBuilding(building: Building, seed: number): Vec3 {
  const angle = (seed * 0.61803398875) % 1
  const radius = 0.15 + ((seed * 0.38196601125) % 1) * 0.35
  const offsetX = Math.cos(angle * Math.PI * 2) * (building.size[0] * radius)
  const offsetZ = Math.sin(angle * Math.PI * 2) * (building.size[2] * radius)
  return [building.position[0] + offsetX, 0.1, building.position[2] + offsetZ]
}

function nearestNodeId(position: Vec3): NodeId {
  let best: NodeId = 'cross'
  let bestDistance = Number.POSITIVE_INFINITY
  for (const [id, nodePosition] of Object.entries(ROUTE_NODES) as Array<[NodeId, Vec3]>) {
    const dist = distance2D(position, nodePosition)
    if (dist < bestDistance) {
      bestDistance = dist
      best = id
    }
  }
  return best
}

function shortestNodePath(start: NodeId, end: NodeId): NodeId[] {
  if (start === end) return [start]

  const queue: NodeId[] = [start]
  const previous = new Map<NodeId, NodeId | null>([[start, null]])

  while (queue.length) {
    const current = queue.shift()!
    for (const next of ROUTE_EDGES[current]) {
      if (previous.has(next)) continue
      previous.set(next, current)
      if (next === end) {
        const path: NodeId[] = [end]
        let cursor: NodeId | null = current
        while (cursor) {
          path.unshift(cursor)
          cursor = previous.get(cursor) ?? null
        }
        return path
      }
      queue.push(next)
    }
  }

  return [start, end]
}

export function planRoute(person: Person, buildings: Building[], targetBuildingId: string): Vec3[] {
  const targetBuilding = getBuildingById(buildings, targetBuildingId)
  if (!targetBuilding) return []

  const targetEntrance = getPrimaryEntrance(targetBuilding)
  const route: Vec3[] = []
  const currentBuilding = getBuildingById(buildings, person.currentBuildingId)

  if (currentBuilding) {
    route.push(getPrimaryEntrance(currentBuilding))
  }

  const startNode = nearestNodeId(route[route.length - 1] ?? person.position)
  const endNode = nearestNodeId(targetEntrance)

  for (const nodeId of shortestNodePath(startNode, endNode)) {
    const node = ROUTE_NODES[nodeId]
    if (!route.length || distance2D(route[route.length - 1], node) > 0.4) {
      route.push(node)
    }
  }

  if (!route.length || distance2D(route[route.length - 1], targetEntrance) > 0.4) {
    route.push(targetEntrance)
  }

  route.push(sampleInsideBuilding(targetBuilding, person.id + targetBuilding.id.length))
  return route
}

export function ensurePersonRoute(person: Person, buildings: Building[]): Person {
  if (person.targetBuildingId === person.currentBuildingId && (!person.route || person.route.length === 0)) {
    return person
  }
  if (person.route && person.route.length > 0) {
    return person
  }
  return {
    ...person,
    presence: 'walking',
    route: planRoute(person, buildings, person.targetBuildingId),
    routeIndex: 0,
  }
}

export function updatePersonTravel(person: Person, buildings: Building[], dt: number, speedMultiplier: number): Person {
  if (!person.route?.length || dt <= 0 || speedMultiplier <= 0) return person
  let budget = dt * person.speed * speedMultiplier
  let index = person.routeIndex ?? 0
  let position: Vec3 = [...person.position]
  let heading = person.heading
  // Consume the complete distance budget, even when one frame crosses several waypoints.
  while (index < person.route.length) {
    const target = person.route[index]
    const dx = target[0] - position[0]
    const dz = target[2] - position[2]
    const distance = Math.hypot(dx, dz)
    if (distance > 0.0001) heading = Math.atan2(dx, dz)
    if (distance > budget) {
      position = [position[0] + dx / distance * budget, position[1], position[2] + dz / distance * budget]
      return { ...person, position, heading, routeIndex: index, presence: 'walking', currentBuildingId: null }
    }
    position = [target[0], position[1], target[2]]
    budget -= distance
    index += 1
  }
  const destination = getBuildingById(buildings, person.targetBuildingId)
  return {
    ...person,
    position,
    heading,
    currentBuildingId: destination?.id ?? null,
    presence: destination ? 'inside' : 'walking',
    route: [],
    routeIndex: 0,
  }
}

export function reconcilePersonBuilding(person: Person, buildings: Building[]): Person {
  // A planned trip owns its arrival. Do not pull walkers back into their departure building.
  if (person.presence === 'walking' && person.route?.length) return person
  if (person.presence === 'inside' && person.currentBuildingId) return person
  const building = buildings.find(candidate => isInsideBuilding(person.position, candidate))
  if (!building) return person
  return {
    ...person,
    currentBuildingId: building.id,
    presence: 'inside',
    route: [],
    routeIndex: 0,
    position: sampleInsideBuilding(building, person.id),
  }
}
