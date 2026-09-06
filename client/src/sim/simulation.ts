import { ensurePersonRoute, reconcilePersonBuilding, updatePersonTravel } from '../lib/world'
import type { Building, Environment, Person } from '../state/store'

export interface SimState {
  buildings: Building[]
  people: Person[]
  environment: Environment
  dt: number
}

export interface SimResult {
  buildings: Building[]
  people: Person[]
}

export function tickSimulation(state: SimState, speed: number): SimResult {
  const nextBuildings = state.buildings.map(building => ({ ...building, occupancy: 0 }))
  const nextPeople = state.people.map(person => ({ ...person }))

  for (let index = 0; index < nextPeople.length; index++) {
    let person = nextPeople[index]
    if (person.targetBuildingId !== person.currentBuildingId || (person.route?.length ?? 0) > 0) {
      person = ensurePersonRoute(person, nextBuildings)
      person = updatePersonTravel(person, nextBuildings, state.dt, speed)
    }
    nextPeople[index] = reconcilePersonBuilding(person, nextBuildings)
  }

  for (const person of nextPeople) {
    if (person.currentBuildingId && person.presence === 'inside') {
      const building = nextBuildings.find(candidate => candidate.id === person.currentBuildingId)
      if (building) building.occupancy += 1
    }
  }

  return { buildings: nextBuildings, people: nextPeople }
}

export function applyEnvironmentEffects(buildings: Building[], environment: Environment, dt: number): Building[] {
  return buildings.map(building => {
    let target = 0.5

    switch (environment.dayPeriod) {
      case 'matin':
        if (building.zone === 'campus') target += 0.08
        break
      case 'midi':
        if (building.type === 'food') target += 0.2
        break
      case 'apresmidi':
        if (building.zone === 'downtown' || building.zone === 'campus') target += 0.12
        break
      case 'soir':
        if (building.type === 'entertainment' || building.type === 'food') target += 0.18
        break
      case 'nuit':
        target -= 0.2
        if (building.type === 'healthcare' || building.type === 'civic' || building.type === 'residence') {
          target += 0.15
        }
        break
    }

    if (environment.weekend && (building.zone === 'downtown' || building.type === 'academic')) {
      target -= 0.15
    }
    if (environment.condition === 'rain' || environment.condition === 'snow') {
      target += building.type === 'retail' || building.type === 'food' ? 0.08 : 0.03
    }

    return {
      ...building,
      activity: building.activity + (Math.max(0, Math.min(1, target)) - building.activity) * Math.min(1, dt * 0.3),
    }
  })
}
