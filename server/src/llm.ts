import { z } from 'zod'
import OpenAI from 'openai'

const DirectiveSchema = z.object({
  buildingActivityChanges: z.array(z.object({ buildingName: z.string(), activityDelta: z.number() })).optional(),
  buildingActivitySet: z.array(z.object({ buildingName: z.string(), level: z.number() })).optional(),
  personFlows: z.array(z.object({ from: z.string().optional(), to: z.string(), count: z.number() })).optional(),
  peopleAdd: z.array(z.object({ count: z.number(), gender: z.union([z.literal('male'), z.literal('female')]).optional(), to: z.string().optional() })).optional(),
  buildingAdd: z.array(z.object({ name: z.string(), position: z.tuple([z.number(), z.number(), z.number()]).optional(), size: z.tuple([z.number(), z.number(), z.number()]).optional() })).optional(),
  global: z.object({ speedMultiplier: z.number().optional(), speedSet: z.number().optional(), resetRandom: z.boolean().optional() }).partial().optional(),
  visibility: z.object({
    hide: z.array(z.string()).optional(),
    showOnly: z.array(z.string()).optional(),
    showAll: z.boolean().optional()
  }).partial().optional(),
  settings: z.object({ glow: z.boolean().optional(), shadows: z.boolean().optional(), labels: z.boolean().optional() }).partial().optional(),
  effects: z.array(
    z.union([
      z.object({ type: z.literal('activitySpike'), buildingName: z.string(), delta: z.number(), durationSec: z.number() }),
      z.object({ type: z.literal('pause'), durationSec: z.number() })
    ])
  ).optional(),
  environment: z.object({
    season: z.union([z.literal('hiver'), z.literal('printemps'), z.literal('ete'), z.literal('automne')]).optional(),
    dayPeriod: z.union([z.literal('matin'), z.literal('midi'), z.literal('apresmidi'), z.literal('soir'), z.literal('nuit')]).optional(),
    weekend: z.boolean().optional()
  }).partial().optional()
})
export type Directive = z.infer<typeof DirectiveSchema>

const SYSTEM_PROMPT = `Tu es un planificateur de campus universitaire. Tu renvoies UNIQUEMENT du JSON respectant ce schema:
{
  "buildingActivityChanges"?: [{ "buildingName": string, "activityDelta": number }],
  "buildingActivitySet"?: [{ "buildingName": string, "level": number }],
  "personFlows"?: [{ "from"?: string, "to": string, "count": number }],
  "peopleAdd"?: [{ "count": number, "gender"?: "male"|"female", "to"?: string }],
  "buildingAdd"?: [{ "name": string, "position"?: [number, number, number], "size"?: [number, number, number] }],
  "global"?: { "speedMultiplier"?: number, "speedSet"?: number, "resetRandom"?: boolean },
  "visibility"?: { "hide"?: string[], "showOnly"?: string[], "showAll"?: boolean },
  "settings"?: { "glow"?: boolean, "shadows"?: boolean, "labels"?: boolean },
  "effects"?: [ { "type": "activitySpike", "buildingName": string, "delta": number, "durationSec": number } | { "type": "pause", "durationSec": number } ],
  "environment"?: { "season"?: "hiver"|"printemps"|"ete"|"automne", "dayPeriod"?: "matin"|"midi"|"apresmidi"|"soir"|"nuit", "weekend"?: boolean }
}
- activityDelta ∈ [-1, 1]
- level ∈ [0, 1]
- speedMultiplier > 0 ; speedSet ∈ [0.1, 5]
- buildingName peut être un sous-texte (ex: "Sciences")
Ne mets aucun texte hors JSON.`

