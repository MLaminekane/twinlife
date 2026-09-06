import type { Building, BuildingType, Person, ZoneKey } from '../state/store'
import { seededRandom, randomName } from '../lib/helpers'
import { computeDefaultEntrance, sampleInsideBuilding, worldToGeo } from '../lib/world'

type BuildingSeed = {
  id: string
  name: string
  position: [number, number, number]
  size: [number, number, number]
  activity: number
  zone: ZoneKey
  type: BuildingType
  capacity: number
  openingHours?: { open: number; close: number }
}

function defineBuilding(seed: BuildingSeed): Building {
  const entrances: [[number, number, number]] = [
    computeDefaultEntrance(seed.position, seed.size, seed.zone),
  ]

  return {
    ...seed,
    occupancy: 0,
    entrances,
    geoPosition: worldToGeo(seed.position),
  }
}

export const initialBuildings: Building[] = [
  defineBuilding({ id: 'sci', name: 'Sciences', position: [-22, 2, 15], size: [5, 5, 6], activity: 0.5, zone: 'campus', type: 'academic', capacity: 220, openingHours: { open: 7, close: 22 } }),
  defineBuilding({ id: 'eng', name: 'Ingénierie', position: [-12, 2, 15], size: [5, 5, 5], activity: 0.5, zone: 'campus', type: 'research', capacity: 210, openingHours: { open: 7, close: 22 } }),
  defineBuilding({ id: 'med', name: 'Médecine', position: [-22, 2, 7], size: [6, 5, 5], activity: 0.5, zone: 'campus', type: 'research', capacity: 180, openingHours: { open: 6, close: 23 } }),
  defineBuilding({ id: 'bus', name: 'Économie', position: [-12, 2, 7], size: [5, 5, 5], activity: 0.9, zone: 'campus', type: 'academic', capacity: 240, openingHours: { open: 7, close: 22 } }),
  defineBuilding({ id: 'art', name: 'Arts', position: [-28, 2, 11], size: [4, 4, 5], activity: 0.5, zone: 'campus', type: 'academic', capacity: 120, openingHours: { open: 8, close: 21 } }),
  defineBuilding({ id: 'law', name: 'Droit', position: [-10, 2, 32], size: [4.5, 4.5, 4], activity: 0.5, zone: 'campus', type: 'academic', capacity: 140, openingHours: { open: 8, close: 21 } }),
  defineBuilding({ id: 'lib', name: 'Bibliothèque', position: [-18, 2, 22], size: [6, 5, 5], activity: 0.5, zone: 'campus', type: 'academic', capacity: 260, openingHours: { open: 7, close: 23 } }),
  defineBuilding({ id: 'gym', name: 'Gymnase', position: [-25, 2, 25], size: [7, 4, 5], activity: 0.45, zone: 'campus', type: 'fitness', capacity: 160, openingHours: { open: 6, close: 22 } }),
  defineBuilding({ id: 'cafe', name: 'Cafétéria', position: [-12, 2, 25], size: [5, 3, 6], activity: 0.6, zone: 'campus', type: 'food', capacity: 130, openingHours: { open: 7, close: 20 } }),

  defineBuilding({ id: 'tech-tower', name: 'Tour Tech', position: [8, 3, 15], size: [5, 8, 5], activity: 0.6, zone: 'downtown', type: 'office', capacity: 200, openingHours: { open: 7, close: 21 } }),
  defineBuilding({ id: 'corp-hq', name: 'Siège Social', position: [20, 3, 20], size: [6, 7, 6], activity: 0.55, zone: 'downtown', type: 'office', capacity: 180, openingHours: { open: 7, close: 20 } }),
  defineBuilding({ id: 'startup-hub', name: 'Hub Startups', position: [8, 2, 7], size: [5, 4, 5], activity: 0.5, zone: 'downtown', type: 'office', capacity: 110, openingHours: { open: 8, close: 21 } }),
  defineBuilding({ id: 'bank', name: 'Banque', position: [19, 2, 7], size: [5, 5, 4], activity: 0.5, zone: 'downtown', type: 'office', capacity: 130, openingHours: { open: 8, close: 18 } }),
  defineBuilding({ id: 'city-hall', name: 'Mairie', position: [20, 2, 32], size: [7, 5, 5], activity: 0.45, zone: 'downtown', type: 'civic', capacity: 140, openingHours: { open: 8, close: 18 } }),
  defineBuilding({ id: 'office-park', name: 'Parc de Bureaux', position: [27, 2, 11], size: [6, 5, 6], activity: 0.5, zone: 'downtown', type: 'office', capacity: 170, openingHours: { open: 7, close: 20 } }),
  defineBuilding({ id: 'hospital', name: 'Hôpital', position: [5, 2, 25], size: [7, 6, 7], activity: 0.7, zone: 'downtown', type: 'healthcare', capacity: 260, openingHours: { open: 0, close: 24 } }),
  defineBuilding({ id: 'police', name: 'Commissariat', position: [20, 2, 25], size: [5, 4, 5], activity: 0.5, zone: 'downtown', type: 'civic', capacity: 90, openingHours: { open: 0, close: 24 } }),

  defineBuilding({ id: 'res-tower-a', name: 'Tour Résidentielle A', position: [-25, 3, -8], size: [5, 6, 5], activity: 0.4, zone: 'residential', type: 'residence', capacity: 140, openingHours: { open: 0, close: 24 } }),
  defineBuilding({ id: 'res-tower-b', name: 'Tour Résidentielle B', position: [-12, 3, -8], size: [5, 6, 5], activity: 0.4, zone: 'residential', type: 'residence', capacity: 140, openingHours: { open: 0, close: 24 } }),
  defineBuilding({ id: 'res-tower-c', name: 'Tour Résidentielle C', position: [-26, 3, -16], size: [5, 6, 5], activity: 0.4, zone: 'residential', type: 'residence', capacity: 140, openingHours: { open: 0, close: 24 } }),
  defineBuilding({ id: 'res-tower-d', name: 'Tour Résidentielle D', position: [-19, 3, -16], size: [5, 6, 5], activity: 0.4, zone: 'residential', type: 'residence', capacity: 140, openingHours: { open: 0, close: 24 } }),
  defineBuilding({ id: 'res-family', name: 'Logements Familiaux', position: [-33, 2, -12], size: [6, 4, 7], activity: 0.35, zone: 'residential', type: 'residence', capacity: 95, openingHours: { open: 0, close: 24 } }),
  defineBuilding({ id: 'res-student', name: 'Résidences Étudiantes', position: [-13, 2, -20], size: [5, 5, 6], activity: 0.5, zone: 'residential', type: 'residence', capacity: 180, openingHours: { open: 0, close: 24 } }),
  defineBuilding({ id: 'park', name: 'Parc Public', position: [-17, 1, -30], size: [8, 1, 8], activity: 0.3, zone: 'residential', type: 'park', capacity: 90, openingHours: { open: 6, close: 23 } }),
  defineBuilding({ id: 'school', name: 'École Primaire', position: [-18, 2, -7], size: [6, 4, 5], activity: 0.5, zone: 'residential', type: 'academic', capacity: 120, openingHours: { open: 7, close: 17 } }),

  defineBuilding({ id: 'mall', name: 'Centre Commercial', position: [13, 2, -8], size: [9, 4, 7], activity: 0.65, zone: 'commercial', type: 'retail', capacity: 240, openingHours: { open: 9, close: 21 } }),
  defineBuilding({ id: 'restaurant', name: 'Restaurants', position: [8, 2, -16], size: [6, 3, 6], activity: 0.7, zone: 'commercial', type: 'food', capacity: 120, openingHours: { open: 11, close: 23 } }),
  defineBuilding({ id: 'cinema', name: 'Cinéma', position: [18, 2, -16], size: [7, 5, 5], activity: 0.6, zone: 'commercial', type: 'entertainment', capacity: 150, openingHours: { open: 12, close: 23 } }),
  defineBuilding({ id: 'supermarket', name: 'Supermarché', position: [25, 2, -8], size: [8, 4, 6], activity: 0.7, zone: 'commercial', type: 'retail', capacity: 180, openingHours: { open: 8, close: 22 } }),
  defineBuilding({ id: 'hotel', name: 'Hôtel', position: [5, 3, -4], size: [5, 7, 5], activity: 0.5, zone: 'commercial', type: 'office', capacity: 130, openingHours: { open: 0, close: 24 } }),
  defineBuilding({ id: 'spa', name: 'Centre de Loisirs', position: [13, 2, -23], size: [6, 3, 5], activity: 0.45, zone: 'commercial', type: 'fitness', capacity: 90, openingHours: { open: 9, close: 21 } }),
  defineBuilding({ id: 'market', name: 'Marché Public', position: [25, 2, -20], size: [7, 2, 7], activity: 0.6, zone: 'commercial', type: 'retail', capacity: 140, openingHours: { open: 8, close: 20 } }),
]

