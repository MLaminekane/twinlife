import { create } from 'zustand'
import { initialBuildings, initPeople } from '../config/initialData'
import { applyDirective as applyDirectiveLogic } from '../lib/directives'
import { randomName } from '../lib/helpers'
import { initializeAgents, applyAgentActionsLogic } from './agentLogic'
import { updateAgentBehavior } from '../sim/agentBehavior'
import { computeEnvActivityTarget, computeTargetPopulation } from './environmentLogic'
import { processDepartmentDynamics } from './departmentLogic'
import { loadCustomBuildings, loadCustomPeople, saveState } from '../lib/persistence'
import type { 
  Building, Person, Settings, Metrics, Environment, Directive, 
  Department, NewsItem, TimeSample, Agent, Scenario, AgentAction, Store 
} from './types'

export type { 
  Building, Person, Settings, Metrics, Environment, Directive, 
  Department, NewsItem, TimeSample, Agent, Scenario, AgentAction, Store 
}

// Charger les données persistées au démarrage
const customBuildings = loadCustomBuildings()
const customPeople = loadCustomPeople()
const allBuildings = [...initialBuildings, ...customBuildings]

export const useStore = create<Store>((set, get) => ({
  buildings: allBuildings,
  people: [...initPeople(500, allBuildings), ...customPeople],
  settings: {
    running: true,
    speed: 1,
    glow: true,
    shadows: true,
    labels: true,
    visibleBuildings: new Set(allBuildings.map(b => b.id))
  },
  metrics: { totalPeople: 500 + customPeople.length, activeBuildings: allBuildings.length, totalOccupancy: 0 },
  environment: { season: 'automne', dayPeriod: 'apresmidi', weekend: false, gameTime: 14 },
  scenario: { investmentAI: 0.7, investmentHumanities: 0.3, llmAgents: false },
  // timeseries buffers
  timeseries: [] as any,
  tsAcc: 0 as any,
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

  applyDirective: (d) => set(state => {
    const result = applyDirectiveLogic(d, {
      buildings: state.buildings,
      people: state.people,
      settings: state.settings,
      environment: state.environment,
      effects: state.effects,
      news: state.news,
      buildingEvents: state.buildingEvents
    }, get)

    // Mettre à jour les métriques si le nombre de personnes a changé
    const updatedMetrics = result.people 
      ? { ...state.metrics, totalPeople: result.people.length }
      : state.metrics

    // Mettre à jour visibleBuildings si de nouveaux bâtiments ont été ajoutés
    if (result.buildings && result.settings?.visibleBuildings) {
      const allBuildingIds = new Set(result.buildings.map(b => b.id))
      const updatedVisible = new Set(
        [...result.settings.visibleBuildings].filter(id => allBuildingIds.has(id))
      )
      result.settings.visibleBuildings = updatedVisible
    }

    return { ...result, metrics: updatedMetrics }
  }),

  tick: (dt) => set(state => {
    // Update visual interactions
    if (state.deptInteractions.length) {
      state.deptInteractions = state.deptInteractions
        .map(e => ({ ...e, remaining: e.remaining - dt }))
        .filter(e => e.remaining > 0)
    }
    if (state.deptFlashes.length) {
      state.deptFlashes = state.deptFlashes
        .map(f => ({ ...f, remaining: f.remaining - dt }))
        .filter(f => f.remaining > 0)
    }

    // Process department dynamics
    processDepartmentDynamics(
      dt,
      state.departments,
      state.buildings,
      state.scenario,
      state.deptFlashes,
      state.deptInteractions,
      state.news
    )

    // Update Game Time (1 real sec = 10 game mins)
    const timeStep = (dt * 10) / 60
    state.environment.gameTime = (state.environment.gameTime + timeStep) % 24

    // Social Interaction Check (Every ~1s)
    const shouldCheckSocial = Math.random() < 0.05 // 5% chance per frame (~3 times/sec)
    
    // Update Agents (LangGraph Logic)
    for (let i = 0; i < state.people.length; i++) {
        const p = state.people[i]
        
        // Ensure state exists (migration for old data)
        if (!p.state) {
            p.state = { currentActivity: 'idle', mood: 'neutral', history: [] }
        }

        // If talking, stay put and decrement timer (simulated by chance to stop)
        if (p.state.currentActivity === 'talking') {
            if (Math.random() < 0.01) { // 1% chance to stop talking per frame
                p.state.currentActivity = 'idle'
                p.state.talkingWith = undefined
                p.state.mood = 'happy'
            }
            continue // Skip movement/behavior update while talking
        }

        // Social Check
        if (shouldCheckSocial && p.state && p.state.currentActivity !== 'sleep' && p.state.currentActivity !== 'work') {
            // Find neighbor
            // Optimization: Only check next 5 people in array (random enough if array is shuffled or just simple heuristic)
            // Better: Check people in same targetBuildingId if they are close
            for (let j = i + 1; j < Math.min(i + 10, state.people.length); j++) {
                const other = state.people[j]
                if (!other || !other.state) continue
                if (other.state.currentActivity === 'talking' || other.state.currentActivity === 'sleep') continue
                
                const dx = p.position[0] - other.position[0]
                const dz = p.position[2] - other.position[2]
                if (dx*dx + dz*dz < 2.0) { // Close enough (< 1.4m)
                    // Interaction chance
                    if (Math.random() < 0.3) {
                        p.state.currentActivity = 'talking'
                        p.state.talkingWith = other.id
                        other.state.currentActivity = 'talking'
                        other.state.talkingWith = p.id
                        break
                    }
                }
            }
        }

        const decision = updateAgentBehavior(p, state.environment.gameTime, state.buildings, state.environment)
        if (decision.targetId) p.targetBuildingId = decision.targetId
        if (decision.mood) p.state.mood = decision.mood as any
    }

    // Apply environment influences
    for (const b of state.buildings) {
      const target = computeEnvActivityTarget(b, state.environment)
      b.activity += (target - b.activity) * Math.min(1, dt * 0.3)
    }

    // Adjust population based on environment
    const targetPop = computeTargetPopulation(state.environment)
    if (state.people.length < targetPop) {
      const toAdd = Math.min(targetPop - state.people.length, Math.ceil(20 * dt))
      for (let i = 0; i < toAdd; i++) {
        const b = state.buildings.reduce((a, c) => (c.activity > a.activity ? c : a), state.buildings[0])
        const pos: [number, number, number] = [
          b.position[0] + (Math.random() - 0.5) * b.size[0],
          0.1,
          b.position[2] + (Math.random() - 0.5) * b.size[2]
        ]
        const id = state.people.length ? Math.max(...state.people.map(p => p.id)) + 1 : 0
        state.people.push({ 
            id, 
            position: pos, 
            targetBuildingId: b.id, 
            speed: 0.8 + Math.random() * 0.6, 
            name: randomName(Math.random),
            role: 'visitor',
            traits: { introversion: Math.random(), punctuality: Math.random(), energy: 1 },
            schedule: [{ time: 9, activity: 'leisure' }, { time: 22, activity: 'sleep', targetId: 'res-family' }],
            state: { currentActivity: 'idle', mood: 'neutral', history: [] }
        })
      }
    } else if (state.people.length > targetPop) {
      const toRemove = Math.min(state.people.length - targetPop, Math.ceil(20 * dt))
      state.people.splice(0, toRemove)
    }

    // Process timed effects
    if (state.effects.length) {
      const remaining: typeof state.effects = []
      for (const eff of state.effects) {
        const newRem = eff.remaining - dt
        if (newRem <= 0) {
          if (eff.type === 'activityRevert') {
            const b = state.buildings.find(x => x.id === eff.buildingId)
            if (b) b.activity = Math.max(0, Math.min(1, b.activity - eff.delta))
          } else if (eff.type === 'pause') {
            state.settings.running = true
          }
        } else {
          remaining.push({ ...eff, remaining: newRem })
        }
      }
      state.effects = remaining
    }

    if (!state.settings.running) return {}
    const speed = state.settings.speed
    let buildings = state.buildings.map(b => ({ ...b }))
    const nextPeople = [...state.people]

    // Move people towards target buildings
    for (const p of nextPeople) {
      let target = buildings.find(b => b.id === p.targetBuildingId)
      
      // Safety check: if target building is missing (e.g. deleted), assign a new one
      if (!target) {
        target = buildings[Math.floor(Math.random() * buildings.length)]
        p.targetBuildingId = target.id
      }

      const dx = target.position[0] - p.position[0]
      const dz = target.position[2] - p.position[2]
      const dist = Math.hypot(dx, dz)
      const step = Math.min(dist, dt * p.speed * speed)
      if (dist > 0.01) {
        p.position[0] += (dx / dist) * step
        p.position[2] += (dz / dist) * step
      } else {
        if (Math.random() < 0.01 + target.activity * 0.05) {
          const others = buildings.filter(b => b.id !== target.id)
          if (others.length > 0) {
            p.targetBuildingId = others[Math.floor(Math.random() * others.length)].id
          }
        }
      }
    }

    // Recompute occupancy
    for (const b of buildings) b.occupancy = 0
    for (const p of nextPeople) {
      const nearest = buildings.reduce((a, b) => {
        const da = Math.hypot(a.position[0] - p.position[0], a.position[2] - p.position[2])
        const db = Math.hypot(b.position[0] - p.position[0], b.position[2] - p.position[2])
        return da < db ? a : b
      })
      nearest.occupancy += 1
    }

    const activeBuildings = buildings.filter(b => b.activity > 0.3).length
    const totalOccupancy = buildings.reduce((s, b) => s + b.occupancy, 0)
    const totalPublications = state.departments.reduce((s, d) => s + d.publications, 0)
    const activeCollaborations = state.deptInteractions.filter(e => e.type === 'collab').length
    const activeRivalries = state.deptInteractions.filter(e => e.type === 'rivalry').length

    // Update time series
    state.tsAcc = (state.tsAcc ?? 0) + dt
    if (state.tsAcc >= 1) {
      state.tsAcc = 0
      const sample = { 
        ts: Date.now(), 
        ai: state.scenario.investmentAI, 
        hum: state.scenario.investmentHumanities, 
        pubs: totalPublications, 
        collabs: activeCollaborations, 
        rivalries: activeRivalries, 
        occupancy: totalOccupancy, 
        activeBuildings 
      } as TimeSample
      state.timeseries = ([...(state.timeseries ?? []), sample]).slice(-180)
    }

    return { 
      buildings: [...buildings], 
      metrics: { 
        totalPeople: state.people.length, 
        activeBuildings, 
        totalOccupancy, 
        totalPublications, 
        activeCollaborations, 
        activeRivalries 
      }, 
      timeseries: state.timeseries, 
      tsAcc: state.tsAcc 
    }
  }),

  reset: () => set({ buildings: initialBuildings.map(b => ({ ...b })), people: initPeople(200, initialBuildings) }),
  resetRandom: () => set(state => {
    const bs = state.buildings.map(b => ({ ...b, activity: 0.2 + Math.random() * 0.6, occupancy: 0 }))
    return { buildings: bs, people: initPeople(state.people.length, bs) }
  }),
  setSelectedPerson: (id) => set({ selectedPersonId: id })
  ,
  setHoveredBuilding: (id) => set({ hoveredBuildingId: id }),
  setSelectedBuilding: (id) => set({ selectedBuildingId: id }),
  setScenario: (s) => set(state => ({ scenario: { ...state.scenario, ...s } })),
  applyAgentActions: (acts) => set(state => {
    const newNews = [...state.news]
    applyAgentActionsLogic(
      acts,
      state.agents,
      state.departments,
      state.buildings,
      state.deptFlashes,
      state.deptInteractions,
      newNews,
      state.scenario,
      state.people
    )
    return { news: newNews.slice(-50) }
  }),

  fetchRealWeather: async () => {
    const { fetchWeather } = await import('../lib/weather')
    const w = await fetchWeather()

    // Infer season/period from date/weather
    const now = new Date()
    const month = now.getMonth() // 0-11
    const hour = now.getHours()
    const day = now.getDay()

    let season: Environment['season'] = 'ete'
    if (month >= 11 || month <= 2) season = 'hiver'
    else if (month >= 3 && month <= 5) season = 'printemps'
    else if (month >= 9 && month <= 10) season = 'automne'

    let dayPeriod: Environment['dayPeriod'] = 'midi'
    if (hour >= 5 && hour < 11) dayPeriod = 'matin'
    else if (hour >= 11 && hour < 14) dayPeriod = 'midi'
    else if (hour >= 14 && hour < 18) dayPeriod = 'apresmidi'
    else if (hour >= 18 && hour < 22) dayPeriod = 'soir'
    else dayPeriod = 'nuit'

    set(state => ({
      environment: {
        ...state.environment,
        realTime: true,
        temperature: w.temperature,
        condition: w.condition,
        season,
        dayPeriod,
        weekend: day === 0 || day === 6
      }
    }))
  }
}))