function fallbackRules(prompt: string): Directive {
  const lower = prompt.toLowerCase()
  const targets = [ 'sciences', 'ingénierie', 'médecine', 'économie', 'arts', 'droit', 'bibliothèque', 'administration' ]
  const changes: { buildingName: string, activityDelta: number }[] = []
  const visibility: { hide?: string[]; showOnly?: string[]; showAll?: boolean } = {}
  const settings: { glow?: boolean; shadows?: boolean; labels?: boolean } = {}
  const environment: { season?: 'hiver'|'printemps'|'ete'|'automne'; dayPeriod?: 'matin'|'midi'|'apresmidi'|'soir'|'nuit'; weekend?: boolean } = {}
  const buildingActivitySet: { buildingName: string, level: number }[] = []
  const effects: Array<{ type: 'activitySpike'; buildingName: string; delta: number; durationSec: number } | { type: 'pause'; durationSec: number }> = []
  const peopleAdd: { count: number; gender?: 'male'|'female'; to?: string }[] = []
  const buildingAdd: { name: string; position?: [number, number, number]; size?: [number, number, number] }[] = []
  for (const t of targets) {
    if (lower.includes(t)) {
      const delta = lower.includes('diminu') ? -0.2 : lower.includes('baisse') ? -0.2 : 0.2
      changes.push({ buildingName: t, activityDelta: delta })
    }
  }
  let speedMultiplier: number | undefined
  let speedSet: number | undefined
  let resetRandom: boolean | undefined
  if (lower.includes('ralent') || lower.includes('lent')) speedMultiplier = 0.8
  if (lower.includes('accél') || lower.includes('plus vite')) speedMultiplier = 1.2
  // Speed set like "à 1.0" or "à 0.2"
  const speedSetMatch = lower.match(/(?:accélère|ralentis|vitesse|simul\w*).{0,10}?\b(?:a|à|=)\s*([0-9]+(?:\.[0-9]+)?)/)
  if (speedSetMatch) speedSet = Math.max(0.1, Math.min(5, parseFloat(speedSetMatch[1])))

  if (lower.includes('redémarre') || lower.includes('redemarre') || lower.includes('réinitialise') || lower.includes('reinitialise')) {
    if (lower.includes('aléatoire') || lower.includes('aleatoire') || lower.includes('aléatoires') || lower.includes('aleatoires') || lower.includes('random')) {
      resetRandom = true
    }
  }

  // Visibility intents
  // "cache le bâtiment droit" -> hide: ["droit"]
  if (lower.includes('cache') && lower.includes('bâtiment')) {
    for (const t of targets) if (lower.includes(t)) visibility.hide = [...(visibility.hide ?? []), t]
  }
  // "affiche uniquement sciences et ingénierie" -> showOnly: ["sciences", "ingénierie"]
  if (lower.includes('affiche') && lower.includes('uniquement')) {
    const only: string[] = []
    for (const t of targets) if (lower.includes(t)) only.push(t)
    if (only.length) visibility.showOnly = only
  }
  // "rends tous les bâtiments visibles" -> showAll: true
  if ((lower.includes('tous les bâtiments') || lower.includes('tous les batiments')) && (lower.includes('visible') || lower.includes('visibles'))) {
    visibility.showAll = true
  }

  // UI settings intents
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

  // Environment intents (season)
  if (lower.includes('hiver')) environment.season = 'hiver'
  if (lower.includes('automne')) environment.season = 'automne'
  if (lower.includes('printemps')) environment.season = 'printemps'
  if (lower.includes('été') || lower.includes('ete')) environment.season = 'ete'

  // Day periods
  if (lower.includes('matin')) environment.dayPeriod = 'matin'
  if (lower.includes('midi')) environment.dayPeriod = 'midi'
  if (lower.includes('après-midi') || lower.includes('apres-midi') || lower.includes('apres midi') || lower.includes('après midi')) environment.dayPeriod = 'apresmidi'
  if (lower.includes('soir')) environment.dayPeriod = 'soir'
  if (lower.includes('nuit')) environment.dayPeriod = 'nuit'

  // Weekend / weekday
  if (lower.includes('week-end') || lower.includes('weekend') || lower.includes('fin de semaine')) environment.weekend = true
  if (lower.includes('semaine')) environment.weekend = false

  
  for (const t of targets) {
    if (lower.includes('augmente') && lower.includes(t)) changes.push({ buildingName: t, activityDelta: 0.2 })
    if ((lower.includes('diminue') || lower.includes('baisse')) && lower.includes(t)) changes.push({ buildingName: t, activityDelta: -0.2 })
  }
  // Inactive (set level 0)
  if (lower.includes('inactif') || lower.includes('inactive')) {
    for (const t of targets) if (lower.includes(t)) buildingActivitySet.push({ buildingName: t, level: 0 })
  }
  // Spike for duration e.g. "pendant 10 secondes"
  const durationMatch = lower.match(/pendant\s+(\d+)\s*seconde/)
  const spikeDuration = durationMatch ? Math.max(1, parseInt(durationMatch[1])) : undefined
  if (lower.includes('pic d\'activité') || lower.includes('pic d’activit') || lower.includes('surcharge')) {
    for (const t of targets) if (lower.includes(t)) effects.push({ type: 'activitySpike', buildingName: t, delta: 0.4, durationSec: spikeDuration ?? 10 })
  }

  // Add building: "ajoute" + a name
  if (lower.includes('ajoute') && lower.includes('bâtiment') || lower.includes('batiment')) {
    const nameMatch = lower.match(/ajoute\s+(?:un\s+)?b[aâ]timent\s+(?:nomm[ée]?)?\s*([a-zàâçéèêëîïôûùüÿñæœ\- ]+)/)
    if (nameMatch) {
      const name = nameMatch[1].trim().replace(/\s+/g, ' ')
      if (name) buildingAdd.push({ name: name.charAt(0).toUpperCase() + name.slice(1) })
    }
  }
  // Add people with gender
  if (lower.includes('ajoute') && (lower.includes('personnes') || lower.includes('étudiants') || lower.includes('etudiants'))) {
    const countMatch = lower.match(/ajoute\s+(\d+)/)
    const count = countMatch ? Math.max(1, parseInt(countMatch[1])) : 20
    const gender: 'male'|'female'|undefined = lower.includes('femme') || lower.includes('femmes') ? 'female' : (lower.includes('homme') || lower.includes('hommes') ? 'male' : undefined)
    let to: string | undefined
    for (const t of targets) if (lower.includes(t)) { to = t; break }
    peopleAdd.push({ count, gender, to })
  }

  // Scenarios
  if (lower.includes('journée d\'examens') || lower.includes('journee d\'examens') || lower.includes('journée d’examens')) {
    // High activities in Sciences, Ingénierie, Bibliothèque
    buildingActivitySet.push({ buildingName: 'sciences', level: 0.9 })
    buildingActivitySet.push({ buildingName: 'ingénierie', level: 0.85 })
    buildingActivitySet.push({ buildingName: 'bibliothèque', level: 0.95 })
    peopleAdd.push({ count: 80, to: 'bibliothèque' })
  }
  if (lower.includes('midi')) {
    // Noon spike across all
    for (const t of targets) effects.push({ type: 'activitySpike', buildingName: t, delta: 0.3, durationSec: 8 })
  }
  if (lower.includes('événement') || lower.includes('evenement')) {
    if (lower.includes('médecine') || lower.includes('medecine')) {
      buildingActivitySet.push({ buildingName: 'médecine', level: 0.9 })
      peopleAdd.push({ count: 40, to: 'médecine' })
    }
  }
  if (lower.includes('réinitialise') || lower.includes('reinitialise')) {
    if (lower.includes('moyen')) {
      for (const t of targets) buildingActivitySet.push({ buildingName: t, level: 0.5 })
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

export async function llmDirective(prompt: string): Promise<Directive> {
  const deepseekKey = process.env.DEEPSEEK_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  // If no AI keys, fallback to rules
  if (!deepseekKey && !openaiKey) return fallbackRules(prompt)

  // Prefer DeepSeek when provided, using OpenAI-compatible API
  const useDeepSeek = !!deepseekKey
  const client = new OpenAI({
    apiKey: useDeepSeek ? deepseekKey! : openaiKey!,
    baseURL: useDeepSeek ? 'https://api.deepseek.com' : undefined
  })

  const model = useDeepSeek ? 'deepseek-chat' : 'gpt-4o-mini'

  try {
    const resp = await client.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    })
    const content = resp.choices[0]?.message?.content || '{}'
    const json = JSON.parse(content)
    const parsed = DirectiveSchema.safeParse(json)
    if (parsed.success) return parsed.data
    return fallbackRules(prompt)
  } catch (e) {
    return fallbackRules(prompt)
  }
}
