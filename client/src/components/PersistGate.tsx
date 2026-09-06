import { useEffect } from 'react'
import { useStore } from '../state/store'
import { useView } from '../state/viewStore'

const S_KEY = 'twinlife_scenario_v1',
  SET_KEY = 'twinlife_settings_v1',
  VIEW_KEY = 'twinlife_view_v2'
export function PersistGate() {
  useEffect(() => {
    try {
      const scenario = JSON.parse(localStorage.getItem(S_KEY) || 'null')
      if (scenario && typeof scenario === 'object') {
        const ai = Number.isFinite(scenario.investmentAI)
          ? Math.max(0, Math.min(1, scenario.investmentAI))
          : 0.7
        useStore
          .getState()
          .setScenario({
            investmentAI: ai,
            investmentHumanities: 1 - ai,
            llmAgents: scenario.llmAgents === true,
          })
      }
      const settings = JSON.parse(localStorage.getItem(SET_KEY) || 'null')
      if (settings && typeof settings === 'object')
        useStore.setState((state) => {
          const next = { ...state.settings }
          for (const key of ['running', 'glow', 'shadows', 'labels'] as const)
            if (typeof settings[key] === 'boolean') next[key] = settings[key]
          if (Number.isFinite(settings.speed))
            next.speed = Math.max(0.2, Math.min(10, settings.speed))
          return { settings: next }
        })
      const view = JSON.parse(localStorage.getItem(VIEW_KEY) || 'null')
      if (view?.quality === 'balanced' || view?.quality === 'high')
        useView.setState({ quality: view.quality })
    } catch {
      /* An invalid preference must never stop the simulation. */
    }
    let lastScenario = '',
      lastSettings = '',
      lastView = ''
    const persist = () => {
      const state = useStore.getState()
      const scenario = JSON.stringify(state.scenario)
      const settings = JSON.stringify({
        running: state.settings.running,
        speed: state.settings.speed,
        glow: state.settings.glow,
        shadows: state.settings.shadows,
        labels: state.settings.labels,
      })
      const view = JSON.stringify({ quality: useView.getState().quality })
      try {
        if (scenario !== lastScenario) {
          localStorage.setItem(S_KEY, scenario)
          lastScenario = scenario
        }
        if (settings !== lastSettings) {
          localStorage.setItem(SET_KEY, settings)
          lastSettings = settings
        }
        if (view !== lastView) {
          localStorage.setItem(VIEW_KEY, view)
          lastView = view
        }
      } catch {
        /* Continue without preferences when browser storage is full or disabled. */
      }
    }
    const unsubscribe = useStore.subscribe(persist),
      unsubscribeView = useView.subscribe(persist)
    persist()
    return () => {
      unsubscribe()
      unsubscribeView()
    }
  }, [])
  return null
}
