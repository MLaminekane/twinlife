import OpenAI from 'openai'

export interface LLMClientConfig {
  deepseekKey?: string
  openaiKey?: string
}

export function createLLMClient(config: LLMClientConfig): { client: OpenAI; model: string } | null {
  const { deepseekKey, openaiKey } = config
  
  if (!deepseekKey && !openaiKey) {
    return null
  }

  const useDeepSeek = !!deepseekKey
  const client = new OpenAI({
    apiKey: useDeepSeek ? deepseekKey! : openaiKey!,
    baseURL: useDeepSeek ? 'https://api.deepseek.com' : undefined
  })

  const model = useDeepSeek ? 'deepseek-chat' : 'gpt-4o-mini'

  return { client, model }
}

export function getLLMConfig(): LLMClientConfig {
  return {
    deepseekKey: process.env.DEEPSEEK_API_KEY,
    openaiKey: process.env.OPENAI_API_KEY
  }
}
