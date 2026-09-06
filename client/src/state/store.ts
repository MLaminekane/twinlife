import { create } from 'zustand'
import { initialBuildings, initPeople } from '../config/initialData'
import { applyDirective as applyDirectiveLogic } from '../lib/directives'
import { randomName } from '../lib/helpers'
import {
  computeDefaultEntrance,
  ensurePersonRoute,
  reconcilePersonBuilding,
  sampleInsideBuilding,
  updatePersonTravel,
  worldToGeo,
} from '../lib/world'
import { loadCustomBuildings, loadCustomPeople } from '../lib/persistence'
import { updateAgentBehavior } from '../sim/agentBehavior'
import { initializeAgents, applyAgentActionsLogic } from './agentLogic'
import { processDepartmentDynamics } from './departmentLogic'
import { computeEnvActivityTarget, computeTargetPopulation, normalizeEnvironment, eventProbability } from './environmentLogic'
import type {
  Agent,
  AgentAction,
  Building,
  BuildingType,
  Department,
  Directive,
  Environment,
  Metrics,
  NewsItem,
  Person,
  Scenario,
  Settings,
  Store,
  TimeSample,
  ZoneKey,
} from './types'

export type {
  Agent,
  AgentAction,
  Building,
  BuildingType,
  Department,
  Directive,
  Environment,
  Metrics,
  NewsItem,
  Person,
  Scenario,
  Settings,
  Store,
  TimeSample,
  ZoneKey,
}

export const SIM_HOURS_PER_SECOND = 24 / 900

function withOccupancy(buildings: Building[], people: Person[]): Building[] {
  const counts = new Map<string, number>()
  for (const person of people) {
    if (person.currentBuildingId && person.presence === 'inside') counts.set(person.currentBuildingId, (counts.get(person.currentBuildingId) ?? 0) + 1)
  }
  return buildings.map(building => ({ ...building, occupancy: counts.get(building.id) ?? 0 }))
}

function inferZone(buildingId: string): ZoneKey {
  if (buildingId.match(/^(sci|eng|med|bus|art|law|lib|gym|cafe)$/)) return 'campus'
  if (buildingId.includes('tech') || buildingId.includes('corp') || buildingId.includes('startup') || buildingId.includes('bank') || buildingId.includes('city') || buildingId.includes('office') || buildingId.includes('hospital') || buildingId.includes('police')) return 'downtown'
  if (buildingId.includes('res-') || buildingId.includes('park') || buildingId.includes('school')) return 'residential'
  return 'commercial'
}

function inferBuildingType(building: Pick<Building, 'id' | 'name' | 'zone'>): BuildingType {
  if (building.id.includes('hospital')) return 'healthcare'
  if (building.id.includes('res-') || building.id.includes('hotel')) return 'residence'
  if (building.id.includes('cafe') || building.id.includes('restaurant')) return 'food'
  if (building.id.includes('gym') || building.id.includes('spa')) return 'fitness'
  if (building.id.includes('park')) return 'park'
  if (building.id.includes('cinema')) return 'entertainment'
  if (building.id.includes('city') || building.id.includes('police')) return 'civic'
  if (building.id.includes('bank') || building.id.includes('office') || building.id.includes('tech') || building.id.includes('corp') || building.id.includes('startup')) return 'office'
  if (building.zone === 'commercial') return 'retail'
  return 'academic'
}

function estimateCapacity(size: [number, number, number]): number {
  return Math.max(40, Math.round(size[0] * size[2] * 6))
}

function normalizeBuilding(building: Building): Building {
  const zone = building.zone ?? inferZone(building.id)
  const position = building.position
  const size = building.size
  return {
    ...building,
    zone,
    type: building.type ?? inferBuildingType({ id: building.id, name: building.name, zone }),
    capacity: building.capacity ?? estimateCapacity(size),
    entrances: building.entrances?.length ? building.entrances : [computeDefaultEntrance(position, size, zone)],
    geoPosition: building.geoPosition ?? worldToGeo(position),
    occupancy: building.occupancy ?? 0,
  }
}

