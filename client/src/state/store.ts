import { create } from 'zustand'

export type Building = {
  id: string
  name: string
  position: [number, number, number]
  size: [number, number, number]
  activity: number // 0..1
  occupancy: number // persons count inside
}

export type Person = {
  id: number
  position: [number, number, number]
  targetBuildingId: string
  speed: number
  gender?: 'male' | 'female'
  name: string
}

export type Settings = {
  running: boolean
  speed: number
  glow: boolean
  shadows: boolean
  labels: boolean
  visibleBuildings: Set<string>
}

export type Metrics = {
  totalPeople: number
  activeBuildings: number
  totalOccupancy: number
}

export type Environment = {
  season: 'hiver' | 'printemps' | 'ete' | 'automne'
  dayPeriod: 'matin' | 'midi' | 'apresmidi' | 'soir' | 'nuit'
  weekend: boolean
}

export type Directive = {
  buildingActivityChanges?: { buildingName: string; activityDelta: number }[]
  buildingActivitySet?: { buildingName: string; level: number }[]
  personFlows?: { from?: string; to: string; count: number }[]
  peopleAdd?: { count: number; gender?: 'male' | 'female'; to?: string }[]
  buildingAdd?: { name: string; position?: [number, number, number]; size?: [number, number, number] }[]
  global?: { speedMultiplier?: number; speedSet?: number; resetRandom?: boolean }
  visibility?: {
    hide?: string[]
    showOnly?: string[]
    showAll?: boolean
  }
  settings?: {
    glow?: boolean
    shadows?: boolean
    labels?: boolean
  }
  effects?: (
    | { type: 'activitySpike'; buildingName: string; delta: number; durationSec: number }
    | { type: 'pause'; durationSec: number }
  )[]
  environment?: Partial<Environment>
}

export type Store = {
  buildings: Building[]
  people: Person[]
  settings: Settings
  metrics: Metrics
  environment: Environment
  effects: Array<
    | { type: 'activityRevert'; buildingId: string; delta: number; remaining: number }
    | { type: 'pause'; remaining: number }
  >
  applyDirective: (d: Directive) => void
  tick: (dt: number) => void
  reset: () => void
  resetRandom: () => void
}

const initialBuildings: Building[] = [
  { id: 'sci', name: 'Sciences', position: [ -8, 2, -4 ], size: [4, 4, 6], activity: 0.5, occupancy: 0 },
  { id: 'eng', name: 'Ingénierie', position: [ 6, 2, -6 ], size: [5, 4, 5], activity: 0.5, occupancy: 0 },
  { id: 'med', name: 'Médecine', position: [ -2, 2, 6 ], size: [6, 4, 4], activity: 0.5, occupancy: 0 },
  { id: 'bus', name: 'Économie', position: [ 10, 2, 5 ], size: [4, 4, 4], activity: 0.5, occupancy: 0 },
  { id: 'art', name: 'Arts', position: [ -12, 2, 7 ], size: [3.5, 3.5, 5], activity: 0.5, occupancy: 0 },
  { id: 'law', name: 'Droit', position: [ 2, 2, -12 ], size: [4.5, 4, 3.5], activity: 0.5, occupancy: 0 },
  { id: 'lib', name: 'Bibliothèque', position: [ -10, 2, -12 ], size: [6, 4, 3], activity: 0.5, occupancy: 0 },
  { id: 'adm', name: 'Administration', position: [ 12, 2, -2 ], size: [4, 4, 4], activity: 0.5, occupancy: 0 }
]

function seededRandom(seed: number) {
  let t = seed >>> 0
  return () => (t = (t * 1664525 + 1013904223) >>> 0) / 4294967296
}

function initPeople(count: number, buildings: Building[]): Person[] {
  const rand = seededRandom(42)
  const arr: Person[] = []
  for (let i = 0; i < count; i++) {
    const b = buildings[Math.floor(rand() * buildings.length)]
    const pos: [number, number, number] = [
      b.position[0] + (rand() - 0.5) * b.size[0],
      0.1,
      b.position[2] + (rand() - 0.5) * b.size[2]
    ]
    arr.push({ id: i, position: pos, targetBuildingId: b.id, speed: 0.8 + rand() * 0.6, name: randomName(rand) })
  }
  return arr
}

