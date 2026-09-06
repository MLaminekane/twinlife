import { useEffect } from 'react'
import { useStore } from '../state/store'
import { sendAgentsDecision, sendLLM } from '../lib/api'

export function startAgentLoop(): () => void {
  let stopped = false
  let pending: AbortController | null = null
  let nextCityDecision = Date.now() + 15_000

  const timer = window.setInterval(async () => {
    if (stopped || pending) return
    const state = useStore.getState()
    if (!state.settings.running || !state.scenario.llmAgents) return
    const controller = new AbortController()
    pending = controller
    const canApply = () => !stopped && !controller.signal.aborted && useStore.getState().settings.running && useStore.getState().scenario.llmAgents
    try {
      if (Date.now() >= nextCityDecision) {
        nextCityDecision = Date.now() + 15_000
        // Respect a user-launched event until it has played out.
        if (state.environment.activeScenario) return
        const destination = state.buildings
          .filter(building => building.activity > 0.3 && building.occupancy < building.capacity)
          .sort((left, right) => (right.activity - right.occupancy / right.capacity) - (left.activity - left.occupancy / left.capacity))[0]
        if (!destination) return
        // This concise instruction is also understood by the server's local mode.
        const prompt = `Envoie 8 personnes vers ${destination.name}`
        const directive = await sendLLM(prompt, controller.signal)
        if (canApply()) useStore.getState().applyDirective(directive)
      } else {
        const candidates = [...state.agents]
        for (let index = candidates.length - 1; index > 0; index--) {
          const other = Math.floor(Math.random() * (index + 1))
          ;[candidates[index], candidates[other]] = [candidates[other], candidates[index]]
        }
        const sample = candidates.slice(0, 6)
        if (!sample.length) return
        const payload = {
          agents: sample.map(agent => ({ id: agent.id, role: agent.role, dept: agent.dept, buildingId: agent.buildingId, biases: agent.biases, goals: [], memory: agent.memory?.slice(-6) ?? [] })),
          world: {
            investments: { ai: state.scenario.investmentAI, humanities: state.scenario.investmentHumanities },
            departments: state.departments.map(department => ({ id: department.id, name: department.name, publications: department.publications, activity: state.buildings.find(building => building.id === department.buildingId)?.activity ?? 0.5 })),
            recentNews: state.news.slice(-10).map(item => item.text),
          },
        }
        const result = await sendAgentsDecision(payload, controller.signal)
        if (canApply()) useStore.getState().applyAgentActions(result.actions)
      }
    } catch (error) {
      if (!controller.signal.aborted && !stopped) console.warn('Décision autonome indisponible', error)
    } finally {
      if (pending === controller) pending = null
    }
  }, 3000)

  return () => {
    stopped = true
    window.clearInterval(timer)
    pending?.abort()
  }
}

export function AgentLoop() {
  const enabled = useStore(state => state.scenario.llmAgents)
  const running = useStore(state => state.settings.running)
  useEffect(() => {
    if (enabled && running) return startAgentLoop()
  }, [enabled, running])
  return null
}
