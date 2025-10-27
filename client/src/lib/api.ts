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
