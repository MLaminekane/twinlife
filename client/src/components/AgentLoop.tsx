import { useEffect, useRef } from 'react'
import { useStore } from '../state/store'
import { sendAgentsDecision } from '../lib/api'

export function AgentLoop() {
  const llmAgents = useStore(s => s.scenario.llmAgents)
  const agents = useStore(s => s.agents)
  const departments = useStore(s => s.departments)
  const scenario = useStore(s => s.scenario)
  const applyAgentActions = useStore(s => s.applyAgentActions)
  const news = useStore(s => s.news)

  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!llmAgents) { if (timer.current) { window.clearInterval(timer.current); timer.current = null } ; return }
    // poll every 3 seconds, sampling a handful of agents to limit cost
    timer.current = window.setInterval(async () => {
      try {
        const sampleSize = 6
        const sample = agents.sort(() => 0.5 - Math.random()).slice(0, sampleSize)
        if (!sample.length) return
        const world = {
          investments: { ai: scenario.investmentAI, humanities: scenario.investmentHumanities },
          departments: departments.map(d => ({ id: d.id, name: d.name, publications: d.publications, activity: (useStore.getState().buildings.find(b => b.id === d.buildingId)?.activity ?? 0.5) })),
          recentNews: news.slice(-10).map(n => n.text)
        }
  const payload = { agents: sample.map(a => ({ id: a.id, role: a.role, dept: a.dept, buildingId: a.buildingId, biases: a.biases, goals: [], memory: a.memory?.slice(-6) ?? [] })), world }
        const res = await sendAgentsDecision(payload)
        applyAgentActions(res.actions)
      } catch (e) {
        // ignore errors; fallback handled server-side
      }
    }, 3000) as unknown as number
    return () => { if (timer.current) { window.clearInterval(timer.current); timer.current = null } }
  }, [llmAgents, agents, departments, scenario.investmentAI, scenario.investmentHumanities])

  return null
}
