import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { llmDirective } from './llm.js'

const app = express()
app.use(express.json())
app.use(cors())

const limiter = rateLimit({ windowMs: 15*60*1000, max: 180 })
app.use('/api/', limiter)

const PromptSchema = z.object({ prompt: z.string().min(1).max(2000) })

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

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787
app.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`))
