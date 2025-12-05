import { DirectiveSchema, type Directive } from './schemas.js'
import { createLLMClient, getLLMConfig } from './llmClient.js'
import { DIRECTIVE_SYSTEM_PROMPT } from './config.js'
import { fallbackDirectiveRules } from './fallbackDirectives.js'

export async function llmDirective(prompt: string): Promise<Directive> {
  console.log('[llmDirective] Prompt reçu:', prompt)
  const config = getLLMConfig()
  const llmClient = createLLMClient(config)

  // If no AI keys, fallback to rules
  if (!llmClient) {
    console.log('[llmDirective] Pas de clé API, utilisation du fallback')
    return fallbackDirectiveRules(prompt)
  }

  const { client, model } = llmClient

  try {
    const resp = await client.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: DIRECTIVE_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    })
    const content = resp.choices[0]?.message?.content || '{}'
    console.log('[llmDirective] Réponse LLM:', content)
    const json = JSON.parse(content)
    const parsed = DirectiveSchema.safeParse(json)
    if (parsed.success) {
      console.log('[llmDirective] Directive validée:', parsed.data)
      return parsed.data
    }
    console.log('[llmDirective] Validation échouée, utilisation du fallback:', parsed.error)
    return fallbackDirectiveRules(prompt)
  } catch (e) {
    console.error('[llmDirective] Erreur:', e)
    return fallbackDirectiveRules(prompt)
  }
}
