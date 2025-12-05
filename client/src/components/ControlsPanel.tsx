import { useState } from 'react'
import { useStore } from '../state/store'
import { sendLLM } from '../lib/api'

export function ControlsPanel() {
  const running = useStore(s => s.settings.running)
  const speed = useStore(s => s.settings.speed)
  const glow = useStore(s => s.settings.glow)
  const shadows = useStore(s => s.settings.shadows)
  const labels = useStore(s => s.settings.labels)
  const buildings = useStore(s => s.buildings)
  const people = useStore(s => s.people)
  const environment = useStore(s => s.environment)
  const scenario = useStore(s => s.scenario)
  const applyDirective = useStore(s => s.applyDirective)
  const reset = useStore(s => s.reset)
  const setSelectedPerson = useStore(s => s.setSelectedPerson)
  const setScenario = useStore(s => s.setScenario)

  const [prompt, setPrompt] = useState('Augmente l\'activité en Sciences et en Bibliothèque, ralentis un peu la simulation.')
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [searchMsg, setSearchMsg] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="panel" style={{ top: 70, transition: 'all 0.3s ease', height: collapsed ? 'auto' : undefined, overflow: collapsed ? 'hidden' : 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: collapsed ? 0 : 10 }}>
        <h3 style={{ margin: 0 }}>Contrôles</h3>
        <button className="btn" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => setCollapsed(c => !c)}>
          {collapsed ? '▼' : '▲'}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="row">
            <button className="btn" onClick={() => useStore.setState(s => ({ settings: { ...s.settings, running: !s.settings.running } }))}>
              {running ? '⏸️ Pause' : '▶️ Lecture'}
            </button>
            <button className="btn" onClick={reset}>♻️ Réinitialiser</button>
          </div>

          <div className="row">
            <label>Vitesse: {speed.toFixed(2)}</label>
          </div>
          <input className="input" type="range" min={0.2} max={3} step={0.1}
            value={speed}
            onChange={(e) => useStore.setState(s => ({ settings: { ...s.settings, speed: Number(e.target.value) } }))}
          />

          <div className="row">
            <label><input type="checkbox" checked={glow} onChange={(e) => useStore.setState(s => ({ settings: { ...s.settings, glow: e.target.checked } }))} /> Glow</label>
            <label><input type="checkbox" checked={shadows} onChange={(e) => useStore.setState(s => ({ settings: { ...s.settings, shadows: e.target.checked } }))} /> Ombres</label>
            <label><input type="checkbox" checked={labels} onChange={(e) => useStore.setState(s => ({ settings: { ...s.settings, labels: e.target.checked } }))} /> Labels</label>
          </div>

          <div className="separator" />
          <div className="row"><label>Recherche citoyen</label></div>
          <div className="row" style={{ gap: 8 }}>
            <input
              className="input"
              type="text"
              placeholder="Nom ou prénom (ex: Camille, Dubois)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              className="btn"
              onClick={() => {
                const q = query.trim().toLowerCase()
                if (!q) { setSearchMsg('Entrez un nom.'); return }
                const p = people.find(p => p.name.toLowerCase().includes(q))
                if (p) {
                  setSelectedPerson(p.id)
                  setSearchMsg(`Focalisation sur ${p.name}`)
                } else {
                  setSearchMsg('Aucun résultat')
                }
              }}
            >🔎 Trouver</button>
            <button className="btn" onClick={() => { setSelectedPerson(null); setSearchMsg(null); setQuery('') }}>Effacer</button>
          </div>
          {searchMsg && <div className="small">{searchMsg}</div>}

          <div className="separator" />
          <div className="row"><label>Scénarios d'investissement</label></div>
          <div className="row" style={{ gap: 8 }}>
            <label>IA: {Math.round(scenario.investmentAI * 100)}%</label>
          </div>
          <input className="input" type="range" min={0} max={1} step={0.05}
            value={scenario.investmentAI}
            onChange={(e) => {
              const ai = Number(e.target.value)
              const hum = Math.max(0, Math.min(1, 1 - ai))
              setScenario({ investmentAI: ai, investmentHumanities: hum })
            }}
          />
          <div className="row" style={{ gap: 8 }}>
            <label>Humanités: {Math.round(scenario.investmentHumanities * 100)}%</label>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={scenario.llmAgents} onChange={(e) => setScenario({ llmAgents: e.target.checked })} />
              Activer agents LLM
            </label>
          </div>
          <div className="small">Testez: “plus d’IA que d’humanités” en poussant IA vers 70–90%. Les dynamiques de publications/collabs/rivalités s’ajusteront.</div>

          <div className="separator" />
          <div className="row"><label>Environnement</label></div>
          <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label>
              Saison
              <select
                value={environment.season}
                onChange={(e) => applyDirective({ environment: { season: e.target.value as any } })}
              >
                <option value="hiver">Hiver</option>
                <option value="printemps">Printemps</option>
                <option value="ete">Été</option>
                <option value="automne">Automne</option>
              </select>
            </label>
            <label>
              Moment de la journée
              <select
                value={environment.dayPeriod}
                onChange={(e) => applyDirective({ environment: { dayPeriod: e.target.value as any } })}
              >
                <option value="matin">Matin</option>
                <option value="midi">Midi</option>
                <option value="apresmidi">Après-midi</option>
                <option value="soir">Soir</option>
                <option value="nuit">Nuit</option>
              </select>
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={environment.weekend}
                onChange={(e) => applyDirective({ environment: { weekend: e.target.checked } })}
              />
              Week-end
            </label>
          </div>

          <div className="row" style={{ gap: 8, marginTop: 6 }}>
            <button
              className="btn"
              title="Pause la simulation temporairement"
              onClick={() => applyDirective({ effects: [{ type: 'pause', durationSec: 5 }] })}
            >⏱️ Pause 5s</button>
            <button
              className="btn"
              title="Déclenche un pic d'activité court sur tout le campus"
              onClick={() => {
                const names = buildings.map(b => b.name)
                applyDirective({ effects: names.map(n => ({ type: 'activitySpike' as const, buildingName: n, delta: 0.3, durationSec: 8 })) })
              }}
            >⚡ Pic d'activité (8s)</button>
          </div>

          <div className="separator" />
          <div className="row"><label>Bâtiments visibles</label></div>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {buildings.filter(b => !b.id.startsWith('res')).map(b => (
              <label key={b.id} style={{ width: '48%' }}>
                <input type="checkbox" checked={useStore.getState().settings.visibleBuildings.has(b.id)} onChange={(e) => {
                  useStore.setState(s => {
                    const set = new Set(s.settings.visibleBuildings)
                    if (e.target.checked) set.add(b.id); else set.delete(b.id)
                    return { settings: { ...s.settings, visibleBuildings: set } }
                  })
                }} /> {b.name}
              </label>
            ))}
          </div>

          <div className="row"><label>Résidences étudiantes</label></div>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {buildings.filter(b => b.id.startsWith('res') || b.name.toLowerCase().includes('résidence')).map(b => (
              <label key={b.id} style={{ width: '48%' }}>
                <input type="checkbox" checked={useStore.getState().settings.visibleBuildings.has(b.id)} onChange={(e) => {
                  useStore.setState(s => {
                    const set = new Set(s.settings.visibleBuildings)
                    if (e.target.checked) set.add(b.id); else set.delete(b.id)
                    return { settings: { ...s.settings, visibleBuildings: set } }
                  })
                }} /> {b.name}
              </label>
            ))}
          </div>

        </>
      )}
    </div>
  )
}
