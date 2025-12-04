import type { Building, Person } from '../state/types'

export function findPersonByName(query: string, people: Person[]): Person | undefined {
  const q = query.trim().toLowerCase()
  if (!q) return undefined
  return people.find(p => p.name.toLowerCase().includes(q))
}

export function computeMetricsSnapshot(
  buildings: Building[],
  people: Person[]
) {
  const activeBuildings = buildings.filter(b => b.activity > 0.3).length
  const totalOccupancy = buildings.reduce((s, b) => s + b.occupancy, 0)
  return {
    totalPeople: people.length,
    activeBuildings,
    totalOccupancy
  }
}
