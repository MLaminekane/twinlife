import { z } from 'zod'
import OpenAI from 'openai'

export const AgentInputSchema = z.object({
  id: z.string(),
  role: z.union([z.literal('prof'), z.literal('student'), z.literal('rector')]),
  dept: z.union([z.literal('eco'), z.literal('bio'), z.literal('eng'), z.literal('art'), z.literal('law'), z.literal('med'), z.literal('lib'), z.literal('adm')]).optional(),
  buildingId: z.string().optional(),
  biases: z.object({ research: z.number().min(0).max(1).default(0.5), collab: z.number().min(0).max(1).default(0.5), rivalry: z.number().min(0).max(1).default(0.3), ai: z.number().min(0).max(1).default(0.5), humanities: z.number().min(0).max(1).default(0.5) }).partial(),
  goals: z.array(z.string()).optional(),
  memory: z.array(z.string()).max(10).optional()
})
export type AgentInput = z.infer<typeof AgentInputSchema>

export const WorldSchema = z.object({
  investments: z.object({ ai: z.number().min(0).max(1), humanities: z.number().min(0).max(1) }),
  departments: z.array(z.object({ id: z.string(), name: z.string(), publications: z.number().int().nonnegative(), activity: z.number().min(0).max(1) })),
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

export const AgentBatchSchema = z.object({ agents: z.array(AgentInputSchema).min(1).max(20), world: WorldSchema })
export type AgentBatch = z.infer<typeof AgentBatchSchema>

const ACTION_SYSTEM = `Tu joues des agents universitaires (professeur, étudiant, recteur). Pour chaque agent reçu, renvoie UNIQUEMENT une liste JSON d'actions respectant ce schema:
{
  "actions": [
    { "id": string, "publish"?: boolean, "seekCollabWith"?: string|null, "challenge"?: string|null, "moveTo"?: string|null, "message"?: string, "setInvestments"?: { "ai": number, "humanities": number } }
  ]
}
Règles:
- "seekCollabWith" et "challenge" sont des id de départements (ex: "eng", "bio", "eco").
- "moveTo" est un id de bâtiment (si fourni par l'entrée), sinon null.
- Prends en compte les investissements (ai vs humanities) et les biais/goals d'agent.
- Le recteur peut renvoyer "setInvestments" pour faire évoluer la politique budgétaire (les deux poids doivent somme ~1).
- Ne mets aucun texte hors JSON.`

function fallbackAgentDecide(agent: AgentInput, world: World): AgentAction {
  const aiW = world.investments.ai
  const humW = world.investments.humanities
  const b = { research: agent.biases?.research ?? 0.5, collab: agent.biases?.collab ?? 0.5, rivalry: agent.biases?.rivalry ?? 0.3, ai: agent.biases?.ai ?? 0.5, humanities: agent.biases?.humanities ?? 0.5 }
  const isAIInclined = (agent.dept === 'eng' || agent.dept === 'bio')
  const isHumInclined = (agent.dept === 'art' || agent.dept === 'law' || agent.dept === 'eco')
  // memory nudges
  const mem = (agent.memory ?? []).slice(-5).join(' ').toLowerCase()
  const memCollab = mem.includes('collab') ? 0.1 : 0
  const memRiv = mem.includes('rival') || mem.includes('défie') ? 0.07 : 0
  const memPub = mem.includes('publ') ? 0.1 : 0
  const pubProb = 0.2 + 0.6 * (b.research * (isAIInclined ? aiW : isHumInclined ? humW : 0.5)) + memPub
  const collabProb = 0.15 + 0.5 * b.collab * (aiW*0.6 + humW*0.4) + memCollab
  const rivalProb = 0.05 + 0.4 * b.rivalry * (aiW*0.4 + (1 - humW)*0.3) + memRiv

  const rnd = Math.random()
  const action: AgentAction = { id: agent.id }
  if (agent.role === 'rector') {
    // rector adjusts investments slightly toward his bias and recent world signals
    const dir = (b.ai - b.humanities) + (aiW - humW) * 0.2
    if (Math.abs(dir) > 0.05) {
      const ai = Math.max(0, Math.min(1, aiW + 0.05 * Math.sign(dir)))
      const humanities = Math.max(0, Math.min(1, 1 - ai))
      action.setInvestments = { ai, humanities }
      action.message = `Recteur ajuste le budget: IA ${(ai*100)|0}% / Humanités ${((humanities)*100)|0}%`
      return action
    }
  }
  if (rnd < pubProb) action.publish = true
  // choose partner for collab
  if (Math.random() < collabProb) {
    const choices = world.departments.map(d => d.id).filter(id => id !== agent.dept)
    action.seekCollabWith = choices.length ? choices[Math.floor(Math.random()*choices.length)] : null
  }
  if (Math.random() < rivalProb) {
    const choices = world.departments.map(d => d.id).filter(id => id !== agent.dept)
    action.challenge = choices.length ? choices[Math.floor(Math.random()*choices.length)] : null
  }
  action.moveTo = agent.buildingId ?? null
  return action
}

export async function agentDecideBatch(batch: AgentBatch): Promise<{ actions: AgentAction[] }> {
  const deepseekKey = process.env.DEEPSEEK_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  // If no AI keys, fallback rules per agent
  if (!deepseekKey && !openaiKey) {
    return { actions: batch.agents.map(a => fallbackAgentDecide(a, batch.world)) }
  }

  const useDeepSeek = !!deepseekKey
  const client = new OpenAI({ apiKey: useDeepSeek ? deepseekKey! : openaiKey!, baseURL: useDeepSeek ? 'https://api.deepseek.com' : undefined })
  const model = useDeepSeek ? 'deepseek-chat' : 'gpt-4o-mini'

  try {
    const userContent = JSON.stringify({ agents: batch.agents, world: batch.world })
    const resp = await client.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages: [ { role: 'system', content: ACTION_SYSTEM }, { role: 'user', content: userContent } ],
      temperature: 0.3
    })
    const content = resp.choices[0]?.message?.content || '{}'
    const json = JSON.parse(content)
    const arr = Array.isArray(json.actions) ? json.actions : []
    const actions: AgentAction[] = []
    for (const a of arr) {
      const parsed = AgentActionSchema.safeParse(a)
      if (parsed.success) actions.push(parsed.data)
    }
    if (!actions.length) return { actions: batch.agents.map(a => fallbackAgentDecide(a, batch.world)) }
    return { actions }
  } catch (e) {
    return { actions: batch.agents.map(a => fallbackAgentDecide(a, batch.world)) }
  }
}
