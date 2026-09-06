import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { initialBuildings, initPeople } from '../config/initialData'
import { dayPeriodForTime, eventProbability, normalizeEnvironment } from '../state/environmentLogic'
import { ensurePersonRoute, reconcilePersonBuilding, updatePersonTravel } from '../lib/world'
import { updateAgentBehavior } from '../sim/agentBehavior'
import type { Store } from '../state/types'

let useStore: typeof import('../state/store')['useStore']
let launchScenario: typeof import('../lib/urbanInsights')['launchScenario']
let getUrbanInsights: typeof import('../lib/urbanInsights')['getUrbanInsights']
let initial: Store

beforeAll(async () => {
  const values = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  })
  ;({ useStore } = await import('../state/store'))
  ;({ launchScenario, getUrbanInsights } = await import('../lib/urbanInsights'))
  initial = useStore.getState()
})

beforeEach(() => {
  useStore.setState({
    ...initial,
    buildings: structuredClone(initial.buildings), people: structuredClone(initial.people),
    environment: { ...initial.environment, gameTime: 14, dayPeriod: 'apresmidi' },
    settings: { ...initial.settings, running: true, speed: 1 },
    departments: structuredClone(initial.departments), news: [], effects: [], deptFlashes: [], deptInteractions: [],
    timeseries: [], tsAcc: 0, populationAcc: 0,
  }, true)
  vi.spyOn(Math, 'random').mockReturnValue(0.99)
})
afterEach(() => vi.restoreAllMocks())

describe('simulation clock and snapshots', () => {
  it('freezes time, people, activity, research and history while paused', () => {
    useStore.setState(state => ({ settings: { ...state.settings, running: false } }))
    const before = useStore.getState()
    const serialized = JSON.stringify(before)
    before.tick(1)
    expect(useStore.getState()).toBe(before)
    expect(JSON.stringify(before)).toBe(serialized)
  })

  it('honours timed pauses without advancing the simulated world', () => {
    useStore.getState().applyDirective({ effects: [{ type: 'pause', durationSec: 2 }] })
    const before = useStore.getState()
    before.tick(1)
    expect(useStore.getState().settings.running).toBe(false)
    useStore.getState().tick(1)
    expect(useStore.getState().settings.running).toBe(true)
    expect(useStore.getState().environment).toBe(before.environment)
    expect(useStore.getState().people).toBe(before.people)
  })

  it('scales time, travel, energy and timed effects by the same speed', () => {
    const fixture = useStore.getState()
    const person = structuredClone(fixture.people[0])
    person.targetBuildingId = 'tech-tower'
    person.state.commandRemaining = 100
    const people = [person, ...fixture.people.slice(1)]
    const effects: Store['effects'] = [{ type: 'activityRevert', buildingId: 'tech-tower', delta: 0.1, remaining: 10 }]
    useStore.setState({ people, effects })
    const start = useStore.getState()
    start.tick(0.5)
    const normal = useStore.getState()
    useStore.setState({ ...start, settings: { ...start.settings, speed: 2 } }, true)
    useStore.getState().tick(0.25)
    const fast = useStore.getState()
    expect(fast.environment.gameTime).toBeCloseTo(normal.environment.gameTime, 10)
    expect(fast.people[0].position).toEqual(normal.people[0].position)
    expect(fast.people[0].traits.energy).toBe(normal.people[0].traits.energy)
    expect(fast.effects).toEqual(normal.effects)
    expect(start.environment.gameTime).toBe(14)
    expect(start.people[0].traits.energy).toBe(1)
  })

  it('updates the day period at midnight and preserves previous snapshots', () => {
    useStore.setState(state => ({ environment: { ...state.environment, gameTime: 23.999, dayPeriod: 'nuit' } }))
    const before = useStore.getState()
    const original = JSON.stringify(before)
    before.tick(0.1)
    expect(useStore.getState().environment.gameTime).toBeLessThan(0.01)
    expect(useStore.getState().environment.dayPeriod).toBe('nuit')
    expect(JSON.stringify(before)).toBe(original)
    expect(dayPeriodForTime(5)).toBe('matin')
    expect(dayPeriodForTime(18)).toBe('soir')
    expect(normalizeEnvironment(before.environment, { dayPeriod: 'matin' }).gameTime).toBe(8)
  })

  it('uses fractional population budgets and protects custom citizens', () => {
    useStore.getState().applyDirective({ peopleAdd: [{ count: 2, name: 'Citoyen personnalisé', role: 'visitor' }] })
    const added = useStore.getState().people.filter(person => person.isCustom).map(person => person.id)
    useStore.setState(state => ({ environment: { ...state.environment, populationFactor: 0.5 } }))
    const before = useStore.getState().people.length
    useStore.getState().tick(0.01)
    expect(useStore.getState().people.length).toBe(before)
    for (let index = 0; index < 40; index++) useStore.getState().tick(1)
    expect(useStore.getState().people.filter(person => added.includes(person.id))).toHaveLength(2)
    expect(useStore.getState().metrics.totalOccupancy + getUrbanInsights(useStore.getState()).walking).toBe(useStore.getState().people.length)
  })
})

