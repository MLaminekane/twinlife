import type { AgentInput, World, AgentAction } from './schemas.js'

export function fallbackAgentDecide(agent: AgentInput, world: World): AgentAction {
  const aiW = world.investments.ai
  const humW = world.investments.humanities
  const b = { 
    research: agent.biases?.research ?? 0.5, 
    collab: agent.biases?.collab ?? 0.5, 
    rivalry: agent.biases?.rivalry ?? 0.3, 
    ai: agent.biases?.ai ?? 0.5, 
    humanities: agent.biases?.humanities ?? 0.5 
  }
  const isAIInclined = (agent.dept === 'eng' || agent.dept === 'bio')
  const isHumInclined = (agent.dept === 'art' || agent.dept === 'law' || agent.dept === 'eco')

  // Memory nudges
  const mem = (agent.memory ?? []).slice(-5).join(' ').toLowerCase()
  const memCollab = mem.includes('collab') ? 0.1 : 0
  const memRiv = mem.includes('rival') || mem.includes('défie') ? 0.07 : 0
  const memPub = mem.includes('publ') ? 0.1 : 0

  const pubProb = 0.2 + 0.6 * (b.research * (isAIInclined ? aiW : isHumInclined ? humW : 0.5)) + memPub
  const collabProb = 0.15 + 0.5 * b.collab * (aiW*0.6 + humW*0.4) + memCollab
  const rivalProb = 0.05 + 0.4 * b.rivalry * (aiW*0.4 + (1 - humW)*0.3) + memRiv

  const rnd = Math.random()
  const action: AgentAction = { id: agent.id }

  // Rector special behavior
  if (agent.role === 'rector') {
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

  // Collaboration
  if (Math.random() < collabProb) {
    const choices = world.departments.map(d => d.id).filter(id => id !== agent.dept)
    action.seekCollabWith = choices.length ? choices[Math.floor(Math.random()*choices.length)] : null
  }

  // Rivalry
  if (Math.random() < rivalProb) {
    const choices = world.departments.map(d => d.id).filter(id => id !== agent.dept)
    action.challenge = choices.length ? choices[Math.floor(Math.random()*choices.length)] : null
  }

  action.moveTo = agent.buildingId ?? null
  return action
}
