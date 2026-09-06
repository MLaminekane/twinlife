import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { fetchWeather } from '../lib/weather'
import type { Store } from '../state/types'

let useStore: typeof import('../state/store')['useStore']
let initial: Store
beforeAll(async () => {
  vi.stubGlobal('localStorage', { getItem: () => null })
  ;({ useStore } = await import('../state/store'))
  initial = useStore.getState()
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); useStore.setState(initial, true) })

it('validates real response fields, maps snow and supplies a timeout signal', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ current: { temperature_2m: -12, weather_code: 75, is_day: 0 } })))
  vi.stubGlobal('fetch', fetchMock)
  expect(await fetchWeather()).toEqual({ temperature: -12, condition: 'snow', isDay: false })
  expect(fetchMock.mock.calls[0][0]).toContain('timezone=America%2FToronto')
  expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
})

it('rejects unavailable or invalid observations instead of inventing weather', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('{}', { status: 503 })).mockResolvedValueOnce(new Response(JSON.stringify({ current: { temperature_2m: '15', weather_code: 0, is_day: 1 } }))))
  await expect(fetchWeather()).rejects.toThrow('indisponible')
  await expect(fetchWeather()).rejects.toThrow('invalide')
})

it('imports Saguenay time in September and exits the current simulated scenario', async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-06T02:30:00Z'))
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ current: { temperature_2m: 17, weather_code: 3, is_day: 0 } }))))
  useStore.setState(state => ({ environment: { ...state.environment, activeScenario: 'festival', scenarioRemaining: 100, populationFactor: 1.65 } }))
  await useStore.getState().fetchRealWeather()
  expect(useStore.getState().environment).toMatchObject({ gameTime: 22.5, dayPeriod: 'nuit', season: 'automne', weekend: true, condition: 'cloudy', temperature: 17, activeScenario: undefined, scenarioRemaining: 0, populationFactor: 1 })
})

it('leaves the entire current state unchanged if the weather request fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network unavailable')))
  const before = useStore.getState()
  await expect(before.fetchRealWeather()).rejects.toThrow('Network unavailable')
  expect(useStore.getState()).toBe(before)
})
