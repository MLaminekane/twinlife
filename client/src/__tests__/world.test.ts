import { describe, expect, it } from 'vitest'
import { initialBuildings, initPeople } from '../config/initialData'

describe('initial world data', () => {
  it('assigns real-world metadata to every building', () => {
    for (const building of initialBuildings) {
      expect(building.zone).toBeTruthy()
      expect(building.type).toBeTruthy()
      expect(building.capacity).toBeGreaterThan(0)
      expect(building.entrances.length).toBeGreaterThan(0)
      expect(building.geoPosition).toHaveLength(2)
    }
  })

  it('creates people with a coherent presence state', () => {
    const people = initPeople(20, initialBuildings)
    for (const person of people) {
      expect(person.currentBuildingId).toBeTruthy()
      expect(person.homeBuildingId).toBeTruthy()
      expect(person.presence).toBe('inside')
      expect(person.targetBuildingId).toBeTruthy()
    }
  })
})
