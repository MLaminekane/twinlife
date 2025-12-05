import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { llmDirective } from './llm.js'
import { agentDecideBatch, AgentBatchSchema } from './llm_agent.js'
import { PromptSchema } from './schemas.js'

const app = express()
app.use(express.json())
app.use(cors())

const limiter = rateLimit({ windowMs: 15*60*1000, max: 1000 })
app.use('/api/', limiter)

const DialogueSchema = z.object({
  agent1: z.object({ name: z.string(), role: z.string(), traits: z.any(), mood: z.string() }),
  agent2: z.object({ name: z.string(), role: z.string(), traits: z.any(), mood: z.string() }),
  context: z.string().optional()
})

app.post('/api/chat/dialogue', async (req, res) => {
  const parsed = DialogueSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid dialogue payload' })
  
  const { agent1, agent2, context } = parsed.data
  
  const prompt = `
    Generate a short, realistic dialogue (3-4 lines each) between two people meeting on a campus.
    
    Person 1: ${agent1.name} (${agent1.role}). Mood: ${agent1.mood}. Traits: ${JSON.stringify(agent1.traits)}.
    Person 2: ${agent2.name} (${agent2.role}). Mood: ${agent2.mood}. Traits: ${JSON.stringify(agent2.traits)}.
    
    Context: ${context || 'They bump into each other.'}
    
    Format:
    ${agent1.name}: ...
    ${agent2.name}: ...
    
    Keep it casual and related to their roles/moods.
  `
  
  try {
    // We reuse llmDirective or create a new simple chat function. 
    // Since llmDirective returns JSON, we might want a raw text function or just wrap the result.
    // Let's assume we want raw text for now, or a simple JSON object.
    // I'll use a new helper or just reuse llmDirective if it can handle text.
    // Actually, let's just use the existing llmDirective but ask for a JSON structure with "dialogue" field.
    
    const jsonPrompt = `
      ${prompt}
      
      Return ONLY a JSON object: { "dialogue": [ { "speaker": "Name", "text": "..." } ] }
    `
    
    const result = await llmDirective(jsonPrompt)
    return res.json(result)
  } catch (e: any) {
    console.error('Dialogue error', e)
    return res.status(500).json({ error: 'Dialogue generation failed' })
  }
})

app.post('/api/llm', async (req, res) => {
  const parsed = PromptSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid prompt' })
  try {
    const dir = await llmDirective(parsed.data.prompt)
    return res.json(dir)
  } catch (e: any) {
    console.error('LLM error', e)
    return res.status(500).json({ error: 'LLM failed' })
  }
})

app.post('/api/agent', async (req, res) => {
  const parsed = AgentBatchSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid agent payload' })
  try {
    const out = await agentDecideBatch(parsed.data)
    return res.json(out)
  } catch (e: any) {
    console.error('Agent LLM error', e)
    return res.status(500).json({ error: 'Agent LLM failed' })
  }
})

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787
app.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`))