function normalizePerson(person: Person, buildings: Building[]): Person {
  const fallbackBuilding = buildings.find(building => building.id === person.targetBuildingId) ?? buildings[0]
  const currentBuilding = buildings.find(building => building.id === person.currentBuildingId) ?? fallbackBuilding
  const targetBuildingId = buildings.some(building => building.id === person.targetBuildingId) ? person.targetBuildingId : currentBuilding.id

  return {
    ...person,
    targetBuildingId,
    currentBuildingId: person.presence === 'walking' ? null : person.currentBuildingId ?? currentBuilding.id,
    homeBuildingId: person.homeBuildingId ?? currentBuilding.id,
    heading: person.heading ?? 0,
    presence: person.presence ?? (person.currentBuildingId ? 'inside' : 'walking'),
    position: person.position ?? sampleInsideBuilding(currentBuilding, person.id),
    route: person.route ?? [],
    routeIndex: person.routeIndex ?? 0,
    traits: person.traits ?? { introversion: 0.5, punctuality: 0.5, energy: 1 },
    schedule: person.schedule ?? [{ time: 9, activity: 'work', targetId: targetBuildingId }, { time: 22, activity: 'sleep', targetId: person.homeBuildingId ?? currentBuilding.id }],
    state: person.state ?? { currentActivity: 'idle', mood: 'neutral', history: [] },
  }
}

function spawnDynamicVisitor(id: number, buildings: Building[]): Person {
  const home = buildings.find(building => building.id === 'res-student') ?? buildings.find(building => building.zone === 'residential') ?? buildings[0]
  const target = buildings
    .slice()
    .sort((left, right) => (right.activity + right.occupancy / Math.max(1, right.capacity)) - (left.activity + left.occupancy / Math.max(1, left.capacity)))[0]

  return {
    id,
    position: sampleInsideBuilding(home, id + 17),
    targetBuildingId: target.id,
    currentBuildingId: home.id,
    homeBuildingId: home.id,
    speed: 0.9 + Math.random() * 0.5,
    heading: 0,
    presence: 'inside',
    name: randomName(Math.random),
    role: 'visitor',
    dynamicVisitor: true,
    traits: { introversion: Math.random(), punctuality: 0.4 + Math.random() * 0.3, energy: 1 },
    schedule: [
      { time: 9, activity: 'leisure', targetId: target.id },
      { time: 22, activity: 'sleep', targetId: home.id },
    ],
    state: { currentActivity: 'idle', mood: 'neutral', history: [] },
  }
}

function removePeopleForTargetPopulation(people: Person[], count: number, protectedId: number | null = null): Person[] {
  if (count <= 0) return people

  const ranked = people
    .map((person, index) => ({
      index,
      removable: !person.isCustom && person.id !== protectedId,
      score: (person.dynamicVisitor ? 20 : 0) + (person.role === 'visitor' ? 10 : 0) + (person.presence === 'walking' ? 5 : 0) + (person.currentBuildingId?.startsWith('res-') ? 3 : 0),
    }))
    .filter(entry => entry.removable)
    .sort((left, right) => right.score - left.score)
    .slice(0, count)
    .map(entry => entry.index)

  const removed = new Set(ranked)
  return people.filter((_, index) => !removed.has(index))
}

function computeMetrics(buildings: Building[], people: Person[], state: {
  departments: Department[]
  deptInteractions: Array<{ from: string; to: string; type: 'collab' | 'rivalry'; remaining: number }>
}): Metrics {
  const activeBuildings = buildings.filter(building => building.activity > 0.3).length
  const totalOccupancy = buildings.reduce((sum, building) => sum + building.occupancy, 0)
  const totalPublications = state.departments.reduce((sum, department) => sum + department.publications, 0)
  const activeCollaborations = state.deptInteractions.filter(interaction => interaction.type === 'collab').length
  const activeRivalries = state.deptInteractions.filter(interaction => interaction.type === 'rivalry').length

  return {
    totalPeople: people.length,
    activeBuildings,
    totalOccupancy,
    totalPublications,
    activeCollaborations,
    activeRivalries,
  }
}

const seededBuildings = initialBuildings.map(normalizeBuilding)
const persistedBuildings = loadCustomBuildings().map(normalizeBuilding)
const allBuildings = [...seededBuildings, ...persistedBuildings]
const basePeople = initPeople(500, allBuildings).map(person => normalizePerson(person, allBuildings))
const loadedPeople = loadCustomPeople()
const usedPersonIds = new Set(basePeople.map(person => person.id))
let nextCustomId = loadedPeople.reduce((largest, person) => Math.max(largest, person.id + 1), basePeople.length)
const persistedPeople = loadedPeople.map(person => {
  const id = usedPersonIds.has(person.id) ? nextCustomId++ : person.id
  usedPersonIds.add(id)
  return normalizePerson({ ...person, id, isCustom: true }, allBuildings)
})
const initialPeople = [...basePeople, ...persistedPeople]
const initialMetrics = computeMetrics(
  withOccupancy(allBuildings, initialPeople),
  initialPeople,
  { departments: [
      { id: 'eco', name: 'Économie', buildingId: 'bus', publications: 0, collaborations: {}, rivalries: {} },
      { id: 'bio', name: 'Biologie', buildingId: 'sci', publications: 0, collaborations: {}, rivalries: {} },
      { id: 'eng', name: 'Ingénierie', buildingId: 'eng', publications: 0, collaborations: {}, rivalries: {} },
    ],
    deptInteractions: [],
  }
)

