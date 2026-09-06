import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUp, ArrowUpRight, Check, Command, LoaderCircle, MessageSquare, RotateCcw, TriangleAlert, X } from 'lucide-react'
import { sendLLM } from '../lib/api'
import { useStore, type Directive, type Store } from '../state/store'
import './command-center.css'

type ServiceStatus = { mode: 'llm' | 'local'; provider: 'DeepSeek' | 'OpenAI' | null }
type Entry = { id: number; prompt: string; changes: string[]; time: string; error?: string }
const suggestions = [
  { label: 'Une nouvelle habitante', prompt: 'Ajoute Léa comme étudiante à la bibliothèque' },
  { label: 'Un nouveau lieu', prompt: 'Ajoute un bâtiment nommé Atelier' },
  { label: 'Un campus animé', prompt: 'Augmente l’activité de la bibliothèque' },
  { label: 'À la tombée du jour', prompt: 'Passe en soirée' },
]
const periods: Record<string, string> = { matin: 'matin', midi: 'midi', apresmidi: 'après-midi', soir: 'soirée', nuit: 'nuit' }
const seasons: Record<string, string> = { hiver: 'hiver', printemps: 'printemps', ete: 'été', automne: 'automne' }

// Compare the actual state immediately before and after the command.
function snapshot(state: Store) {
  return {
    buildings: state.buildings.map(b => ({ id: b.id, name: b.name, activity: b.activity })),
    people: state.people.map(p => ({ id: p.id, name: p.name, target: p.targetBuildingId })),
    settings: { ...state.settings, visibleBuildings: new Set(state.settings.visibleBuildings) },
    environment: { ...state.environment },
    effects: state.effects.length,
  }
}

function appliedChanges(directive: Directive, before: ReturnType<typeof snapshot>, after: Store): string[] {
  const changes: string[] = []
  const oldBuildingIds = new Set(before.buildings.map(b => b.id))
  const newBuildingIds = new Set(after.buildings.map(b => b.id))
  const oldPersonIds = new Set(before.people.map(p => p.id))
  const newPersonIds = new Set(after.people.map(p => p.id))
  const addedPeople = after.people.filter(p => !oldPersonIds.has(p.id))
  const removedPeople = before.people.filter(p => !newPersonIds.has(p.id))
  if (addedPeople.length) changes.push(addedPeople.length === 1 ? `${addedPeople[0].name} rejoint la ville` : `${addedPeople.length} habitants ajoutés`)
  if (removedPeople.length) changes.push(removedPeople.length === 1 ? `${removedPeople[0].name} a quitté la ville` : `${removedPeople.length} habitants retirés`)
  for (const b of after.buildings) if (!oldBuildingIds.has(b.id)) changes.push(`Nouveau bâtiment : ${b.name}`)
  for (const b of before.buildings) if (!newBuildingIds.has(b.id)) changes.push(`Bâtiment retiré : ${b.name}`)
  const activityById = new Map(before.buildings.map(b => [b.id, b.activity]))
  if (directive.buildingActivityChanges || directive.buildingActivitySet || directive.effects || directive.global?.resetRandom) {
    for (const b of after.buildings) {
      const old = activityById.get(b.id)
      if (old !== undefined && Math.abs(old - b.activity) > 0.0001) changes.push(`${b.name} · activité ${Math.round(b.activity * 100)} %`)
    }
  }
  if (directive.personFlows?.length) {
    const targets = new Map(before.people.map(p => [p.id, p.target]))
    const redirected = after.people.filter(p => targets.has(p.id) && targets.get(p.id) !== p.targetBuildingId).length
    if (redirected) changes.push(`${redirected} habitant${redirected > 1 ? 's' : ''} réorienté${redirected > 1 ? 's' : ''}`)
  }
  const env = after.environment
  if (env.dayPeriod !== before.environment.dayPeriod) changes.push(`Moment de la journée : ${periods[env.dayPeriod] || env.dayPeriod}`)
  if (env.gameTime !== before.environment.gameTime) {
    const minutes = Math.round(env.gameTime * 60) % 1440
    changes.push(`Heure : ${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`)
  }
  if (env.condition !== before.environment.condition) changes.push(`Météo : ${{ clear: 'ciel dégagé', cloudy: 'nuages', rain: 'pluie', snow: 'neige' }[env.condition ?? 'clear']}`)
  if (env.temperature !== before.environment.temperature) changes.push(`Température : ${env.temperature} °C`)
  if (env.season !== before.environment.season) changes.push(`Saison : ${seasons[env.season] || env.season}`)
  if (env.weekend !== before.environment.weekend) changes.push(env.weekend ? 'Rythme du week-end activé' : 'Rythme de semaine activé')
  if (after.settings.speed !== before.settings.speed) changes.push(`Vitesse de simulation : ×${after.settings.speed.toFixed(1)}`)
  if (after.settings.running !== before.settings.running) changes.push(after.settings.running ? 'Simulation en cours' : 'Simulation en pause')
  for (const [key, label] of [['glow', 'Éclairage lumineux'], ['shadows', 'Ombres'], ['labels', 'Noms des bâtiments']] as const) {
    if (before.settings[key] !== after.settings[key]) changes.push(`${label} ${after.settings[key] ? 'activés' : 'désactivés'}`)
  }
  if (directive.visibility && (before.settings.visibleBuildings.size !== after.settings.visibleBuildings.size || [...before.settings.visibleBuildings].some(id => !after.settings.visibleBuildings.has(id)))) {
    changes.push(`${after.settings.visibleBuildings.size} bâtiments visibles`)
  }
  if (after.effects.length > before.effects) changes.push(`${after.effects.length - before.effects} effet${after.effects.length - before.effects > 1 ? 's' : ''} temporaire${after.effects.length - before.effects > 1 ? 's' : ''} lancé${after.effects.length - before.effects > 1 ? 's' : ''}`)
  if (directive.global?.resetRandom) changes.push('Population et activité régénérées')
  return changes
}

