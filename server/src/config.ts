export const DIRECTIVE_SYSTEM_PROMPT = `Tu es un planificateur de campus universitaire. Tu renvoies UNIQUEMENT du JSON respectant ce schema:
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

export const AGENT_ACTION_SYSTEM_PROMPT = `Tu joues des agents universitaires (professeur, étudiant, recteur). Pour chaque agent reçu, renvoie UNIQUEMENT une liste JSON d'actions respectant ce schema:
{
  "actions": [
    { "id": string, "publish"?: boolean, "seekCollabWith"?: string|null, "challenge"?: string|null, "moveTo"?: string|null, "message"?: string, "setInvestments"?: { "ai": number, "humanities": number } }
  ]
}
Règles:
- "seekCollabWith" et "challenge" sont des id de départements (ex: "eng", "bio", "eco").
- "moveTo" est un id de bâtiment (si fourni par l'entrée), sinon null.
- Prends en compte les investissements (ai vs humanities) et les biais/goals d'agent.
- Le recteur peut renvoyer "setInvestments" pour faire évoluer la politique budgétaire (les deux poids doivent somme ~1).
- Ne mets aucun texte hors JSON.`

export const BUILDING_TARGETS = [
  'sciences', 'ingénierie', 'médecine', 'économie', 
  'arts', 'droit', 'bibliothèque', 'administration'
]
