import type { Directive } from './schemas.js'
import { BUILDING_TARGETS } from './config.js'

const clean = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’‘]/g, "'")
const TARGETS = [...BUILDING_TARGETS, 'cafétéria', 'gymnase', 'tour tech', 'siège social', 'hub startups', 'banque', 'mairie', 'parc de bureaux', 'hôpital', 'commissariat', 'tour résidentielle a', 'tour résidentielle b', 'logements familiaux', 'résidences étudiantes', 'parc public', 'école primaire', 'centre commercial', 'restaurants', 'cinéma', 'supermarché', 'hôtel', 'centre de loisirs', 'marché public']
const aliases: Record<string, string> = { bibliotheque: 'bibliothèque', cafe: 'cafétéria', restaurant: 'restaurants', parc: 'parc public', hopital: 'hôpital', cinema: 'cinéma', 'tour tech': 'tour tech' }

function targetsIn(text: string): string[] {
  const normalized = clean(text)
  const matches = TARGETS.filter(target => new RegExp(`\\b${clean(target)}\\b`).test(normalized))
  for (const [alias, target] of Object.entries(aliases)) {
    if (new RegExp(`\\b${alias}\\b`).test(normalized) && !matches.includes(target) && !matches.some(candidate => clean(candidate).includes(alias))) matches.push(target)
  }
  const location = (target: string) => {
    const direct = normalized.indexOf(clean(target))
    if (direct >= 0) return direct
    return Math.min(...Object.entries(aliases).filter(([alias, value]) => value === target && normalized.includes(alias)).map(([alias]) => normalized.indexOf(alias)))
  }
  return matches.sort((left, right) => location(left) - location(right))
}

function roleIn(text: string): NonNullable<NonNullable<Directive['peopleAdd']>[number]['role']> {
  return /\betudiant/.test(text) ? 'student' : /\bprofess/.test(text) ? 'professor' : /\bemploy/.test(text) ? 'employee' : /\b(?:ouvrier|travailleur)/.test(text) ? 'worker' : 'visitor'
}

