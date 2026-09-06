import { afterEach, expect, it, vi } from 'vitest'
import { sendLLM } from '../lib/api'

afterEach(() => vi.unstubAllGlobals())

it('preserves complete command results across client validation', async () => {
  const directive = {
    buildingAdd: [{ name: 'Horizon', type: 'food', capacity: 80 }],
    buildingEvents: [{ buildingName: 'Bibliothèque', events: [{ text: 'Atelier ouvert', type: 'info' }] }],
    peopleAdd: [{ count: 1, name: 'Léa', customData: { job: 'doctor' } }],
    environment: { gameTime: 18.5, condition: 'snow', temperature: -12 },
  }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(directive))))
  expect(await sendLLM('Une commande')).toEqual(directive)
})

it('rejects invalid responses and propagates cancellation to the request', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ environment: { gameTime: 29 } })))
  vi.stubGlobal('fetch', fetchMock)
  const controller = new AbortController()
  await expect(sendLLM('Une commande', controller.signal)).rejects.toThrow('Invalid directive')
  controller.abort()
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true)
})
