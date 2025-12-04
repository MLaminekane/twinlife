import { DirectiveSchema, type Directive } from './schemas.js'
import { createLLMClient, getLLMConfig } from './llmClient.js'
import { DIRECTIVE_SYSTEM_PROMPT } from './config.js'
import { fallbackDirectiveRules } from './fallbackDirectives.js'

export async function llmDirective(prompt: string): Promise<Directive> {
  const config = getLLMConfig()
  const llmClient = createLLMClient(config)

  // If no AI keys, fallback to rules
  if (!llmClient) return fallbackDirectiveRules(prompt)

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
    const json = JSON.parse(content)
    const parsed = DirectiveSchema.safeParse(json)
    if (parsed.success) return parsed.data
    return fallbackDirectiveRules(prompt)
  } catch (e) {
    return fallbackDirectiveRules(prompt)
  }
}