/** Small explicit command grammar. Unsupported requests produce no action. */
export function fallbackDirectiveRules(prompt: string): Directive {
  const normalized = clean(prompt).trim()
  const directive: Directive = {}
  const environment: NonNullable<Directive['environment']> = {}
  const targets = targetsIn(prompt)
  const adding = /^(?:s'il te plait[,]?\s+)?(?:ajoute|ajouter|cree|creer|construis)\b/.test(normalized)
  const buildingMatch = adding ? prompt.match(/(?:ajoute(?:r)?|cr[ée]e(?:r)?|construis)\s+(?:un\s+|une\s+)?(?:nouveau\s+|nouvelle\s+)?(b[aâ]timent|caf[ée]|parc|restaurant|biblioth[èe]que|h[oô]pital|[ée]cole|bureau|r[ée]sidence)(?=\s|$)\s*(.*)/i) : null
  if (buildingMatch) {
    const kind = clean(buildingMatch[1])
    const rawName = buildingMatch[2].replace(/^(?:nomm[ée]e?|appel[ée]e?)\s+/i, '').split(/\s+(?:dans|sur)\s+(?:(?:la|le|les|une?)\s+)?(?:zone|campus|centre|quartier)/i)[0]
    const name = rawName.replace(/^[\s"«“]+|[\s"»”.!?]+$/g, '').trim() || buildingMatch[1]
    const type: NonNullable<NonNullable<Directive['buildingAdd']>[number]['type']> = kind === 'parc' ? 'park' : ['cafe', 'restaurant'].includes(kind) ? 'food' : kind === 'hopital' ? 'healthcare' : ['bibliotheque', 'ecole'].includes(kind) ? 'academic' : kind === 'residence' ? 'residence' : 'office'
    const zone = /\b(?:residentiel|residentielle)\b/.test(normalized) ? 'residential' : /\bcentre[- ]ville\b/.test(normalized) ? 'downtown' : /\bcampus\b/.test(normalized) ? 'campus' : type === 'residence' || type === 'park' ? 'residential' : 'commercial'
    directive.buildingAdd = [{ name: name.charAt(0).toUpperCase() + name.slice(1), type, zone }]
    return directive
  }

  if (adding) {
    const countMatch = normalized.match(/(?:ajoute(?:r)?|cree(?:r)?)\s+(\d+|un|une|des)\s+(personnes?|etudiant(?:e)?s?|habitant(?:e)?s?|employe(?:e)?s?|visiteurs?|professeurs?|femmes?|hommes?)\b/)
    const named = prompt.match(/(?:ajoute(?:r)?|cr[ée]e(?:r)?)\s+(?:une?\s+(?:personne|habitante?|[ée]tudiante?|employ[ée]e?)\s+nomm[ée]e?\s+)?([\p{L}][\p{L}\s’'\-]*?)(?=\s+comme\s+|\s+(?:à|au|aux|chez)\s+|[.!?]?$)/iu)
    const name = named?.[1].trim()
    const isName = name && !/^(?:un|une|des|personnes?|etudiants?|habitants?|de|du|la|le|l')\b/.test(clean(name))
    const namedExplicitly = /\bnommee?\b/.test(normalized)
    if (namedExplicitly && isName || !countMatch && isName) {
      const role = roleIn(normalized)
      directive.peopleAdd = [{ count: 1, name, role, to: targets[0], workplace: role !== 'visitor' ? targets[0] : undefined }]
    } else if (countMatch) {
      const count = /^\d+$/.test(countMatch[1]) ? Math.min(200, Math.max(1, Number(countMatch[1]))) : countMatch[1] === 'des' ? 20 : 1
      const role = roleIn(normalized)
      directive.peopleAdd = [{ count, role, gender: /\bfemmes?\b/.test(normalized) ? 'female' : /\bhommes?\b/.test(normalized) ? 'male' : undefined, to: targets[0], workplace: role !== 'visitor' ? targets[0] : undefined }]
    }
    return directive
  }

  const decreases = /\b(?:diminue|baisse|reduis)\b|moins d'activite/.test(normalized)
  const increases = /\b(?:augmente|intensifie)\b|plus d'activite/.test(normalized)
  if ((decreases || increases) && targets.length) directive.buildingActivityChanges = targets.map(buildingName => ({ buildingName, activityDelta: decreases ? -0.2 : 0.2 }))
  const activityPercent = normalized.match(/\bactivite\b.*?\b(?:a|de|=)\s*(\d{1,3})\s*%/)
  if (activityPercent && targets.length) {
    directive.buildingActivitySet = targets.map(buildingName => ({ buildingName, level: Math.min(100, Number(activityPercent[1])) / 100 }))
    delete directive.buildingActivityChanges
  }
  if (/\binacti(?:f|ve)s?\b/.test(normalized) && targets.length) directive.buildingActivitySet = targets.map(buildingName => ({ buildingName, level: 0 }))

  const global: NonNullable<Directive['global']> = {}
  const speed = normalized.match(/\b(?:vitesse|accelere|ralentis)\b[^\d]{0,15}(\d+(?:[.,]\d+)?)/)
  if (speed) global.speedSet = Math.max(0.1, Math.min(5, Number(speed[1].replace(',', '.'))))
  else if (/\b(?:ralentis|ralentir)\b|plus lent/.test(normalized)) global.speedMultiplier = 0.8
  else if (/\baccelere\b|plus vite/.test(normalized)) global.speedMultiplier = 1.2
  if (/\b(?:reinitialise|redemarre)\b/.test(normalized) && /\b(?:aleatoire|random)\b/.test(normalized)) global.resetRandom = true
  if (Object.keys(global).length) directive.global = global

  const visibility: NonNullable<Directive['visibility']> = {}
  if (/\bcache\b/.test(normalized) && targets.length) visibility.hide = targets
  if (/\baffiche\b/.test(normalized) && /\b(?:uniquement|seulement)\b/.test(normalized) && targets.length) visibility.showOnly = targets
  if (/\b(?:tous|tout)\b/.test(normalized) && /\b(?:affiche|montre|visibles?)\b/.test(normalized)) visibility.showAll = true
  if (Object.keys(visibility).length) directive.visibility = visibility
  const settings: NonNullable<Directive['settings']> = {}
  const disable = /\bdesactive\b/.test(normalized)
  if (disable || /\bactive\b/.test(normalized)) {
    if (/\bombres?\b/.test(normalized)) settings.shadows = !disable
    if (/\b(?:glow|luminescence)\b/.test(normalized)) settings.glow = !disable
    if (/\b(?:labels|noms)\b/.test(normalized)) settings.labels = !disable
  }
  if (Object.keys(settings).length) directive.settings = settings

  const environmentIntent = /\b(?:passe|mets|change|active|choisis|regle|fixe|simule)\b|^(?:en\s+)?(?:hiver|ete|printemps|automne|matin|midi|apres|soir|nuit|neige|pluie|soleil|tempete)\b/.test(normalized)
  if (environmentIntent) {
    for (const season of ['hiver', 'printemps', 'ete', 'automne'] as const) if (new RegExp(`\\b${season}\\b`).test(normalized)) environment.season = season
    if (/\bmatin(?:ee)?\b/.test(normalized)) environment.dayPeriod = 'matin'
    if (/\bmidi\b/.test(normalized)) environment.dayPeriod = 'midi'
    if (/\bapres[- ]midi\b/.test(normalized)) environment.dayPeriod = 'apresmidi'
    if (/\bsoir(?:ee)?\b/.test(normalized)) environment.dayPeriod = 'soir'
    if (/\bnuit\b/.test(normalized)) environment.dayPeriod = 'nuit'
    const clock = normalized.match(/\b([01]?\d|2[0-3])\s*(?:h(?:eures?)?|:)\s*([0-5]\d)?\b/)
    if (clock) environment.gameTime = Number(clock[1]) + Number(clock[2] ?? 0) / 60
    if (/\bweek[- ]?end\b/.test(normalized)) environment.weekend = true
    if (/\bsemaine\b/.test(normalized)) environment.weekend = false
    if (/\b(?:neige|enneige|tempete)\b/.test(normalized)) { environment.condition = 'snow'; environment.temperature = -8; environment.season = 'hiver' }
    if (/\b(?:pluie|pleut|pluvieux)\b/.test(normalized)) environment.condition = 'rain'
    if (/\b(?:ensoleille|soleil|ciel clair)\b/.test(normalized)) environment.condition = 'clear'
    if (/\b(?:nuageux|nuages)\b/.test(normalized)) environment.condition = 'cloudy'
    const temperature = normalized.match(/(-?\d+(?:[.,]\d+)?)\s*(?:°\s*c?|degres?)\b/)
    if (temperature) environment.temperature = Math.max(-60, Math.min(55, Number(temperature[1].replace(',', '.'))))
    if (Object.keys(environment).length) directive.environment = environment

  }

  const durationMatch = normalized.match(/pendant\s+(\d+)\s*(secondes?|s\b|minutes?)/)
  const duration = durationMatch ? Math.min(300, Math.max(1, Number(durationMatch[1]) * (durationMatch[2].startsWith('minute') ? 60 : 1))) : 10
  if (/\bpause\b/.test(normalized)) directive.effects = [{ type: 'pause', durationSec: duration }]
  if (/pic d'activite|\bsurcharge\b/.test(normalized) && targets.length) directive.effects = [...(directive.effects ?? []), ...targets.map(buildingName => ({ type: 'activitySpike' as const, buildingName, delta: 0.4, durationSec: duration }))]
  const flow = normalized.match(/\b(?:envoie|deplace|dirige)\s+(\d+)\s+(?:personnes?|habitants?|etudiants?)\b/)
  if (flow && targets.length) directive.personFlows = [{ count: Math.min(500, Number(flow[1])), to: targets[targets.length - 1], from: targets.length > 1 ? targets[0] : undefined }]
  if (/\bjournee d'examens\b/.test(normalized)) {
    directive.buildingActivitySet = ['sciences', 'ingénierie', 'bibliothèque'].map(buildingName => ({ buildingName, level: 0.9 }))
    directive.peopleAdd = [{ count: 80, to: 'bibliothèque', role: 'student' }]
  }
  return directive
}