export const useStore = create<Store>((set, get) => ({
  buildings: withOccupancy(allBuildings, initialPeople),
  people: initialPeople,
  settings: {
    running: true,
    speed: 1,
    glow: true,
    shadows: true,
    labels: true,
    visibleBuildings: new Set(allBuildings.map(building => building.id)),
  },
  metrics: initialMetrics,
  environment: { season: 'automne', dayPeriod: 'apresmidi', weekend: false, gameTime: 17.25, temperature: 18, condition: 'clear' },
  scenario: { investmentAI: 0.7, investmentHumanities: 0.3, llmAgents: false },
  timeseries: [],
  tsAcc: 0,
  populationAcc: 0,
  selectedPersonId: null,
  hoveredBuildingId: null,
  selectedBuildingId: null,
  effects: [],
  departments: [
    { id: 'eco', name: 'Économie', buildingId: 'bus', publications: 0, collaborations: {}, rivalries: {} },
    { id: 'bio', name: 'Biologie', buildingId: 'sci', publications: 0, collaborations: {}, rivalries: {} },
    { id: 'eng', name: 'Ingénierie', buildingId: 'eng', publications: 0, collaborations: {}, rivalries: {} },
  ],
  deptInteractions: [],
  deptFlashes: [],
  news: [],
  buildingEvents: {},
  agents: initializeAgents(),

  applyDirective: (directive) => set(state => {
    const result = applyDirectiveLogic(directive, {
      buildings: state.buildings,
      people: state.people,
      settings: state.settings,
      environment: state.environment,
      effects: state.effects,
      news: state.news,
      buildingEvents: state.buildingEvents,
    }, get)

    if (result.buildings) {
      result.buildings = result.buildings.map(normalizeBuilding)
    }
    if (result.people) {
      result.people = result.people.map(person => normalizePerson(person, result.buildings ?? state.buildings))
    }

    if (result.buildings && result.settings?.visibleBuildings) {
      const allBuildingIds = new Set(result.buildings.map(building => building.id))
      result.settings.visibleBuildings = new Set(
        [...result.settings.visibleBuildings].filter(id => allBuildingIds.has(id))
      )
    }

    const nextBuildings = withOccupancy(result.buildings ?? state.buildings, result.people ?? state.people)

    return {
      ...result,
      buildings: nextBuildings,
      metrics: computeMetrics(nextBuildings, result.people ?? state.people, state),
    }
  }),

  tick: (dt) => set(state => {
    if (!Number.isFinite(dt) || dt <= 0) return state
    // A timed pause counts wall seconds; every simulated subsystem stays frozen.
    if (!state.settings.running) {
      if (!state.effects.some(effect => effect.type === 'pause')) return state
      const effects = state.effects.map(effect => effect.type === 'pause' ? { ...effect, remaining: effect.remaining - dt } : effect).filter(effect => effect.remaining > 0)
      return { effects, settings: { ...state.settings, running: effects.every(effect => effect.type !== 'pause') } }
    }

    // Ignore long suspended-tab gaps, then apply the same speed to every subsystem.
    const elapsed = Math.min(dt, 1) * Math.max(0, Math.min(5, state.settings.speed))
    if (!elapsed) return state
    const environment = normalizeEnvironment(state.environment, {
      gameTime: state.environment.gameTime + elapsed * SIM_HOURS_PER_SECOND,
    })
    if ((environment.scenarioRemaining ?? 0) > 0) {
      environment.scenarioRemaining = Math.max(0, environment.scenarioRemaining! - elapsed)
      if (!environment.scenarioRemaining) {
        environment.activeScenario = undefined
        environment.populationFactor = 1
      }
    }

    const buildings = state.buildings.map(building => ({ ...building }))
    const buildingById = new Map(buildings.map(building => [building.id, building]))
    const departments = state.departments.map(department => ({ ...department, collaborations: { ...department.collaborations }, rivalries: { ...department.rivalries } }))
    const deptInteractions = state.deptInteractions.map(interaction => ({ ...interaction, remaining: interaction.remaining - elapsed })).filter(interaction => interaction.remaining > 0)
    const deptFlashes = state.deptFlashes.map(flash => ({ ...flash, remaining: flash.remaining - elapsed })).filter(flash => flash.remaining > 0)
    const news = [...state.news]
    processDepartmentDynamics(elapsed, departments, buildings, state.scenario, deptFlashes, deptInteractions, news)
    const effects = state.effects.map(effect => ({ ...effect, remaining: effect.remaining - elapsed })).filter(effect => effect.remaining > 0)
    const activityBoosts = new Map<string, number>()
    for (const effect of effects) {
      if (effect.type === 'activityRevert') activityBoosts.set(effect.buildingId, (activityBoosts.get(effect.buildingId) ?? 0) + effect.delta)
    }
    for (const building of buildings) {
      const target = Math.max(0, Math.min(1, computeEnvActivityTarget(building, environment) + (activityBoosts.get(building.id) ?? 0)))
      building.activity += (target - building.activity) * (1 - Math.exp(-elapsed * 0.3))
    }

    let people = state.people.map(person => ({ ...person, traits: { ...person.traits }, state: { ...person.state, history: [...person.state.history] } }))
    const customCount = people.reduce((count, person) => count + Number(Boolean(person.isCustom)), 0)
    const targetPopulation = computeTargetPopulation(environment) + customCount
    const populationBudget = (state.populationAcc ?? 0) + 8 * elapsed
    const populationStep = Math.floor(populationBudget)
    const populationAcc = populationBudget - populationStep
    if (buildings.length && people.length < targetPopulation && populationStep > 0) {
      let nextId = people.reduce((largest, person) => Math.max(largest, person.id), -1) + 1
      const toAdd = Math.min(populationStep, targetPopulation - people.length)
      for (let index = 0; index < toAdd; index++) people.push(spawnDynamicVisitor(nextId++, buildings))
    } else if (people.length > targetPopulation && populationStep > 0) {
      people = removePeopleForTargetPopulation(people, Math.min(populationStep, people.length - targetPopulation), state.selectedPersonId)
    }

    // Spatial buckets keep local encounters proportional to population size.
    const socialBuckets = new Map<string, number[]>()
    for (let index = 0; index < people.length; index++) {
      const person = people[index]
      if (person.presence !== 'inside' || !['idle', 'leisure'].includes(person.state.currentActivity)) continue
      const key = `${person.currentBuildingId}:${Math.floor(person.position[0] / 2)}:${Math.floor(person.position[2] / 2)}`
      const bucket = socialBuckets.get(key) ?? []
      bucket.push(index)
      socialBuckets.set(key, bucket)
    }
    for (let index = 0; index < people.length; index++) {
      let person = people[index]
      if (person.state.currentActivity === 'talking') {
        if (Math.random() < eventProbability(0.18, elapsed)) {
          person.state = { ...person.state, currentActivity: 'leisure', talkingWith: undefined, mood: 'happy' }
        }
      } else {
        const decision = updateAgentBehavior(person, environment.gameTime, buildings, environment, elapsed)
        if (decision.targetId && decision.targetId !== person.targetBuildingId) person = { ...person, targetBuildingId: decision.targetId, route: [], routeIndex: 0 }
        if (decision.mood) person.state.mood = decision.mood
        if (person.presence === 'inside' && person.targetBuildingId === person.currentBuildingId && person.state.currentActivity === 'leisure' && Math.random() < eventProbability(0.035, elapsed)) {
          const key = `${person.currentBuildingId}:${Math.floor(person.position[0] / 2)}:${Math.floor(person.position[2] / 2)}`
          const peers = socialBuckets.get(key) ?? []
          const peerIndex = peers.slice(0, 12).find(candidate => candidate !== index && people[candidate].state.currentActivity === 'leisure')
          if (peerIndex !== undefined) {
            person.state = { ...person.state, currentActivity: 'talking', talkingWith: people[peerIndex].id, mood: 'happy' }
            people[peerIndex].state = { ...people[peerIndex].state, currentActivity: 'talking', talkingWith: person.id, mood: 'happy' }
          }
        }
      }
      if (!buildingById.has(person.targetBuildingId) && buildings.length) person = { ...person, targetBuildingId: buildings[0].id, route: [], routeIndex: 0 }
      if (person.targetBuildingId !== person.currentBuildingId || (person.route?.length ?? 0) > 0) {
        person = ensurePersonRoute(person, buildings)
        const weatherSpeed = environment.condition === 'snow' ? 0.68 : environment.condition === 'rain' ? 0.88 : 1
        person = updatePersonTravel(person, buildings, elapsed, weatherSpeed)
        if (person.presence === 'inside' && person.state.currentActivity === 'commuting') {
          const destination = buildingById.get(person.currentBuildingId!)
          person.state.currentActivity = destination?.type === 'office' ? 'work' : destination?.zone === 'campus' ? 'study' : 'leisure'
        }
      }
      people[index] = reconcilePersonBuilding(person, buildings)
    }
    const nextBuildings = withOccupancy(buildings, people)
    const metrics = computeMetrics(nextBuildings, people, { departments, deptInteractions })
    const sampleAcc = (state.tsAcc ?? 0) + elapsed
    const tsAcc = sampleAcc % 1
    const timeseries = sampleAcc >= 1 ? [...(state.timeseries ?? []), {
      ts: Date.now(), ai: state.scenario.investmentAI, hum: state.scenario.investmentHumanities,
      pubs: metrics.totalPublications ?? 0, collabs: metrics.activeCollaborations ?? 0,
      rivalries: metrics.activeRivalries ?? 0, occupancy: metrics.totalOccupancy, activeBuildings: metrics.activeBuildings,
    }].slice(-180) : state.timeseries
    return { buildings: nextBuildings, people, environment, departments, deptInteractions, deptFlashes, news, effects, metrics, timeseries, tsAcc, populationAcc }
  }),
  reset: () => {
    const resetBuildings = initialBuildings.map(normalizeBuilding)
    const resetPeople = initPeople(500, resetBuildings).map(person => normalizePerson(person, resetBuildings))
    return set({
      buildings: withOccupancy(resetBuildings, resetPeople),
      people: resetPeople,
      metrics: computeMetrics(withOccupancy(resetBuildings, resetPeople), resetPeople, { departments: get().departments, deptInteractions: get().deptInteractions }),
    })
  },

  resetRandom: () => set(state => {
    const randomizedBuildings = state.buildings.map(building => normalizeBuilding({ ...building, activity: 0.2 + Math.random() * 0.6, occupancy: 0 }))
    const randomizedPeople = initPeople(state.people.length, randomizedBuildings).map(person => normalizePerson(person, randomizedBuildings))
    return {
      buildings: withOccupancy(randomizedBuildings, randomizedPeople),
      people: randomizedPeople,
      metrics: computeMetrics(withOccupancy(randomizedBuildings, randomizedPeople), randomizedPeople, state),
    }
  }),

  setSelectedPerson: (id) => set({ selectedPersonId: id }),
  setHoveredBuilding: (id) => set({ hoveredBuildingId: id }),
  setSelectedBuilding: (id) => set({ selectedBuildingId: id }),
  setScenario: (scenario) => set(state => ({ scenario: { ...state.scenario, ...scenario } })),

  applyAgentActions: (actions) => set(state => {
    const news = [...state.news]
    const agents = state.agents.map(agent => ({ ...agent, memory: [...(agent.memory ?? [])] }))
    const departments = state.departments.map(department => ({ ...department, collaborations: { ...department.collaborations }, rivalries: { ...department.rivalries } }))
    const buildings = state.buildings.map(building => ({ ...building }))
    const deptFlashes = [...state.deptFlashes]
    const deptInteractions = [...state.deptInteractions]
    const scenario = { ...state.scenario }
    const people = state.people.map(person => ({ ...person, state: { ...person.state } }))
    applyAgentActionsLogic(actions, agents, departments, buildings, deptFlashes, deptInteractions, news, scenario, people)
    for (let index = 0; index < people.length; index++) {
      if (people[index].targetBuildingId !== state.people[index].targetBuildingId) {
        people[index] = { ...people[index], route: [], routeIndex: 0, state: { ...people[index].state, currentActivity: 'commuting', commandRemaining: 120 } }
      }
    }
    return { agents, departments, buildings, deptFlashes, deptInteractions, scenario, people, news: news.slice(-50), metrics: computeMetrics(buildings, people, { departments, deptInteractions }) }
  }),

  fetchRealWeather: async () => {
    const { fetchWeather } = await import('../lib/weather')
    const weather = await fetchWeather()

    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Toronto', month: 'numeric', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
    }).formatToParts(new Date())
    const value = (type: string) => parts.find(part => part.type === type)?.value ?? ''
    const month = Number(value('month'))
    const gameTime = Number(value('hour')) + Number(value('minute')) / 60
    const season: Environment['season'] = month >= 3 && month <= 5 ? 'printemps' : month >= 6 && month <= 8 ? 'ete' : month >= 9 && month <= 11 ? 'automne' : 'hiver'
    set(state => ({
      environment: normalizeEnvironment(state.environment, {
        realTime: true,
        temperature: weather.temperature,
        condition: weather.condition,
        season,
        gameTime,
        weekend: value('weekday') === 'Sat' || value('weekday') === 'Sun',
        activeScenario: undefined,
        scenarioRemaining: 0,
        populationFactor: 1,
      }),
    }))
  },
}))
