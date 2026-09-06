import { useStore } from '../state/store'
import type { Environment, Store } from '../state/types'
import { computeEnvActivityTarget } from '../state/environmentLogic'

type ScenarioId = NonNullable<Environment['activeScenario']>

export const SCENARIOS: { id: ScenarioId; title: string; description: string; icon: string }[] = [
  { id: 'commute', title: 'Heure de pointe', description: 'Les habitants rejoignent les bureaux et le campus. Les déplacements s’intensifient.', icon: 'sunrise' },
  { id: 'festival', title: 'La ville en fête', description: 'Un samedi d’été animé : visiteurs, terrasses, commerces et parc au premier plan.', icon: 'sparkles' },
  { id: 'storm', title: 'Tempête hivernale', description: 'La neige ralentit les marcheurs. Les habitants se mettent à l’abri et l’hôpital se mobilise.', icon: 'snowflake' },
  { id: 'night', title: 'Nuit tranquille', description: 'Les résidents rentrent chez eux. La ville ralentit, les services essentiels restent actifs.', icon: 'moon' },
]

const PRESETS: Record<ScenarioId, Partial<Environment>> = {
  commute: { gameTime: 8.6, season: 'automne', temperature: 14, condition: 'clear', weekend: false, populationFactor: 1.2 },
  festival: { gameTime: 18.25, season: 'ete', temperature: 26, condition: 'clear', weekend: true, populationFactor: 1.65 },
  storm: { gameTime: 16.2, season: 'hiver', temperature: -12, condition: 'snow', weekend: false, populationFactor: 0.86 },
  night: { gameTime: 23, season: 'ete', temperature: 16, condition: 'clear', weekend: false, populationFactor: 0.86 },
}

/** Enacts a simulated event. No external weather feed or live city data is involved. */
export function launchScenario(id: string): void {
  if (!SCENARIOS.some(scenario => scenario.id === id)) return
  const scenarioId = id as ScenarioId
  const state = useStore.getState()
  const preset = PRESETS[scenarioId]
  const environment = { ...state.environment, ...preset, activeScenario: scenarioId, scenarioRemaining: 180, realTime: false }
  const eventDestinations = state.buildings.filter(building => ['park', 'food', 'entertainment', 'retail'].includes(building.type))
  const hospital = state.buildings.find(building => building.type === 'healthcare')
  state.applyDirective({
    environment,
    buildingActivitySet: state.buildings.map(building => ({ buildingName: building.name, level: computeEnvActivityTarget(building, environment) })),
    buildingEvents: scenarioId === 'storm' && hospital ? [{ buildingName: hospital.name, events: [{ text: 'Tempête : accueil renforcé et coordination des secours.', type: 'urgent' }] }]
      : scenarioId === 'festival' && eventDestinations.length ? [{ buildingName: eventDestinations[0].name, events: [{ text: 'Festival de quartier : ouverture des animations.', type: 'info' }] }] : undefined,
  })
  useStore.setState(current => {
    const people = current.people.map((person, index) => {
      let target = scenarioId === 'commute' ? person.workplace : person.homeBuildingId
      if (scenarioId === 'festival' && eventDestinations.length && index % 5 !== 0) target = eventDestinations[index % eventDestinations.length].id
      if (scenarioId === 'storm' && hospital && index % 24 === 0) target = hospital.id
      if (!target || !current.buildings.some(building => building.id === target)) target = person.targetBuildingId
      return {
        ...person, targetBuildingId: target, route: [], routeIndex: 0,
        state: {
          ...person.state, talkingWith: undefined, scheduledTask: undefined, commandRemaining: 150,
          currentActivity: scenarioId === 'night' ? 'sleep' : scenarioId === 'festival' ? 'leisure' : 'commuting',
          mood: scenarioId === 'festival' ? 'happy' as const : scenarioId === 'storm' ? 'stressed' as const : 'neutral' as const,
        },
      }
    })
    const nextNewsId = current.news.reduce((largest, item) => Math.max(largest, item.id), 0) + 1
    return {
      settings: { ...current.settings, running: true },
      effects: current.effects.filter(effect => effect.type !== 'pause'),
      people,
      news: [...current.news, { id: nextNewsId, ts: Date.now(), kind: 'system' as const, text: `Scénario lancé · ${SCENARIOS.find(scenario => scenario.id === id)!.title}` }].slice(-50),
    }
  })
}

/** Transparent, relative estimates derived exclusively from the current simulation. */
export function getUrbanInsights(state: Pick<Store, 'buildings' | 'people' | 'environment'>): {
  walking: number; occupancyRate: number; energyKw: number; comfort: number; traffic: number
} {
  const { buildings, people, environment } = state
  const capacity = buildings.reduce((sum, building) => sum + Math.max(0, building.capacity), 0)
  const walking = people.filter(person => person.presence === 'walking').length
  const inside = people.filter(person => person.presence === 'inside' && person.currentBuildingId).length
  const temperature = environment.temperature ?? ({ hiver: -4, printemps: 13, ete: 24, automne: 14 }[environment.season])
  const thermalDemand = Math.max(0, 18 - temperature) + Math.max(0, temperature - 24) * 1.3
  const energyKw = buildings.reduce((sum, building) => {
    if (building.type === 'park') return sum + building.activity * 2
    const floorArea = building.size[0] * building.size[2] * Math.max(1, building.size[1] / 3) * 8
    const essentialLoad = building.type === 'healthcare' ? 0.065 : 0.018
    return sum + floorArea * (essentialLoad + building.activity * 0.035 + thermalDemand * 0.0018) + building.occupancy * 0.07
  }, 0)
  const moodPenalty = people.reduce((sum, person) => sum + (person.state.mood === 'stressed' ? 35 : person.state.mood === 'tired' ? 20 : person.state.mood === 'happy' ? -8 : 4), 0) / Math.max(1, people.length)
  const weatherPenalty = (Math.abs(temperature - 21) * 0.75 + (environment.condition === 'snow' ? 20 : environment.condition === 'rain' ? 10 : 0)) * walking / Math.max(1, people.length)
  const crowdPenalty = buildings.reduce((sum, building) => sum + Math.max(0, building.occupancy - building.capacity) * 0.2, 0)
  const destinations = new Map<string, number>()
  for (const person of people) if (person.presence === 'walking') destinations.set(person.targetBuildingId, (destinations.get(person.targetBuildingId) ?? 0) + 1)
  const peakFlow = Math.max(0, ...destinations.values())
  const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)))
  return {
    walking,
    occupancyRate: capacity > 0 ? Math.round(inside / capacity * 1000) / 10 : 0,
    energyKw: Math.round(energyKw),
    comfort: clampPercent(96 - moodPenalty - weatherPenalty - crowdPenalty),
    traffic: clampPercent((walking * 110 + peakFlow * 45) / Math.max(1, people.length)),
  }
}