describe('citizen navigation and schedules', () => {
  it('walks out of the source building and arrives at the intended destination', () => {
    let person = initPeople(1, initialBuildings)[0]
    const source = person.currentBuildingId
    person = ensurePersonRoute({ ...person, targetBuildingId: 'tech-tower' }, initialBuildings)
    person = reconcilePersonBuilding(updatePersonTravel(person, initialBuildings, 0.1, 1), initialBuildings)
    expect(person.presence).toBe('walking')
    expect(person.route!.length).toBeGreaterThan(0)
    expect(person.currentBuildingId).not.toBe(source)
    for (let index = 0; index < 1000 && person.presence === 'walking'; index++) {
      person = reconcilePersonBuilding(updatePersonTravel(person, initialBuildings, 0.25, 1), initialBuildings)
    }
    expect(person.presence).toBe('inside')
    expect(person.currentBuildingId).toBe('tech-tower')
  })

  it('consumes distance consistently across multiple waypoints', () => {
    const person = { ...initPeople(1, initialBuildings)[0], position: [0, 0, 0] as [number, number, number], speed: 1, route: [[1, 0, 0], [2, 0, 0], [3, 0, 0]] as [number, number, number][] }
    const whole = updatePersonTravel(person, initialBuildings, 2.5, 1)
    const halves = updatePersonTravel(updatePersonTravel(person, initialBuildings, 1.25, 1), initialBuildings, 1.25, 1)
    expect(whole.position).toEqual([2.5, 0, 0])
    expect(halves.position).toEqual(whole.position)
  })

  it('continues afternoon work until the next scheduled activity and sleeps across midnight', () => {
    const person = initPeople(1, initialBuildings)[0]
    person.schedule = [{ time: 9, activity: 'work', targetId: 'tech-tower' }, { time: 18, activity: 'leisure' }, { time: 23, activity: 'sleep' }]
    updateAgentBehavior(person, 16, initialBuildings, { ...initial.environment, gameTime: 16 }, 1)
    expect(person.state.currentActivity).toBe('work')
    const decision = updateAgentBehavior(person, 2, initialBuildings, { ...initial.environment, gameTime: 2 }, 1)
    expect(person.state.currentActivity).toBe('sleep')
    expect(decision.targetId).toBe(person.homeBuildingId)
  })

  it('assigns distinct flows, clears stale routes and respects the requested source', () => {
    const state = useStore.getState()
    const source = state.buildings.find(building => state.people.filter(person => person.currentBuildingId === building.id).length >= 4)!
    const before = JSON.stringify(state.people)
    state.applyDirective({ personFlows: [{ from: source.id, to: 'tech-tower', count: 4 }] })
    const commanded = useStore.getState().people.filter(person => person.state.commandRemaining === 120)
    expect(commanded).toHaveLength(4)
    expect(commanded.every(person => person.currentBuildingId === source.id && person.targetBuildingId === 'tech-tower')).toBe(true)
    expect(JSON.stringify(state.people)).toBe(before)
  })

  it('makes event probabilities independent of frame subdivision', () => {
    const whole = eventProbability(0.2, 1)
    const sixtyFrames = 1 - (1 - eventProbability(0.2, 1 / 60)) ** 60
    expect(sixtyFrames).toBeCloseTo(whole, 12)
  })
})

describe('urban scenarios and estimates', () => {
  it.each(['commute', 'festival', 'storm', 'night'])('enacts %s with coherent time, routes, activity and population', id => {
    launchScenario(id)
    const state = useStore.getState()
    expect(state.settings.running).toBe(true)
    expect(state.environment.activeScenario).toBe(id)
    expect(state.environment.dayPeriod).toBe(dayPeriodForTime(state.environment.gameTime))
    expect(state.environment.populationFactor).not.toBe(1)
    expect(state.people.some(person => person.targetBuildingId !== person.currentBuildingId)).toBe(true)
    expect(state.people.every(person => state.buildings.some(building => building.id === person.targetBuildingId))).toBe(true)
    expect(state.buildings.every(building => building.activity >= 0 && building.activity <= 1)).toBe(true)
    state.tick(1 / 30)
    expect(getUrbanInsights(useStore.getState()).walking).toBeGreaterThan(0)
  })

  it('models stronger heating demand and lower comfort in a winter storm', () => {
    launchScenario('festival')
    useStore.getState().tick(0.1)
    const summer = getUrbanInsights(useStore.getState())
    launchScenario('storm')
    useStore.getState().tick(0.1)
    const winter = getUrbanInsights(useStore.getState())
    expect(winter.energyKw).toBeGreaterThan(summer.energyKw)
    expect(winter.comfort).toBeLessThan(summer.comfort)
    expect(winter.traffic).toBeGreaterThanOrEqual(0)
    expect(winter.traffic).toBeLessThanOrEqual(100)
  })
})

describe('persistence and structural directives', () => {
  it('persists only explicitly created citizens and migrates old seed copies', async () => {
    const { saveCustomPeople, loadCustomPeople } = await import('../lib/persistence')
    const seeded = initPeople(500, initialBuildings)
    const custom = { ...seeded[2], id: 2, name: 'Personnage conservé', isCustom: true }
    saveCustomPeople([...seeded, custom])
    expect(loadCustomPeople().map(person => person.name)).toEqual(['Personnage conservé'])
    localStorage.setItem('twinlife_v3_custom_people', JSON.stringify({ people: [...seeded, { ...custom, isCustom: undefined }] }))
    expect(loadCustomPeople().map(person => person.name)).toEqual(['Personnage conservé'])
    localStorage.removeItem('twinlife_v3_custom_people')
  })

  it('reassigns homes and schedules on building removal and always keeps a valid world', () => {
    const state = useStore.getState()
    state.applyDirective({ buildingRemove: state.buildings.map(building => building.id) })
    const next = useStore.getState()
    expect(next.buildings).toHaveLength(1)
    const remaining = next.buildings[0].id
    expect(next.people.every(person => person.targetBuildingId === remaining && person.homeBuildingId === remaining && person.schedule.every(task => !task.targetId || task.targetId === remaining))).toBe(true)
    expect(next.settings.visibleBuildings.size).toBe(1)
  })
})
