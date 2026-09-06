import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Camera,
  Check,
  ChevronDown,
  CircleHelp,
  Cloud,
  CloudRain,
  Compass,
  Crosshair,
  Footprints,
  Gauge,
  GraduationCap,
  Layers3,
  Leaf,
  Maximize2,
  Moon,
  MousePointer2,
  Pause,
  Play,
  Search,
  Settings2,
  Snowflake,
  Sparkles,
  Sun,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { useStore, type Building, type Environment } from '../state/store'
import {
  useView,
  type CameraPreset,
  type Layer,
  type Panel,
} from '../state/viewStore'
import {
  getUrbanInsights,
  launchScenario,
  SCENARIOS,
} from '../lib/urbanInsights'
import { CommandCenter } from './CommandCenter'
import { MiniMap, ZONE_COLORS, ZONE_NAMES } from './MiniMap'

const format = (value: number) =>
  new Intl.NumberFormat('fr-CA', { maximumFractionDigits: 0 }).format(value)
const clock = (hour: number) =>
  `${String(Math.floor(hour) % 24).padStart(2, '0')}:${String(Math.floor((hour % 1) * 60)).padStart(2, '0')}`
const NAV = [
  { id: 'overview', label: 'Vue d’ensemble', icon: Compass },
  { id: 'buildings', label: 'Bâtiments', icon: Building2 },
  { id: 'people', label: 'Habitants', icon: Users },
  { id: 'scenarios', label: 'Scénarios', icon: Layers3 },
] as const
const WEATHER = [
  { id: 'clear', label: 'Soleil', icon: Sun },
  { id: 'cloudy', label: 'Nuages', icon: Cloud },
  { id: 'rain', label: 'Pluie', icon: CloudRain },
  { id: 'snow', label: 'Neige', icon: Snowflake },
] as const
const CAMERA = [
  { id: 'overview', label: 'Vue générale' },
  { id: 'campus', label: 'Campus' },
  { id: 'downtown', label: 'Centre-ville' },
  { id: 'top', label: 'Vue du ciel' },
] as const