// Simple French-like fake names
const FIRST_NAMES = ['Alex', 'Camille', 'Nadia', 'Hugo', 'Lina', 'Sofiane', 'Emma', 'Lucas', 'Zoé', 'Théo', 'Inès', 'Yanis', 'Maya', 'Noé', 'Léa', 'Nolan', 'Chloé', 'Enzo', 'Sarah', 'Adam']
const LAST_NAMES = ['Dubois', 'Moreau', 'Lefevre', 'Fontaine', 'Lambert', 'Mercier', 'Blanc', 'Rousseau', 'Legrand', 'Martel', 'Boucher', 'Renard', 'Garnier', 'Collet', 'Moulin', 'Lemoine', 'Francois', 'Noel', 'Chevalier', 'Perrin']
function randomName(randFn: () => number): string {
  const f = FIRST_NAMES[Math.floor(randFn() * FIRST_NAMES.length)]
  const l = LAST_NAMES[Math.floor(randFn() * LAST_NAMES.length)]
  return `${f} ${l}`
}

// Compute 2D AABB overlap on XZ-plane with a margin corridor
function overlapsXZ(aPos: [number, number, number], aSize: [number, number, number], bPos: [number, number, number], bSize: [number, number, number], margin = 1): boolean {
  const dx = Math.abs(aPos[0] - bPos[0])
  const dz = Math.abs(aPos[2] - bPos[2])
  const allowX = (aSize[0] + bSize[0]) / 2 + margin
  const allowZ = (aSize[2] + bSize[2]) / 2 + margin
  return dx < allowX && dz < allowZ
}

// Find a non-overlapping position on a coarse grid around the origin
function findNonOverlappingPosition(size: [number, number, number], buildings: Building[], bounds = 40, step = 3): [number, number, number] {
  // Try the origin first
  const candidates: Array<[number, number, number]> = []
  for (let r = 0; r <= bounds; r += step) {
    for (let x = -r; x <= r; x += step) {
      for (let z = -r; z <= r; z += step) {
        // Only consider the ring border to reduce candidates
        if (Math.abs(x) !== r && Math.abs(z) !== r) continue
        candidates.push([x, 2, z])
      }
    }
    // A tiny randomization between rings to avoid patterns
    if (r === 0) candidates.unshift([0, 2, 0])
  }
  for (const pos of candidates) {
    let ok = true
    for (const b of buildings) {
      if (overlapsXZ(pos, size, b.position, b.size)) { ok = false; break }
    }
    if (ok) return pos
  }
  // Fallback: place far away if somehow all are taken
  return [bounds + size[0], 2, bounds + size[2]]
}

