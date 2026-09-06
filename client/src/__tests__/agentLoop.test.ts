import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import type { Store } from '../state/types'
import { sendAgentsDecision, sendLLM } from '../lib/api'

vi.mock('../lib/api', () => ({ sendAgentsDecision: vi.fn(), sendLLM: vi.fn() }))
let useStore: typeof import('../state/store')['useStore']
let startAgentLoop: typeof import('../components/AgentLoop')['startAgentLoop']
let initial: Store
let cleanup: (() => void) | undefined

beforeAll(async () => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} })
  vi.stubGlobal('window', globalThis)
  ;({ useStore } = await import('../state/store'))
  ;({ startAgentLoop } = await import('../components/AgentLoop'))
  initial = useStore.getState()
})
beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  useStore.setState({ ...initial, settings: { ...initial.settings, running: true }, scenario: { ...initial.scenario, llmAgents: true }, news: [], agents: structuredClone(initial.agents) }, true)
  vi.mocked(sendAgentsDecision).mockResolvedValue({ actions: [] })
  vi.mocked(sendLLM).mockResolvedValue({})
})
afterEach(() => { cleanup?.(); cleanup = undefined; vi.useRealTimers() })

it('uses recent snapshots without mutating or reordering the agents', async () => {
  const order = useStore.getState().agents.map(agent => agent.id)
  cleanup = startAgentLoop()
  useStore.setState({ news: [{ id: 1, ts: Date.now(), kind: 'system', text: 'Nouvel événement' }] })
  await vi.advanceTimersByTimeAsync(3000)
  expect(sendAgentsDecision).toHaveBeenCalledOnce()
  expect(vi.mocked(sendAgentsDecision).mock.calls[0][0].world.recentNews).toEqual(['Nouvel événement'])
  expect(useStore.getState().agents.map(agent => agent.id)).toEqual(order)
})

it('serializes requests and discards an answer received during a pause', async () => {
  let resolve!: (value: { actions: [{ id: string; message: string }] }) => void
  vi.mocked(sendAgentsDecision).mockImplementationOnce(() => new Promise(done => { resolve = done }))
  cleanup = startAgentLoop()
  await vi.advanceTimersByTimeAsync(12_000)
  expect(sendAgentsDecision).toHaveBeenCalledOnce()
  useStore.setState(state => ({ settings: { ...state.settings, running: false } }))
  resolve({ actions: [{ id: 'rector-1', message: 'Ne doit pas être appliqué' }] })
  await vi.advanceTimersByTimeAsync(3000)
  expect(useStore.getState().news).toHaveLength(0)
  expect(sendAgentsDecision).toHaveBeenCalledOnce()
  expect(sendLLM).not.toHaveBeenCalled()
})

it('cancels pending requests and removes timers on cleanup', async () => {
  vi.mocked(sendAgentsDecision).mockImplementationOnce(() => new Promise(() => {}))
  cleanup = startAgentLoop()
  await vi.advanceTimersByTimeAsync(3000)
  const signal = vi.mocked(sendAgentsDecision).mock.calls[0][1]!
  cleanup()
  expect(signal.aborted).toBe(true)
  await vi.advanceTimersByTimeAsync(30_000)
  expect(sendAgentsDecision).toHaveBeenCalledOnce()
})