function changeSetting(
  key: 'running' | 'glow' | 'shadows' | 'labels',
  value: boolean,
) {
  useStore.setState((s) => ({ settings: { ...s.settings, [key]: value } }))
}
function goTo(preset: CameraPreset) {
  useStore.getState().setSelectedBuilding(null)
  useStore.getState().setSelectedPerson(null)
  useView.getState().focus(preset)
}
function inspectBuilding(b: Building) {
  useStore.getState().setSelectedPerson(null)
  useStore.getState().setSelectedBuilding(b.id)
  useView.setState({ panel: 'buildings', cinematic: false })
}
function download(content: Blob, name: string) {
  const url = URL.createObjectURL(content),
    a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function Sparkline({
  values,
  color = '#b9f579',
}: {
  values: number[]
  color?: string
}) {
  const points = values.length > 1 ? values : [0, 0]
  const min = Math.min(...points),
    max = Math.max(...points),
    span = Math.max(max - min, 1)
  const path = points
    .map(
      (v, i) =>
        `${i === 0 ? 'M' : 'L'}${(i / (points.length - 1)) * 240},${47 - ((v - min) / span) * 35}`,
    )
    .join(' ')
  return (
    <svg
      viewBox="0 0 240 54"
      className="sparkline"
      role="img"
      aria-label="Historique d’occupation de la simulation"
    >
      <path d={`${path} L240,54 L0,54 Z`} fill={color} opacity=".07" />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export function ExperienceShell({ children }: { children: ReactNode }) {
  const settings = useStore((s) => s.settings),
    environment = useStore((s) => s.environment)
  const buildings = useStore((s) => s.buildings),
    people = useStore((s) => s.people),
    metrics = useStore((s) => s.metrics)
  const panel = useView((s) => s.panel),
    layer = useView((s) => s.layer),
    cinematic = useView((s) => s.cinematic),
    preset = useView((s) => s.cameraPreset)
  const [searchOpen, setSearchOpen] = useState(false),
    [query, setQuery] = useState(''),
    [notice, setNotice] = useState(''),
    [help, setHelp] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const selectedBuildingId = useStore((s) => s.selectedBuildingId)
  const selectedPersonId = useStore((s) => s.selectedPersonId)
  const notifyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  const searchRef = useRef<HTMLInputElement>(null)
  function notify(message: string) {
    setNotice(message)
    clearTimeout(notifyTimer.current)
    notifyTimer.current = setTimeout(() => setNotice(''), 4000)
  }
  useEffect(() => () => clearTimeout(notifyTimer.current), [])
  useEffect(() => {
    if (selectedBuildingId !== null || selectedPersonId !== null)
      setDrawer(true)
  }, [selectedBuildingId, selectedPersonId])
  useEffect(() => {
    if (!searchOpen && !help) return
    const previous = document.activeElement as HTMLElement | null
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
    const first = dialog?.querySelector<HTMLElement>('input,button')
    first?.focus()
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialog) return
      const elements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]),input:not([disabled]),a[href],[tabindex="0"]',
        ),
      )
      const first = elements[0],
        last = elements[elements.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', trap)
    return () => {
      document.removeEventListener('keydown', trap)
      previous?.focus()
    }
  }, [searchOpen, help])
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setHelp(false)
        useStore.getState().setSelectedPerson(null)
        useStore.getState().setSelectedBuilding(null)
        return
      }
      if (
        e.target instanceof HTMLElement &&
        (e.target.matches('input,textarea,select') ||
          e.target.isContentEditable)
      )
        return
      if (e.key === ' ') {
        e.preventDefault()
        changeSetting('running', !useStore.getState().settings.running)
      }
      if (e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (['1', '2', '3', '4'].includes(e.key))
        goTo(CAMERA[Number(e.key) - 1].id)
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])
  function exportReport() {
    const state = useStore.getState(),
      insights = getUrbanInsights(state)
    const report = {
      application: 'Twinlife',
      exportedAt: new Date().toISOString(),
      dataSource:
        'Simulation locale. Énergie et confort estimés par un modèle simplifié.',
      environment: state.environment,
      metrics: state.metrics,
      insights,
      buildings: state.buildings.map(
        ({ id, name, zone, type, capacity, occupancy, activity }) => ({
          id,
          name,
          zone,
          type,
          capacity,
          occupancy,
          activity,
        }),
      ),
      history: state.timeseries,
    }
    download(
      new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }),
      `twinlife-rapport-${new Date().toISOString().slice(0, 10)}.json`,
    )
    notify('Rapport de simulation exporté')
  }
  function capture() {
    const canvas = document.querySelector<HTMLCanvasElement>(
      '.city-viewport canvas',
    )
    if (!canvas) {
      notify('La vue 3D n’est pas encore disponible')
      return
    }
    try {
      canvas.toBlob((blob) => {
        if (blob) {
          download(blob, 'twinlife-vue.png')
          notify('Vue 3D enregistrée')
        } else notify('Capture indisponible')
      }, 'image/png')
    } catch {
      notify('La capture n’est pas disponible dans ce navigateur')
    }
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {
      notify('Plein écran non disponible dans ce navigateur')
    }
  }
  const matches = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('fr')
    return {
      buildings: buildings
        .filter((b) => !q || b.name.toLocaleLowerCase('fr').includes(q))
        .slice(0, 6),
      people: q
        ? people
            .filter((p) => p.name.toLocaleLowerCase('fr').includes(q))
            .slice(0, 6)
        : [],
    }
  }, [query, buildings, people])
  return (
    <>
      <header className="app-header">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault()
            goTo('overview')
            useView.setState({ panel: 'overview' })
          }}
          aria-label="Twinlife, vue d’ensemble"
        >
          <span className="brand-symbol">
            <Layers3 size={25} />
          </span>
          <span>
            twinlife<span className="brand-period">.</span>
          </span>
          <span className="edition">STUDIO</span>
        </a>
        <div className="project-name">
          <span className="header-divider" />
          <span>Saguenay, Québec</span>
          <ChevronDown size={13} />
          <span className="environment-tag">VILLE SIMULÉE</span>
        </div>
        <div className="header-actions">
          <button className="search-button" onClick={() => setSearchOpen(true)}>
            <Search size={16} />
            <span>Explorer la ville</span>
            <kbd>K</kbd>
          </button>
          <button
            className="icon-button report-button"
            onClick={exportReport}
            title="Exporter le rapport de simulation"
            aria-label="Exporter le rapport"
          >
            <ArrowDownToLine size={18} />
          </button>
          <button
            className={`assistant-button ${panel === 'assistant' ? 'active' : ''}`}
            onClick={() => {
              useView.setState({
                panel: panel === 'assistant' ? 'overview' : 'assistant',
              })
              setDrawer(true)
            }}
          >
            <Sparkles size={16} />
            <span>Copilote</span>
          </button>
          <span className="avatar">TL</span>
        </div>
      </header>
      <nav className="side-nav" aria-label="Navigation principale">
        <div className="nav-main">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              title={label}
              aria-label={label}
              aria-pressed={panel === id}
              className={`nav-button ${panel === id ? 'active' : ''}`}
              onClick={() => {
                useView.setState({ panel: id })
                setDrawer(true)
              }}
            >
              <Icon size={21} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="nav-bottom">
          <button
            className={`nav-button ${panel === 'settings' ? 'active' : ''}`}
            title="Réglages"
            aria-label="Réglages"
            onClick={() => {
              useView.setState({ panel: 'settings' })
              setDrawer(true)
            }}
          >
            <Settings2 size={20} />
          </button>
          <button
            className="nav-button"
            title="Guide et raccourcis"
            aria-label="Guide et raccourcis"
            onClick={() => setHelp(true)}
          >
            <CircleHelp size={20} />
          </button>
          <div className="nav-version">V.02</div>
        </div>
      </nav>
      <main className="workspace">
        <section
          className="city-workspace"
          aria-label="Exploration de la ville"
        >
          <div className="workspace-heading">
            <div>
              <div className="eyebrow">
                <span className="live-dot" />{' '}
                {settings.running
                  ? 'SIMULATION EN COURS'
                  : 'SIMULATION EN PAUSE'}
              </div>
              <h1>
                La ville, vivante<span>.</span>
              </h1>
              <p>
                Chaque lieu a une histoire. Chaque habitant, une trajectoire.
              </p>
            </div>
            <button
              className="small-pill"
              onClick={() => {
                useView.setState({ panel: 'scenarios' })
                setDrawer(true)
              }}
            >
              <Layers3 size={14} /> Tester un scénario{' '}
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="city-viewport">
            {children}
            <div className="scene-topline">
              <span className="scene-location">
                <span className="live-dot" /> SAGUENAY <span>/</span> 48.428° N
                · 71.065° O
              </span>
              <span className="render-label">JUMEAU NUMÉRIQUE 3D</span>
            </div>
            <div className="camera-tabs" aria-label="Points de vue">
              {CAMERA.map(({ id, label }, i) => (
                <button
                  key={id}
                  className={preset === id ? 'selected' : ''}
                  onClick={() => goTo(id)}
                  title={`${label} · ${i + 1}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="scene-tools">
              <button
                className={`scene-tool ${cinematic ? 'selected' : ''}`}
                onClick={() => {
                  useStore.getState().setSelectedPerson(null)
                  useView.setState({ cinematic: !cinematic })
                }}
                title="Orbite cinématique"
                aria-label="Orbite cinématique"
                aria-pressed={cinematic}
              >
                <Compass size={18} />
              </button>
              <button
                className="scene-tool"
                onClick={capture}
                title="Enregistrer une vue PNG"
                aria-label="Enregistrer une vue PNG"
              >
                <Camera size={18} />
              </button>
              <button
                className="scene-tool"
                onClick={fullscreen}
                title="Plein écran"
                aria-label="Plein écran"
              >
                <Maximize2 size={18} />
              </button>
            </div>
            <div className="scene-footer">
              <span>
                <MousePointer2 size={13} /> Glisser pour explorer <i /> Molette
                pour zoomer
              </span>
              <span className="north-label">
                N <Compass size={24} />
              </span>
            </div>
            <div className="layer-switch" aria-label="Couches de visualisation">
              {(
                [
                  { id: 'standard', label: 'Réaliste', icon: Building2 },
                  { id: 'activity', label: 'Activité', icon: Activity },
                  { id: 'mobility', label: 'Mobilité', icon: Footprints },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className={layer === id ? 'active' : ''}
                  onClick={() => useView.setState({ layer: id })}
                  aria-pressed={layer === id}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
            {layer !== 'standard' && (
              <div className="layer-legend">
                <span className="legend-gradient" />
                {layer === 'activity'
                  ? 'Activité faible → forte'
                  : 'Trajets piétons simulés'}
              </div>
            )}
          </div>
          <div className="timeline-panel">
            <div className="time-readout">
              <span className="eyebrow">HEURE SIMULÉE</span>
              <strong>{clock(environment.gameTime)}</strong>
              <span>
                {environment.weekend ? 'Fin de semaine' : 'Jour de semaine'}
              </span>
            </div>
            <div className="time-controls">
              <div className="timeline-top">
                <span>
                  <Sun size={13} /> Cycle de la journée
                </span>
                <div className="playback">
                  <button
                    className="play-button"
                    onClick={() => changeSetting('running', !settings.running)}
                    aria-label={
                      settings.running
                        ? 'Mettre en pause'
                        : 'Reprendre la simulation'
                    }
                  >
                    {settings.running ? (
                      <Pause size={15} fill="currentColor" />
                    ) : (
                      <Play size={15} fill="currentColor" />
                    )}
                  </button>
                  {[1, 3, 10].map((speed) => (
                    <button
                      key={speed}
                      className={settings.speed === speed ? 'selected' : ''}
                      aria-label={`Vitesse ${speed} fois`}
                      onClick={() =>
                        useStore.setState((s) => ({
                          settings: { ...s.settings, speed },
                        }))
                      }
                    >
                      {speed}×
                    </button>
                  ))}
                </div>
              </div>
              <input
                aria-label="Heure de la simulation"
                className="time-slider"
                type="range"
                min="0"
                max="23.99"
                step=".01"
                value={environment.gameTime}
                onChange={(e) =>
                  useStore.getState().applyDirective({
                    environment: {
                      gameTime: Number(e.target.value),
                      realTime: false,
                    },
                  })
                }
              />
              <div className="time-markers">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>24:00</span>
              </div>
            </div>
            <div className="weather-readout">
              <div>
                <WeatherIcon condition={environment.condition} />
                <strong>{Math.round(environment.temperature ?? 18)}°</strong>
              </div>
              <span>
                {WEATHER.find((w) => w.id === environment.condition)?.label ??
                  'Soleil'}{' '}
                · {environment.realTime ? 'météo importée' : 'météo simulée'}
              </span>
            </div>
          </div>
          <footer className="workspace-footer">
            <span>
              <span className="status-point" /> Moteur local actif
            </span>
            <span>
              {format(metrics.totalPeople)} habitants · {buildings.length}{' '}
              bâtiments · 4 quartiers
            </span>
            <span>Explorer. Comprendre. Imaginer.</span>
          </footer>
        </section>
        <aside
          className={`inspector ${drawer ? 'mobile-open' : ''}`}
          aria-label="Panneau d’exploration"
        >
          <button
            className="mobile-close icon-button"
            onClick={() => setDrawer(false)}
            aria-label="Fermer le panneau"
          >
            <X size={20} />
          </button>
          <Inspector panel={panel} notify={notify} />
        </aside>
      </main>
      {notice && (
        <div className="toast" role="status">
          <Check size={16} />
          {notice}
        </div>
      )}
      {searchOpen && (
        <div className="modal-backdrop" onClick={() => setSearchOpen(false)}>
          <section
            className="search-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Rechercher dans la ville"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="search-dialog-input">
              <Search size={20} />
              <input
                ref={searchRef}
                placeholder="Un bâtiment, un habitant…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                className="icon-button"
                aria-label="Fermer la recherche"
                onClick={() => setSearchOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="search-results">
              <span className="eyebrow">BÂTIMENTS</span>
              {matches.buildings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    inspectBuilding(b)
                    setSearchOpen(false)
                    setDrawer(true)
                  }}
                >
                  <Building2 size={18} />
                  <span>
                    {b.name}
                    <small>{ZONE_NAMES[b.zone]}</small>
                  </span>
                  <ArrowUpRight size={16} />
                </button>
              ))}
              {matches.people.length > 0 && (
                <span className="eyebrow">HABITANTS</span>
              )}
              {matches.people.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    useStore.getState().setSelectedBuilding(null)
                    useStore.getState().setSelectedPerson(p.id)
                    useView.setState({ panel: 'people' })
                    setSearchOpen(false)
                    setDrawer(true)
                  }}
                >
                  <Users size={18} />
                  <span>
                    {p.name}
                    <small>
                      {p.presence === 'walking'
                        ? 'En déplacement'
                        : 'À l’intérieur'}
                    </small>
                  </span>
                  <ArrowUpRight size={16} />
                </button>
              ))}
              {!matches.buildings.length && !matches.people.length && (
                <p className="muted">Aucun résultat. Essayez un autre nom.</p>
              )}
            </div>
          </section>
        </div>
      )}
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <section
            className="help-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Bienvenue dans Twinlife"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="icon-button dialog-close"
              aria-label="Fermer le guide"
              onClick={() => setHelp(false)}
            >
              <X size={20} />
            </button>
            <span className="eyebrow">BIENVENUE DANS TWINLIFE</span>
            <h2>
              Votre ville.
              <br />
              Toutes ses possibilités.
            </h2>
            <p>
              Explorez les quartiers, suivez un habitant et faites évoluer la
              ville avec un scénario ou une commande.
            </p>
            <div className="shortcut">
              <kbd>Espace</kbd>
              <span>Mettre en pause / reprendre</span>
            </div>
            <div className="shortcut">
              <kbd>1 — 4</kbd>
              <span>Changer de point de vue</span>
            </div>
            <div className="shortcut">
              <kbd>K</kbd>
              <span>Rechercher un lieu ou un habitant</span>
            </div>
            <div className="shortcut">
              <kbd>Échap</kbd>
              <span>Quitter une sélection ou une fenêtre</span>
            </div>
            <p className="data-note">
              Le territoire et ses habitants sont simulés. Les indicateurs
              d’énergie et de confort sont des estimations du modèle ; ils ne
              proviennent pas de capteurs réels.
            </p>
            <button className="primary-button" onClick={() => setHelp(false)}>
              Entrer dans la ville <ArrowRight size={16} />
            </button>
          </section>
        </div>
      )}
    </>
  )
}
function WeatherIcon({ condition }: { condition: Environment['condition'] }) {
  const Icon = WEATHER.find((w) => w.id === condition)?.icon ?? Sun
  return <Icon size={24} />
}

function Inspector({
  panel,
  notify,
}: {
  panel: Panel
  notify: (message: string) => void
}) {
  const state = useStore(),
    insights = getUrbanInsights(state)
  const selected = state.buildings.find(
    (b) => b.id === state.selectedBuildingId,
  )
  const person = state.people.find((p) => p.id === state.selectedPersonId)
  const [filter, setFilter] = useState('')
  const [weatherBusy, setWeatherBusy] = useState(false)
  useEffect(() => setFilter(''), [panel])
  const [scenarioBaseline, setScenarioBaseline] = useState<{
    occupancy: number
    walking: number
    energy: number
  } | null>(null)
  const quality = useView((s) => s.quality)
  const series = state.timeseries ?? []
  const scenario = SCENARIOS.find(
    (s) => s.id === state.environment.activeScenario,
  )
  if (panel === 'assistant')
    return (
      <CommandCenter onClose={() => useView.setState({ panel: 'overview' })} />
    )
  if (panel === 'scenarios')
    return (
      <>
        <PanelHeading
          eyebrow="LABORATOIRE URBAIN"
          title="Et si la ville…"
          text="Changez le contexte. Observez les conséquences."
        />
        <div className="scenario-list">
          {SCENARIOS.map((s, i) => {
            const Icon = [GraduationCap, Sparkles, Snowflake, Moon][i % 4]
            return (
              <button
                className={`scenario-card ${scenario?.id === s.id ? 'active' : ''}`}
                key={s.id}
                onClick={() => {
                  setScenarioBaseline({
                    occupancy: insights.occupancyRate,
                    walking: insights.walking,
                    energy: insights.energyKw,
                  })
                  launchScenario(s.id)
                  notify(`Scénario « ${s.title} » lancé`)
                }}
              >
                <span className="scenario-icon">
                  <Icon size={24} />
                </span>
                <span className="scenario-number">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
                <span className="scenario-action">
                  {scenario?.id === s.id
                    ? 'Scénario en cours'
                    : 'Lancer le scénario'}
                  <ArrowUpRight size={16} />
                </span>
              </button>
            )
          })}
        </div>
        {scenarioBaseline && (
          <section className="inspector-section">
            <h3>Depuis le lancement</h3>
            <Delta
              label="Occupation"
              value={insights.occupancyRate - scenarioBaseline.occupancy}
              unit="pts"
            />
            <Delta
              label="Piétons"
              value={insights.walking - scenarioBaseline.walking}
              unit=""
            />
            <Delta
              label="Énergie estimée"
              value={insights.energyKw - scenarioBaseline.energy}
              unit="kW"
            />
          </section>
        )}
        <p className="data-note">
          Les scénarios modifient réellement la météo, les horaires, les
          déplacements et l’affluence. Les effets se déploient au fil du temps
          simulé.
        </p>
      </>
    )
  if (panel === 'settings')
    return (
      <>
        <PanelHeading
          eyebrow="VOTRE EXPÉRIENCE"
          title="Réglages"
          text="Un monde qui s’adapte à votre rythme."
        />
        <section className="inspector-section">
          <h3>Atmosphère</h3>
          <button
            className="text-button"
            disabled={weatherBusy}
            onClick={async () => {
              setWeatherBusy(true)
              try {
                await useStore.getState().fetchRealWeather()
                notify('Météo de Saguenay importée depuis Open-Meteo')
              } catch {
                notify(
                  'Météo indisponible. Les conditions actuelles sont conservées.',
                )
              } finally {
                setWeatherBusy(false)
              }
            }}
          >
            {weatherBusy
              ? 'Importation en cours…'
              : 'Importer la météo de Saguenay'}
            <ArrowDownToLine size={14} />
          </button>
          <div className="weather-grid">
            {WEATHER.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={state.environment.condition === id ? 'selected' : ''}
                onClick={() =>
                  state.applyDirective({
                    environment: {
                      condition: id,
                      realTime: false,
                      ...(id === 'snow'
                        ? { season: 'hiver' as const, temperature: -4 }
                        : {}),
                    },
                  })
                }
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </div>
          <label className="field-label">
            Saison
            <select
              value={state.environment.season}
              onChange={(e) =>
                state.applyDirective({
                  environment: {
                    season: e.target.value as Environment['season'],
                    realTime: false,
                  },
                })
              }
            >
              <option value="printemps">Printemps</option>
              <option value="ete">Été</option>
              <option value="automne">Automne</option>
              <option value="hiver">Hiver</option>
            </select>
          </label>
          <Toggle
            label="Fin de semaine"
            checked={state.environment.weekend}
            onChange={(value) =>
              state.applyDirective({ environment: { weekend: value } })
            }
          />
        </section>
        <section className="inspector-section">
          <h3>Qualité visuelle</h3>
          <div className="segmented">
            <button
              className={quality === 'high' ? 'selected' : ''}
              onClick={() => useView.setState({ quality: 'high' })}
            >
              Immersive
            </button>
            <button
              className={quality === 'balanced' ? 'selected' : ''}
              onClick={() => useView.setState({ quality: 'balanced' })}
            >
              Équilibrée
            </button>
          </div>
          <Toggle
            label="Ombres du soleil"
            checked={state.settings.shadows}
            onChange={(v) => changeSetting('shadows', v)}
          />
          <Toggle
            label="Diffusion des lumières"
            checked={state.settings.glow}
            onChange={(v) => changeSetting('glow', v)}
          />
          <Toggle
            label="Repères des quartiers"
            checked={state.settings.labels}
            onChange={(v) => changeSetting('labels', v)}
          />
        </section>
        <section className="inspector-section">
          <h3>Recherche & collaborations</h3>
          <label className="field-label">
            Investissement IA{' '}
            <b>{Math.round(state.scenario.investmentAI * 100)} %</b>
            <input
              type="range"
              min="0"
              max="1"
              step=".05"
              value={state.scenario.investmentAI}
              onChange={(e) => {
                const ai = Number(e.target.value)
                state.setScenario({
                  investmentAI: ai,
                  investmentHumanities: 1 - ai,
                })
              }}
            />
          </label>
          <div className="muted">
            Humanités : {Math.round(state.scenario.investmentHumanities * 100)}{' '}
            %
          </div>
          <Toggle
            label="Agents autonomes via l’API"
            checked={state.scenario.llmAgents}
            onChange={(v) => state.setScenario({ llmAgents: v })}
          />
          <p className="data-note">
            Active des décisions périodiques et des modifications de la ville
            via le serveur. Le copilote indique si un modèle est connecté.
          </p>
        </section>
      </>
    )
  if (panel === 'buildings' || selected)
    return (
      <>
        <PanelHeading
          eyebrow="EXPLORER LES LIEUX"
          title={selected?.name ?? 'Architecture vivante'}
          text={
            selected
              ? ZONE_NAMES[selected.zone]
              : `${state.buildings.length} lieux, quatre quartiers connectés.`
          }
        />
        {selected ? (
          <>
            <div
              className="building-identity"
              style={
                {
                  '--zone-color': ZONE_COLORS[selected.zone],
                } as React.CSSProperties
              }
            >
              <Building2 size={44} strokeWidth={1} />
              <span>{selected.type.toUpperCase()}</span>
              <strong>{selected.name}</strong>
              <button
                className="icon-button"
                aria-label="Désélectionner le bâtiment"
                onClick={() => state.setSelectedBuilding(null)}
              >
                <X size={17} />
              </button>
            </div>
            <section className="inspector-section">
              <div className="stat-row">
                <span>À l’intérieur</span>
                <strong>
                  {selected.occupancy}
                  <small> / {selected.capacity}</small>
                </strong>
              </div>
              <div className="progress-track">
                <span
                  style={{
                    width: `${Math.min(100, (selected.occupancy / selected.capacity) * 100)}%`,
                    background: ZONE_COLORS[selected.zone],
                  }}
                />
              </div>
              <div className="stat-row">
                <span>Indice d’activité</span>
                <strong>{Math.round(selected.activity * 100)} %</strong>
              </div>
              <div className="stat-row">
                <span>Horaires</span>
                <strong>
                  {selected.openingHours
                    ? `${clock(selected.openingHours.open)} — ${selected.openingHours.close === 24 ? '24:00' : clock(selected.openingHours.close)}`
                    : 'Accès libre'}
                </strong>
              </div>
            </section>
            <section className="inspector-section">
              <h3>Les habitants de ce lieu</h3>
              {state.people
                .filter(
                  (p) =>
                    p.currentBuildingId === selected.id &&
                    p.presence === 'inside',
                )
                .slice(0, 6)
                .map((p) => (
                  <button
                    className="person-row"
                    key={p.id}
                    onClick={() => {
                      state.setSelectedBuilding(null)
                      state.setSelectedPerson(p.id)
                      useView.setState({ panel: 'people' })
                    }}
                  >
                    <span className="person-avatar">
                      {p.name
                        .split(' ')
                        .map((s) => s[0])
                        .slice(0, 2)
                        .join('')}
                    </span>
                    <span>
                      {p.name}
                      <small>
                        {translateActivity(p.state.currentActivity)}
                      </small>
                    </span>
                    <ArrowUpRight size={15} />
                  </button>
                ))}
              {selected.occupancy === 0 && (
                <p className="muted">Ce lieu est momentanément inoccupé.</p>
              )}
            </section>
            <button
              className="text-button"
              onClick={() => {
                state.setSelectedBuilding(null)
                goTo('overview')
              }}
            >
              Revenir à la ville <ArrowRight size={15} />
            </button>
          </>
        ) : (
          <>
            <div className="inline-search">
              <Search size={15} />
              <input
                placeholder="Rechercher un bâtiment"
                aria-label="Rechercher un bâtiment"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <div className="building-list">
              {state.buildings
                .filter((b) =>
                  b.name.toLowerCase().includes(filter.toLowerCase()),
                )
                .map((b) => (
                  <button
                    key={b.id}
                    className="building-row"
                    onClick={() => inspectBuilding(b)}
                  >
                    <span
                      className="building-swatch"
                      style={{ background: ZONE_COLORS[b.zone] }}
                    >
                      <Building2 size={17} />
                    </span>
                    <span>
                      {b.name}
                      <small>{ZONE_NAMES[b.zone]}</small>
                    </span>
                    <strong>
                      {b.occupancy}
                      <small>pers.</small>
                    </strong>
                  </button>
                ))}
            </div>
          </>
        )}
        <MiniMap />
      </>
    )
  if (panel === 'people')
    return (
      <>
        <PanelHeading
          eyebrow="TRAJECTOIRES HUMAINES"
          title={person?.name ?? 'Une ville de vies'}
          text={`${insights.walking} habitants se déplacent en ce moment.`}
        />
        {person && (
          <section className="person-profile">
            <div className="person-avatar large">
              {person.name
                .split(' ')
                .map((s) => s[0])
                .slice(0, 2)
                .join('')}
            </div>
            <h3>{person.name}</h3>
            <span className="small-pill">
              {person.presence === 'walking'
                ? 'En déplacement'
                : 'À l’intérieur'}{' '}
              · {translateActivity(person.state.currentActivity)}
            </span>
            <div className="stat-row">
              <span>Destination</span>
              <strong>
                {state.buildings.find((b) => b.id === person.targetBuildingId)
                  ?.name ?? '—'}
              </strong>
            </div>
            <div className="stat-row">
              <span>État d’esprit</span>
              <strong>
                {
                  {
                    happy: 'Heureux',
                    neutral: 'Serein',
                    stressed: 'Stressé',
                    tired: 'Fatigué',
                    talking: 'En conversation',
                  }[person.state.mood]
                }
              </strong>
            </div>
            <div className="stat-row">
              <span>Énergie</span>
              <strong>{Math.round(person.traits.energy * 100)} %</strong>
            </div>
            <button
              className="text-button"
              onClick={() => {
                state.setSelectedPerson(null)
                goTo('overview')
              }}
            >
              Arrêter le suivi <X size={14} />
            </button>
          </section>
        )}
        <div className="inline-search">
          <Search size={15} />
          <input
            placeholder="Rechercher un habitant"
            aria-label="Rechercher un habitant"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="people-list">
          {state.people
            .filter(
              (p) =>
                !filter || p.name.toLowerCase().includes(filter.toLowerCase()),
            )
            .slice(0, 35)
            .map((p) => (
              <button
                className={`person-row ${p.id === person?.id ? 'selected' : ''}`}
                key={p.id}
                onClick={() => {
                  state.setSelectedBuilding(null)
                  state.setSelectedPerson(p.id)
                }}
              >
                <span className="person-avatar">
                  {p.name
                    .split(' ')
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join('')}
                </span>
                <span>
                  {p.name}
                  <small>
                    {p.presence === 'walking'
                      ? 'En déplacement'
                      : translateActivity(p.state.currentActivity)}
                  </small>
                </span>
                <Crosshair size={15} />
              </button>
            ))}
        </div>
        <p className="data-note">
          Sélectionnez un habitant pour suivre son parcours. Les horaires, la
          météo et les besoins influencent ses déplacements.
        </p>
      </>
    )
  return (
    <>
      <PanelHeading
        eyebrow="LE POULS DU TERRITOIRE"
        title="Tout est connecté."
        text="Observez la ville prendre vie, en temps réel."
      />
      <div className="live-summary">
        <span>
          <span className="live-dot" />{' '}
          {state.settings.running ? 'En direct' : 'En pause'}
        </span>
        <span>{clock(state.environment.gameTime)}</span>
      </div>
      <section className="main-metric">
        <span>
          Population présente <Users size={16} />
        </span>
        <strong>
          {format(state.metrics.totalPeople)}
          <span>habitants</span>
        </strong>
        <div>
          <span className="mint-text">{insights.walking} en déplacement</span>
          <span>{state.metrics.totalOccupancy} à l’intérieur</span>
        </div>
      </section>
      <div className="metric-pair">
        <Metric
          icon={<Building2 size={17} />}
          label="Occupation"
          value={`${Math.round(insights.occupancyRate)}%`}
          caption="de la capacité totale"
        />
        <Metric
          icon={<Zap size={17} />}
          label="Énergie estimée"
          value={format(insights.energyKw)}
          caption="kW · modèle simplifié"
        />
      </div>
      <section className="inspector-section activity-section">
        <div className="section-title">
          <h3>Le rythme de la ville</h3>
          <span>OCCUPATION</span>
        </div>
        <Sparkline values={series.map((s) => s.occupancy)} />
        <div className="chart-caption">
          <span>
            {series.length > 1
              ? 'Historique de la session'
              : 'Collecte des premières observations…'}
          </span>
          <span>Maintenant</span>
        </div>
      </section>
      <section className="inspector-section">
        <div className="section-title">
          <h3>Quatre quartiers. Un monde.</h3>
          <button
            className="icon-button"
            aria-label="Voir tous les bâtiments"
            onClick={() => useView.setState({ panel: 'buildings' })}
          >
            <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="districts">
          {Object.entries(ZONE_NAMES).map(([id, name]) => {
            const district = state.buildings.filter((b) => b.zone === id)
            const count = district.reduce((sum, b) => sum + b.occupancy, 0)
            return (
              <button
                key={id}
                className="district-row"
                disabled={!district.length}
                onClick={() => inspectBuilding(district[0])}
              >
                <span
                  style={{
                    background: ZONE_COLORS[id as keyof typeof ZONE_COLORS],
                  }}
                />
                <span>
                  {name}
                  <small>{district.length} bâtiments</small>
                </span>
                <strong>
                  {count}
                  <small>pers.</small>
                </strong>
                <ArrowUpRight size={14} />
              </button>
            )
          })}
        </div>
      </section>
      <div className="scenario-teaser">
        <span className="eyebrow">EXPÉRIMENTEZ</span>
        <Sparkles size={22} />
        <h3>
          Un changement.
          <br />
          Mille répercussions.
        </h3>
        <p>
          Une tempête, un festival, une nouvelle journée. Faites le premier pas.
        </p>
        <button onClick={() => useView.setState({ panel: 'scenarios' })}>
          Explorer les scénarios <ArrowRight size={16} />
        </button>
      </div>
      <section className="inspector-section">
        <div className="section-title">
          <h3>Journal de la ville</h3>
          <span className="live-dot" />
        </div>
        {state.news
          .slice(-3)
          .reverse()
          .map((n) => (
            <div className="news-entry" key={n.id}>
              <span />
              <p>{n.text}</p>
            </div>
          ))}
        {!state.news.length && (
          <p className="muted">
            La journée commence. Les événements de la simulation apparaîtront
            ici.
          </p>
        )}
      </section>
      <p className="data-note">
        Territoire fictif situé à Saguenay. Indicateurs calculés à partir de la
        simulation locale.
      </p>
    </>
  )
}
function PanelHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string
  title: string
  text: string
}) {
  return (
    <div className="panel-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  )
}
function Metric({
  icon,
  label,
  value,
  caption,
}: {
  icon: ReactNode
  label: string
  value: string
  caption: string
}) {
  return (
    <div className="metric-cell">
      <span>
        {icon}
        {label}
      </span>
      <strong>{value}</strong>
      <small>{caption}</small>
    </div>
  )
}
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-track" />
    </label>
  )
}
function Delta({
  label,
  value,
  unit,
}: {
  label: string
  value: number
  unit: string
}) {
  return (
    <div className="stat-row">
      <span>{label}</span>
      <strong className="mint-text">
        {value > 0 ? '+' : ''}
        {format(value)} {unit}
      </strong>
    </div>
  )
}
function translateActivity(activity: string) {
  return (
    (
      {
        work: 'Au travail',
        study: 'Étudie',
        eat: 'En pause repas',
        sleep: 'Se repose',
        leisure: 'Temps libre',
        idle: 'Activité quotidienne',
        talking: 'En conversation',
        walking: 'En déplacement',
      } as Record<string, string>
    )[activity] ?? activity
  )
}