export const useStore = create<Store>((set, get) => ({
  buildings: initialBuildings,
  people: initPeople(200, initialBuildings),
  settings: {
    running: true,
    speed: 1,
    glow: true,
    shadows: true,
    labels: true,
    visibleBuildings: new Set(initialBuildings.map(b => b.id))
  },
  metrics: { totalPeople: 200, activeBuildings: 8, totalOccupancy: 0 },
  environment: { season: 'automne', dayPeriod: 'apresmidi', weekend: false },
  effects: [],

  applyDirective: (d) => set(state => {
    let buildings = state.buildings.map(b => ({ ...b }))
    const settings = { ...state.settings }
    let envOut = state.environment
    if (d.buildingActivityChanges) {
      d.buildingActivityChanges.forEach(change => {
        const b = buildings.find(x => x.name.toLowerCase().includes(change.buildingName.toLowerCase()))
        if (b) b.activity = Math.max(0, Math.min(1, b.activity + change.activityDelta))
      })
    }
    if (d.global?.speedMultiplier) {
      settings.speed = Math.max(0.1, Math.min(5, settings.speed * d.global.speedMultiplier))
    }
    if (typeof d.global?.speedSet === 'number') {
      settings.speed = Math.max(0.1, Math.min(5, d.global.speedSet))
    }
    // Simple flow: retarget some people
    if (d.personFlows) {
      const rand = seededRandom(123)
      d.personFlows.forEach(flow => {
        const target = buildings.find(x => x.name.toLowerCase().includes(flow.to.toLowerCase()))
        if (!target) return
        for (let i = 0; i < flow.count; i++) {
          const p = state.people[Math.floor(rand() * state.people.length)]
          p.targetBuildingId = target.id
        }
      })
    }
    // Set absolute activity
    if (d.buildingActivitySet) {
      d.buildingActivitySet.forEach(s => {
        const b = buildings.find(x => x.name.toLowerCase().includes(s.buildingName.toLowerCase()))
        if (b) b.activity = Math.max(0, Math.min(1, s.level))
      })
    }

    // Queue timed effects
    let effectsOut = state.effects.slice()
    if (d.effects) {
      d.effects.forEach(e => {
        if (e.type === 'activitySpike') {
          const b = buildings.find(x => x.name.toLowerCase().includes(e.buildingName.toLowerCase()))
          if (b) {
            b.activity = Math.max(0, Math.min(1, b.activity + e.delta))
            effectsOut.push({ type: 'activityRevert', buildingId: b.id, delta: e.delta, remaining: e.durationSec })
          }
        } else if (e.type === 'pause') {
          settings.running = false
          effectsOut.push({ type: 'pause', remaining: e.durationSec })
        }
      })
    }

    // Add building(s) with non-overlapping placement
    if (d.buildingAdd) {
      d.buildingAdd.forEach(add => {
        const id = add.name.toLowerCase().replace(/\s+/g, '-').slice(0, 12) + '-' + Math.floor(Math.random()*1000)
        const size: [number, number, number] = add.size ?? [4 + Math.random()*2, 4, 4 + Math.random()*2]
        const desired: [number, number, number] | undefined = add.position ? [add.position[0], 2, add.position[2]] : undefined
        let pos: [number, number, number]
        if (desired) {
          // If desired overlaps, find the nearest free spot using the grid search
          const overlaps = buildings.some(b => overlapsXZ(desired, size, b.position, b.size))
          pos = overlaps ? findNonOverlappingPosition(size, buildings) : desired
        } else {
          pos = findNonOverlappingPosition(size, buildings)
        }
        buildings.push({ id, name: add.name, position: [pos[0], 2, pos[2]], size, activity: 0.5, occupancy: 0 })
        settings.visibleBuildings.add(id)
      })
    }

    // Add people
    if (d.peopleAdd) {
      d.peopleAdd.forEach(add => {
        const startIndex = state.people.length
        const target = add.to ? buildings.find(x => x.name.toLowerCase().includes(add.to!.toLowerCase())) : undefined
        for (let i = 0; i < add.count; i++) {
          const id = startIndex + i
          const b = target ?? buildings[Math.floor(Math.random()*buildings.length)]
          const pos: [number, number, number] = [
            b.position[0] + (Math.random() - 0.5) * b.size[0],
            0.1,
            b.position[2] + (Math.random() - 0.5) * b.size[2]
          ]
          state.people.push({ id, position: pos, targetBuildingId: b.id, speed: 0.8 + Math.random()*0.6, gender: add.gender, name: randomName(Math.random) })
        }
      })
    }
    // Visibility controls
    if (d.visibility) {
      const vb = new Set(settings.visibleBuildings)
      const byName = (name: string) => buildings.find(x => x.name.toLowerCase().includes(name.toLowerCase()))?.id
      if (d.visibility.showAll) {
        settings.visibleBuildings = new Set(buildings.map(b => b.id))
      }
      if (d.visibility.hide?.length) {
        for (const n of d.visibility.hide) {
          const id = byName(n); if (id) vb.delete(id)
        }
        settings.visibleBuildings = vb
      }
      if (d.visibility.showOnly?.length) {
        const set = new Set<string>()
        for (const n of d.visibility.showOnly) {
          const id = byName(n); if (id) set.add(id)
        }
        if (set.size > 0) settings.visibleBuildings = set
      }
    }

    // UI settings
    if (d.settings) {
      if (typeof d.settings.glow === 'boolean') settings.glow = d.settings.glow
      if (typeof d.settings.shadows === 'boolean') settings.shadows = d.settings.shadows
      if (typeof d.settings.labels === 'boolean') settings.labels = d.settings.labels
    }

    // Environment settings (merge into output rather than early return)
    if (d.environment) {
      envOut = { ...get().environment, ...d.environment }
    }

    // Reset random if requested
    if (d.global?.resetRandom) {
      const newBuildings = buildings.map(b => ({ ...b, activity: 0.2 + Math.random()*0.6, occupancy: 0 }))
      const newPeople = initPeople(state.people.length, newBuildings)
      return { buildings: newBuildings, people: newPeople, settings, effects: effectsOut, environment: envOut }
    }

    return { buildings, settings, effects: effectsOut, environment: envOut }
  }),

  tick: (dt) => set(state => {
    // Environment-driven baseline influences
    const env = state.environment
    // Compute a baseline activity target per building based on env
    const envActivityFor = (b: Building): number => {
      // base by building type heuristic
      const id = b.id
      let base = 0.5
      // Time of day: library/high in evening; med during day; admin lower evening
      switch (env.dayPeriod) {
        case 'matin':
          if (id==='lib') base += 0.05
          if (id==='adm') base += 0.1
          break
        case 'midi':
        case 'apresmidi':
          if (id==='sci' || id==='eng' || id==='bus' || id==='law' || id==='med') base += 0.15
          break
        case 'soir':
          if (id==='lib' || id==='art') base += 0.2
          if (id==='adm') base -= 0.1
          break
        case 'nuit':
          if (id==='lib') base += 0.1
          if (id==='adm') base -= 0.2
          base -= 0.15
          break
      }
      // Weekend effect: less admin/eco/law, more library/art events
      if (env.weekend) {
        if (id==='adm' || id==='bus' || id==='law') base -= 0.2
        if (id==='lib' || id==='art') base += 0.15
      }
      // Season: hiver increases indoor (lib), lowers outdoor-ish arts (gallery vibe)
      switch (env.season) {
        case 'hiver':
          if (id==='lib') base += 0.15
          if (id==='art') base -= 0.05
          break
        case 'ete':
          if (id==='art') base += 0.1
          break
        case 'printemps':
          if (id==='sci' || id==='eng') base += 0.05
          break
        case 'automne':
          if (id==='bus' || id==='law') base += 0.05
          break
      }
      return Math.max(0, Math.min(1, base))
    }
    // Nudge activity toward env target
    for (const b of state.buildings) {
      const target = envActivityFor(b)
      b.activity += (target - b.activity) * Math.min(1, dt * 0.3) // smooth convergence
    }

    // Adjust campus population target based on env
    const basePop = 200
    let factor = 1
    if (env.dayPeriod==='nuit') factor *= 0.6
    if (env.weekend) factor *= 0.8
    if (env.season==='hiver') factor *= 0.9
    const targetPop = Math.max(20, Math.round(basePop * factor))
    // Gradually move toward target population (add/remove up to ~20/sec)
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
        state.people.push({ id, position: pos, targetBuildingId: b.id, speed: 0.8 + Math.random()*0.6, name: randomName(Math.random) })
      }
    } else if (state.people.length > targetPop) {
      const toRemove = Math.min(state.people.length - targetPop, Math.ceil(20 * dt))
      state.people.splice(0, toRemove)
    }
    // Timed effects processing
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
    const buildings = state.buildings

    // Move people towards target buildings
    for (const p of state.people) {
      const target = buildings.find(b => b.id === p.targetBuildingId)!
      const dx = target.position[0] - p.position[0]
      const dz = target.position[2] - p.position[2]
      const dist = Math.hypot(dx, dz)
      const step = Math.min(dist, dt * p.speed * speed)
      if (dist > 0.01) {
        p.position[0] += (dx / dist) * step
        p.position[2] += (dz / dist) * step
      } else {
        // Pick a new target occasionally
        if (Math.random() < 0.01 + target.activity * 0.05) {
          const others = buildings.filter(b => b.id !== target.id)
          p.targetBuildingId = others[Math.floor(Math.random() * others.length)].id
        }
      }
    }

    // Recompute occupancy and metrics
    for (const b of buildings) b.occupancy = 0
    for (const p of state.people) {
      const nearest = buildings.reduce((a, b) => {
        const da = Math.hypot(a.position[0]-p.position[0], a.position[2]-p.position[2])
        const db = Math.hypot(b.position[0]-p.position[0], b.position[2]-p.position[2])
        return da < db ? a : b
      })
      nearest.occupancy += 1
    }

    const activeBuildings = buildings.filter(b => b.activity > 0.3).length
    const totalOccupancy = buildings.reduce((s, b) => s + b.occupancy, 0)

    return { buildings: [...buildings], metrics: { totalPeople: state.people.length, activeBuildings, totalOccupancy } }
  }),

  reset: () => set({ buildings: initialBuildings.map(b => ({...b})), people: initPeople(200, initialBuildings) }),
  resetRandom: () => set(state => {
    const bs = state.buildings.map(b => ({ ...b, activity: 0.2 + Math.random()*0.6, occupancy: 0 }))
    return { buildings: bs, people: initPeople(state.people.length, bs) }
  })
}))
