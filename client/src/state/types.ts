export type Building = {
  id: string
  name: string
  position: [number, number, number]
  size: [number, number, number]
  activity: number // 0..1
  occupancy: number // persons count inside
  zone?: 'campus' | 'downtown' | 'residential' | 'commercial' // Zone d'appartenance
  isCustom?: boolean // Marqueur pour les bâtiments créés dynamiquement
  customData?: Record<string, any> // Données personnalisées
}

export type Person = {
  id: number
  position: [number, number, number]
  targetBuildingId: string
  speed: number
  gender?: 'male' | 'female'
  name: string
  // Métadonnées professionnelles
  role?: 'student' | 'employee' | 'professor' | 'visitor' | 'worker'
  workplace?: string // ID du bâtiment où la personne travaille
  department?: string // Département d'appartenance
  customData?: Record<string, any> // Données personnalisées
  
  // LangGraph Agent Properties
  traits: {
    introversion: number // 0..1 (1 = avoids crowds)
    punctuality: number // 0..1 (1 = strictly follows schedule)
    energy: number // 0..1
  }
  schedule: {
    time: number // 0-23
    activity: 'work' | 'study' | 'eat' | 'sleep' | 'leisure'
    targetId?: string
  }[]
  state: {
    currentActivity: string
    mood: 'happy' | 'tired' | 'stressed' | 'neutral'
    history: string[] // Last 5 building IDs
  }
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
  totalPublications?: number
  activeCollaborations?: number
  activeRivalries?: number
}

export type Environment = {
  season: 'hiver' | 'printemps' | 'ete' | 'automne'
  dayPeriod: 'matin' | 'midi' | 'apresmidi' | 'soir' | 'nuit'
  weekend: boolean
  realTime?: boolean
  temperature?: number
  gameTime: number // 0-24
  condition?: 'clear' | 'rain' | 'snow' | 'cloudy'
}

export type Directive = {
  buildingActivityChanges?: { buildingName: string; activityDelta: number }[]
  buildingActivitySet?: { buildingName: string; level: number }[]
  personFlows?: { from?: string; to: string; count: number }[]
  peopleAdd?: { 
    count: number
    gender?: 'male' | 'female'
    to?: string
    name?: string // Nom spécifique de la personne
    role?: 'student' | 'employee' | 'professor' | 'visitor' | 'worker'
    workplace?: string // Bâtiment de travail
    department?: string
    customData?: Record<string, any>
  }[]
  buildingEvents?: {
    buildingName: string
    events: { text: string; type: 'urgent' | 'info' | 'sale'; time?: string }[]
  }[]
  buildingAdd?: { 
    name: string
    position?: [number, number, number]
    size?: [number, number, number]
    zone?: 'campus' | 'downtown' | 'residential' | 'commercial'
    activity?: number
  }[]
  buildingRemove?: string[] // IDs des bâtiments à supprimer
  peopleRemove?: { name?: string; id?: number; all?: boolean }[] // Supprimer des personnes
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

export type Department = {
  id: 'eco' | 'bio' | 'eng'
  name: string
  buildingId: string
  publications: number
  collaborations: Record<string, number>
  rivalries: Record<string, number>
}

export type NewsItem = {
  id: number
  ts: number
  kind: 'pub' | 'collab' | 'rivalry' | 'people' | 'building' | 'activity' | 'system'
  text: string
}

export type TimeSample = { 
  ts: number
  ai: number
  hum: number
  pubs: number
  collabs: number
  rivalries: number
  occupancy: number
  activeBuildings: number
}

export type AgentRole = 'prof' | 'student' | 'rector'

export type Agent = {
  id: string
  role: AgentRole
  dept?: 'eco' | 'bio' | 'eng' | 'art' | 'law' | 'med' | 'lib' | 'adm'
  buildingId?: string
  biases: { research: number; collab: number; rivalry: number; ai: number; humanities: number }
  memory?: string[]
  h?: number
}

export type Scenario = {
  investmentAI: number // 0..1
  investmentHumanities: number // 0..1
  llmAgents: boolean
}

export type AgentAction = { 
  id: string
  publish?: boolean
  seekCollabWith?: string | null
  challenge?: string | null
  moveTo?: string | null
  message?: string
  setInvestments?: { ai: number; humanities: number }
}

export type Store = {
  buildings: Building[]
  people: Person[]
  settings: Settings
  metrics: Metrics
  environment: Environment
  scenario: Scenario
  timeseries?: TimeSample[]
  tsAcc?: number
  selectedPersonId: number | null
  hoveredBuildingId: string | null
  selectedBuildingId: string | null
  effects: Array<
    | { type: 'activityRevert'; buildingId: string; delta: number; remaining: number }
    | { type: 'pause'; remaining: number }
  >
  departments: Department[]
  deptInteractions: Array<{ from: string; to: string; type: 'collab' | 'rivalry'; remaining: number }>
  deptFlashes: Array<{ buildingId: string; remaining: number }>
  news: NewsItem[]
  buildingEvents: Record<string, { text: string; type: 'urgent' | 'info' | 'sale'; time?: string }[]>
  agents: Agent[]
  applyDirective: (d: Directive) => void
  tick: (dt: number) => void
  reset: () => void
  resetRandom: () => void
  setSelectedPerson: (id: number | null) => void
  setHoveredBuilding: (id: string | null) => void
  setSelectedBuilding: (id: string | null) => void
  setScenario: (s: Partial<Scenario>) => void
  applyAgentActions: (acts: AgentAction[]) => void
  fetchRealWeather: () => Promise<void>
}
