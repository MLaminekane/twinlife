import type { Directive } from './schemas.js'
import { BUILDING_TARGETS } from './config.js'

export function fallbackDirectiveRules(prompt: string): Directive {
  const lower = prompt.toLowerCase()
  const changes: { buildingName: string, activityDelta: number }[] = []
  const visibility: { hide?: string[]; showOnly?: string[]; showAll?: boolean } = {}
  const settings: { glow?: boolean; shadows?: boolean; labels?: boolean } = {}
  const environment: { season?: 'hiver'|'printemps'|'ete'|'automne'; dayPeriod?: 'matin'|'midi'|'apresmidi'|'soir'|'nuit'; weekend?: boolean } = {}
  const buildingActivitySet: { buildingName: string, level: number }[] = []
  const effects: Array<{ type: 'activitySpike'; buildingName: string; delta: number; durationSec: number } | { type: 'pause'; durationSec: number }> = []
  const peopleAdd: { count: number; gender?: 'male'|'female'; to?: string }[] = []
  const buildingAdd: { name: string; position?: [number, number, number]; size?: [number, number, number] }[] = []

  // Activity changes
  for (const t of BUILDING_TARGETS) {
    if (lower.includes(t)) {
      const delta = lower.includes('diminu') ? -0.2 : lower.includes('baisse') ? -0.2 : 0.2
      changes.push({ buildingName: t, activityDelta: delta })
    }
  }

  // Speed controls
  let speedMultiplier: number | undefined
  let speedSet: number | undefined
  let resetRandom: boolean | undefined

  if (lower.includes('ralent') || lower.includes('lent')) speedMultiplier = 0.8
  if (lower.includes('accél') || lower.includes('plus vite')) speedMultiplier = 1.2

  const speedSetMatch = lower.match(/(?:accélère|ralentis|vitesse|simul\w*).{0,10}?\b(?:a|à|=)\s*([0-9]+(?:\.[0-9]+)?)/)
  if (speedSetMatch) speedSet = Math.max(0.1, Math.min(5, parseFloat(speedSetMatch[1])))

  if (lower.includes('redémarre') || lower.includes('redemarre') || lower.includes('réinitialise') || lower.includes('reinitialise')) {
    if (lower.includes('aléatoire') || lower.includes('aleatoire') || lower.includes('random')) {
      resetRandom = true
    }
  }

  // Visibility
  if (lower.includes('cache') && lower.includes('bâtiment')) {
    for (const t of BUILDING_TARGETS) if (lower.includes(t)) visibility.hide = [...(visibility.hide ?? []), t]
  }
  if (lower.includes('affiche') && lower.includes('uniquement')) {
    const only: string[] = []
    for (const t of BUILDING_TARGETS) if (lower.includes(t)) only.push(t)
    if (only.length) visibility.showOnly = only
  }
  if ((lower.includes('tous les bâtiments') || lower.includes('tous les batiments')) && (lower.includes('visible') || lower.includes('visibles'))) {
    visibility.showAll = true
  }

  // UI settings
  if (lower.includes('désactive') || lower.includes('desactive')) {
    if (lower.includes('ombres')) settings.shadows = false
    if (lower.includes('glow') || lower.includes('luminescence')) settings.glow = false
    if (lower.includes('labels') || lower.includes('noms')) settings.labels = false
  }
  if (lower.includes('active')) {
    if (lower.includes('ombres')) settings.shadows = true
    if (lower.includes('glow') || lower.includes('luminescence')) settings.glow = true
    if (lower.includes('labels') || lower.includes('noms')) settings.labels = true
  }

  // Environment
  if (lower.includes('hiver')) environment.season = 'hiver'
  if (lower.includes('automne')) environment.season = 'automne'
  if (lower.includes('printemps')) environment.season = 'printemps'
  if (lower.includes('été') || lower.includes('ete')) environment.season = 'ete'

  if (lower.includes('matin')) environment.dayPeriod = 'matin'
  if (lower.includes('midi')) environment.dayPeriod = 'midi'
  if (lower.includes('après-midi') || lower.includes('apres-midi')) environment.dayPeriod = 'apresmidi'
  if (lower.includes('soir')) environment.dayPeriod = 'soir'
  if (lower.includes('nuit')) environment.dayPeriod = 'nuit'

  if (lower.includes('week-end') || lower.includes('weekend')) environment.weekend = true
  if (lower.includes('semaine')) environment.weekend = false

  // More activity changes
  for (const t of BUILDING_TARGETS) {
    if (lower.includes('augmente') && lower.includes(t)) changes.push({ buildingName: t, activityDelta: 0.2 })
    if ((lower.includes('diminue') || lower.includes('baisse')) && lower.includes(t)) changes.push({ buildingName: t, activityDelta: -0.2 })
  }

  // Set inactive
  if (lower.includes('inactif') || lower.includes('inactive')) {
    for (const t of BUILDING_TARGETS) if (lower.includes(t)) buildingActivitySet.push({ buildingName: t, level: 0 })
  }

  // Effects
  const durationMatch = lower.match(/pendant\s+(\d+)\s*seconde/)
  const spikeDuration = durationMatch ? Math.max(1, parseInt(durationMatch[1])) : undefined
  if (lower.includes("pic d'activité") || lower.includes("pic d'activit") || lower.includes('surcharge')) {
    for (const t of BUILDING_TARGETS) {
      if (lower.includes(t)) {
        effects.push({ type: 'activitySpike', buildingName: t, delta: 0.4, durationSec: spikeDuration ?? 10 })
      }
    }
  }

  // Add building
  if (lower.includes('ajoute') && (lower.includes('bâtiment') || lower.includes('batiment'))) {
    const nameMatch = lower.match(/ajoute\s+(?:un\s+)?b[aâ]timent\s+(?:nomm[ée]?)?\s*([a-zàâçéèêëîïôûùüÿñæœ\- ]+)/)
    if (nameMatch) {
      const name = nameMatch[1].trim().replace(/\s+/g, ' ')
      if (name) buildingAdd.push({ name: name.charAt(0).toUpperCase() + name.slice(1) })
    }
  }

  // Add people
  if (lower.includes('ajoute') && (lower.includes('personnes') || lower.includes('étudiants') || lower.includes('etudiants'))) {
    const countMatch = lower.match(/ajoute\s+(\d+)/)
    const count = countMatch ? Math.max(1, parseInt(countMatch[1])) : 20
    const gender: 'male'|'female'|undefined = lower.includes('femme') || lower.includes('femmes') ? 'female' : (lower.includes('homme') || lower.includes('hommes') ? 'male' : undefined)
    let to: string | undefined
    for (const t of BUILDING_TARGETS) if (lower.includes(t)) { to = t; break }
    peopleAdd.push({ count, gender, to })
  }

  // Scenarios
  if (lower.includes('journée d\'examens') || lower.includes('journee d\'examens')) {
    buildingActivitySet.push({ buildingName: 'sciences', level: 0.9 })
    buildingActivitySet.push({ buildingName: 'ingénierie', level: 0.85 })
    buildingActivitySet.push({ buildingName: 'bibliothèque', level: 0.95 })
    peopleAdd.push({ count: 80, to: 'bibliothèque' })
  }
  if (lower.includes('midi')) {
    for (const t of BUILDING_TARGETS) effects.push({ type: 'activitySpike', buildingName: t, delta: 0.3, durationSec: 8 })
  }
  if (lower.includes('événement') || lower.includes('evenement')) {
    if (lower.includes('médecine') || lower.includes('medecine')) {
      buildingActivitySet.push({ buildingName: 'médecine', level: 0.9 })
      peopleAdd.push({ count: 40, to: 'médecine' })
    }
  }
  if (lower.includes('réinitialise') || lower.includes('reinitialise')) {
    if (lower.includes('moyen')) {
      for (const t of BUILDING_TARGETS) buildingActivitySet.push({ buildingName: t, level: 0.5 })
    }
  }

  return {
    buildingActivityChanges: changes.length ? changes : undefined,
    buildingActivitySet: buildingActivitySet.length ? buildingActivitySet : undefined,
    peopleAdd: peopleAdd.length ? peopleAdd : undefined,
    buildingAdd: buildingAdd.length ? buildingAdd : undefined,
    global: (speedMultiplier || speedSet || resetRandom) ? { speedMultiplier, speedSet, resetRandom } : undefined,
    personFlows: undefined,
    visibility: (visibility.hide?.length || visibility.showOnly?.length || visibility.showAll) ? visibility : undefined,
    settings: (Object.keys(settings).length ? settings : undefined),
    effects: effects.length ? effects : undefined,
    environment: (Object.keys(environment).length ? environment : undefined)
  }
}
