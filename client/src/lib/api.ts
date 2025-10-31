import { z } from 'zod'
import type { Directive as StoreDirective } from '../state/store'

const DirectiveSchema = z.object({
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

export async function sendLLM(prompt: string): Promise<StoreDirective> {
  const res = await fetch('/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  })
  if (!res.ok) throw new Error('LLM API error')
  const json = await res.json()
  const parsed = DirectiveSchema.safeParse(json)
  if (!parsed.success) throw new Error('Invalid directive from server')
  return parsed.data as StoreDirective
}

// Agent API
const AgentInputSchema = z.object({
  id: z.string(),
  role: z.union([z.literal('prof'), z.literal('student'), z.literal('rector')]),
  dept: z.string().optional(),
  buildingId: z.string().optional(),
  biases: z.record(z.string(), z.number()).optional(),
  goals: z.array(z.string()).optional(),
  memory: z.array(z.string()).optional()
})
const WorldSchema = z.object({ investments: z.object({ ai: z.number(), humanities: z.number() }), departments: z.array(z.object({ id: z.string(), name: z.string(), publications: z.number(), activity: z.number() })), recentNews: z.array(z.string()).optional() })
const AgentBatchSchema = z.object({ agents: z.array(AgentInputSchema), world: WorldSchema })
const AgentActionSchema = z.object({ id: z.string(), publish: z.boolean().optional(), seekCollabWith: z.string().nullable().optional(), challenge: z.string().nullable().optional(), moveTo: z.string().nullable().optional(), message: z.string().optional(), setInvestments: z.object({ ai: z.number(), humanities: z.number() }).optional() })

export type AgentAction = z.infer<typeof AgentActionSchema>

export async function sendAgentsDecision(payload: z.infer<typeof AgentBatchSchema>): Promise<{ actions: AgentAction[] }> {
  const res = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  if (!res.ok) throw new Error('Agent API error')
  const json = await res.json()
  const actions = Array.isArray(json.actions) ? json.actions : []
  const parsed = actions.map((a: any) => AgentActionSchema.safeParse(a)).filter((p: any) => p.success).map((p: any) => p.data)
  return { actions: parsed }
}