export function CommandCenter({ onClose }: { onClose: () => void }) {
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [history, setHistory] = useState<Entry[]>([])
  const [status, setStatus] = useState<ServiceStatus | 'loading' | 'offline'>('loading')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const historyEnd = useRef<HTMLDivElement>(null)
  const mounted = useRef(true)
  const pending = useRef(false)
  const commandController = useRef<AbortController | null>(null)

  useEffect(() => {
    mounted.current = true
    const controller = new AbortController()
    fetch('/api/status', { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]) })
      .then(async response => {
        if (!response.ok) throw new Error('Unavailable')
        const value = await response.json() as ServiceStatus
        if (value.mode !== 'local' && value.mode !== 'llm') throw new Error('Invalid status')
        if (mounted.current) setStatus(value)
      })
      .catch(() => { if (mounted.current && !controller.signal.aborted) setStatus('offline') })
    return () => { mounted.current = false; controller.abort(); commandController.current?.abort() }
  }, [])

  useEffect(() => { historyEnd.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [history, busy])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const request = prompt.trim()
    if (!request || pending.current) return
    pending.current = true
    setBusy(true)
    const id = Date.now()
    const time = new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })
    const controller = new AbortController()
    commandController.current = controller
    try {
      const directive = await sendLLM(request, controller.signal)
      if (!mounted.current || controller.signal.aborted) return
      const before = snapshot(useStore.getState())
      useStore.getState().applyDirective(directive)
      const changes = appliedChanges(directive, before, useStore.getState())
      if (mounted.current) {
        setHistory(entries => [...entries, { id, prompt: request, changes, time }].slice(-8))
        setPrompt('')
      }
    } catch (error) {
      if (controller.signal.aborted) return
      const unavailable = error instanceof TypeError || (error instanceof Error && error.message === 'LLM API error')
      const message = unavailable
        ? 'Le service de commandes est indisponible. Vérifiez que le serveur est lancé, puis réessayez.'
        : 'La commande n’a pas pu être appliquée. Essayez une instruction plus simple.'
      if (mounted.current) setHistory(entries => [...entries, { id, prompt: request, changes: [], time, error: message }].slice(-8))
    } finally {
      pending.current = false
      if (commandController.current === controller) commandController.current = null
      if (mounted.current) { setBusy(false); inputRef.current?.focus() }
    }
  }

  const statusText = status === 'loading' ? 'Connexion au service…' : status === 'offline' ? 'Service de commandes indisponible' : status.mode === 'local' ? 'Mode local · commandes essentielles' : `${status.provider || 'Modèle'} configuré · langage naturel`

  return (
    <section className="command-center" aria-labelledby="command-title">
      <header className="command-header">
        <div className="command-header-icon"><Command size={18} /></div>
        <div className="command-header-title"><h2 id="command-title">Donnez vie à vos idées</h2><span>Le centre de commandes</span></div>
        <button type="button" className="command-icon-button" onClick={onClose} aria-label="Fermer le centre de commandes"><X size={17} /></button>
      </header>

      <div className={`command-service ${status === 'offline' ? 'is-offline' : ''}`} role="status"><i />{statusText}</div>

      <div className="command-scroll">
        <div className="command-intro">
          <div className="command-orbit"><Command size={28} strokeWidth={1.3} /></div>
          <h3>Une phrase.<br /><span>Un monde qui change.</span></h3>
          <p>Créez un lieu, accueillez des habitants ou changez l’ambiance de votre ville.</p>
        </div>

        <div className="command-suggestions" aria-label="Idées de commandes">
          {suggestions.map(suggestion => <button type="button" key={suggestion.label} disabled={busy} onClick={() => { setPrompt(suggestion.prompt); inputRef.current?.focus() }}><span>{suggestion.label}</span><ArrowUpRight size={14} /></button>)}
        </div>

        {history.length > 0 && <div className="command-history-header"><span>Vos commandes récentes</span><button type="button" className="command-icon-button" onClick={() => setHistory([])} aria-label="Effacer l’historique des commandes" title="Effacer l’historique"><RotateCcw size={13} /></button></div>}
        <div className="command-history" role="log" aria-live="polite" aria-label="Résultats des commandes">
          {history.map(entry => <article className="command-entry" key={entry.id}>
            <div className="command-request"><MessageSquare size={12} /><p>{entry.prompt}</p><time>{entry.time}</time></div>
            <div className={`command-result ${entry.error ? 'is-error' : ''}`}>
              {entry.error ? <><TriangleAlert size={14} /><p>{entry.error}</p></> : entry.changes.length ? <><Check size={14} /><div><strong>Changements appliqués</strong><ul>{entry.changes.slice(0, 6).map((change, index) => <li key={index}>{change}</li>)}</ul>{entry.changes.length > 6 && <details><summary>{entry.changes.length - 6} autres changements</summary><ul>{entry.changes.slice(6).map((change, index) => <li key={index}>{change}</li>)}</ul></details>}</div></> : <><MessageSquare size={14} /><p>Aucun changement appliqué. La demande peut déjà être satisfaite ou ne pas être reconnue. Essayez l’une des suggestions.</p></>}
            </div>
          </article>)}
          {busy && <div className="command-pending" role="status"><LoaderCircle size={15} className="command-spin" /><span>Traitement de votre commande…</span></div>}
          <div ref={historyEnd} />
        </div>
      </div>

      <form className="command-composer" onSubmit={submit} aria-busy={busy}>
        <label htmlFor="world-command" className="command-input-label">Votre prochaine idée</label>
        <div className="command-input-wrap">
          <textarea ref={inputRef} id="world-command" maxLength={2000} value={prompt} onChange={event => setPrompt(event.target.value)} placeholder="Ex. Ajoute Léa à la bibliothèque…" disabled={busy} onKeyDown={event => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} />
          <div className="command-input-footer"><span>{prompt.length > 1700 ? `${prompt.length} / 2000` : '⌘ / Ctrl + Entrée'}</span><button type="submit" disabled={busy || !prompt.trim()} aria-label={busy ? 'Commande en cours' : 'Appliquer la commande'} title="Appliquer la commande">{busy ? <LoaderCircle size={18} className="command-spin" /> : <ArrowUp size={19} />}</button></div>
        </div>
        <p className="command-footnote">Chaque commande agit sur la simulation. Le résultat détaille les changements appliqués.</p>
      </form>
    </section>
  )
}