export function initPeople(count: number, buildings: Building[]): Person[] {
  const rand = seededRandom(42)
  const people: Person[] = []

  const residential = buildings.filter(building => building.zone === 'residential' && building.type === 'residence')
  const campus = buildings.filter(building => building.zone === 'campus')
  const offices = buildings.filter(building => building.zone === 'downtown' || building.zone === 'commercial')
  const food = buildings.filter(building => building.type === 'food' || building.id === 'mall')

  for (let i = 0; i < count; i++) {
    const roleRoll = rand()
    const role = roleRoll < 0.58 ? 'student' : roleRoll < 0.9 ? 'employee' : 'visitor'
    const home = residential[Math.floor(rand() * residential.length)] || buildings[0]

    let workplace: Building
    if (role === 'student') {
      workplace = rand() < 0.4
        ? buildings.find(building => building.id === 'bus') || campus[0]
        : campus[Math.floor(rand() * campus.length)]
    } else if (role === 'employee') {
      workplace = offices[Math.floor(rand() * offices.length)]
    } else {
      workplace = food[Math.floor(rand() * food.length)] || campus[0]
    }

    const lunchSpot = food[Math.floor(rand() * food.length)] || workplace
    const spawnBuilding = rand() < 0.7 ? home : workplace

    const schedule = role === 'student'
      ? [
          { time: 8, activity: 'study', targetId: workplace.id },
          { time: 12, activity: 'eat', targetId: lunchSpot.id },
          { time: 13, activity: 'study', targetId: workplace.id },
          { time: 17, activity: 'leisure' as const },
          { time: 22, activity: 'sleep', targetId: home.id },
        ]
      : [
          { time: 9, activity: 'work', targetId: workplace.id },
          { time: 12, activity: 'eat', targetId: lunchSpot.id },
          { time: 13, activity: role === 'employee' ? 'work' : 'leisure', targetId: workplace.id },
          { time: 18, activity: 'leisure' as const },
          { time: 23, activity: 'sleep', targetId: home.id },
        ]

    people.push({
      id: i,
      position: sampleInsideBuilding(spawnBuilding, i + 1),
      targetBuildingId: spawnBuilding.id,
      currentBuildingId: spawnBuilding.id,
      homeBuildingId: home.id,
      speed: 0.8 + rand() * 0.6,
      heading: rand() * Math.PI * 2,
      presence: 'inside',
      name: randomName(rand),
      role: role as any,
      workplace: workplace.id,
      traits: {
        introversion: rand(),
        punctuality: 0.5 + rand() * 0.5,
        energy: 1.0,
      },
      schedule: schedule as any,
      state: {
        currentActivity: 'idle',
        mood: 'neutral',
        history: [],
      },
    })
  }

  return people
}
