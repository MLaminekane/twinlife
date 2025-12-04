import { z } from 'zod'

// Directive Schema
export const DirectiveSchema = z.object({
  buildingActivityChanges: z.array(z.object({ buildingName: z.string(), activityDelta: z.number() })).optional(),
  buildingActivitySet: z.array(z.object({ buildingName: z.string(), level: z.number() })).optional(),
  personFlows: z.array(z.object({ from: z.string().optional(), to: z.string(), count: z.number() })).optional(),
  peopleAdd: z.array(z.object({ count: z.number(), gender: z.union([z.literal('male'), z.literal('female')]).optional(), to: z.string().optional() })).optional(),
  buildingAdd: z.array(z.object({ name: z.string(), position: z.tuple([z.number(), z.number(), z.number()]).optional(), size: z.tuple([z.number(), z.number(), z.number()]).optional() })).optional(),
  global: z.object({ speedMultiplier: z.number().optional(), speedSet: z.number().optional(), resetRandom: z.boolean().optional() }).partial().optional(),
  visibility: z.object({
    hide: z.array(z.string()).optional(),
    showOnly: z.array(z.string()).optional(),
    showAll: z.boolean().optional()
  }).partial().optional(),
  settings: z.object({ glow: z.boolean().optional(), shadows: z.boolean().optional(), labels: z.boolean().optional() }).partial().optional(),
  effects: z.array(
    z.union([
      z.object({ type: z.literal('activitySpike'), buildingName: z.string(), delta: z.number(), durationSec: z.number() }),
      z.object({ type: z.literal('pause'), durationSec: z.number() })
    ])
  ).optional(),
  environment: z.object({
    season: z.union([z.literal('hiver'), z.literal('printemps'), z.literal('ete'), z.literal('automne')]).optional(),
    dayPeriod: z.union([z.literal('matin'), z.literal('midi'), z.literal('apresmidi'), z.literal('soir'), z.literal('nuit')]).optional(),
    weekend: z.boolean().optional()
  }).partial().optional()
})

export type Directive = z.infer<typeof DirectiveSchema>

// Agent Schemas
export const AgentInputSchema = z.object({
  id: z.string(),
  role: z.union([z.literal('prof'), z.literal('student'), z.literal('rector')]),
  dept: z.union([z.literal('eco'), z.literal('bio'), z.literal('eng'), z.literal('art'), z.literal('law'), z.literal('med'), z.literal('lib'), z.literal('adm')]).optional(),
  buildingId: z.string().optional(),
  biases: z.object({ 
    research: z.number().min(0).max(1).default(0.5), 
    collab: z.number().min(0).max(1).default(0.5), 
    rivalry: z.number().min(0).max(1).default(0.3), 
    ai: z.number().min(0).max(1).default(0.5), 
    humanities: z.number().min(0).max(1).default(0.5) 
  }).partial(),
  goals: z.array(z.string()).optional(),
  memory: z.array(z.string()).max(10).optional()
})

export type AgentInput = z.infer<typeof AgentInputSchema>

export const WorldSchema = z.object({
  investments: z.object({ ai: z.number().min(0).max(1), humanities: z.number().min(0).max(1) }),
  departments: z.array(z.object({ 
    id: z.string(), 
    name: z.string(), 
    publications: z.number().int().nonnegative(), 
    activity: z.number().min(0).max(1) 
  })),
  recentNews: z.array(z.string()).max(20).optional()
})

export type World = z.infer<typeof WorldSchema>

export const AgentActionSchema = z.object({
  id: z.string(),
  publish: z.boolean().optional(),
  seekCollabWith: z.string().nullable().optional(),
  challenge: z.string().nullable().optional(),
  moveTo: z.string().nullable().optional(),
  message: z.string().optional(),
  setInvestments: z.object({ ai: z.number().min(0).max(1), humanities: z.number().min(0).max(1) }).optional()
})

export type AgentAction = z.infer<typeof AgentActionSchema>

export const AgentBatchSchema = z.object({ 
  agents: z.array(AgentInputSchema).min(1).max(20), 
  world: WorldSchema 
})

export type AgentBatch = z.infer<typeof AgentBatchSchema>

// API Request Schemas
export const PromptSchema = z.object({ prompt: z.string().min(1).max(2000) })
