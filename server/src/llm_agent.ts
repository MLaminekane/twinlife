import { AgentActionSchema, type AgentBatch, type AgentAction } from './schemas.js'
import { createLLMClient, getLLMConfig } from './llmClient.js'
import { AGENT_ACTION_SYSTEM_PROMPT } from './config.js'
import { fallbackAgentDecide } from './fallbackAgents.js'

export { AgentBatchSchema } from './schemas.js'

export async function agentDecideBatch(batch: AgentBatch): Promise<{ actions: AgentAction[] }> {
  const config = getLLMConfig()
  const llmClient = createLLMClient(config)

  // If no AI keys, fallback rules per agent
  if (!llmClient) {
    return { actions: batch.agents.map(a => fallbackAgentDecide(a, batch.world)) }
  }

  const { client, model } = llmClient

  try {
    const userContent = JSON.stringify({ agents: batch.agents, world: batch.world })
    const resp = await client.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages: [ 
        { role: 'system', content: AGENT_ACTION_SYSTEM_PROMPT }, 
        { role: 'user', content: userContent } 
      ],
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
    if (!actions.length) {
      return { actions: batch.agents.map(a => fallbackAgentDecide(a, batch.world)) }
    }
    return { actions }
  } catch (e) {
    return { actions: batch.agents.map(a => fallbackAgentDecide(a, batch.world)) }
  }
}
