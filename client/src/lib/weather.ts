export type WeatherCondition = 'clear' | 'rain' | 'snow' | 'cloudy'

export interface WeatherData {
  temperature: number
  condition: WeatherCondition
  isDay: boolean
}

const WEATHER_CODES = new Set([0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99])

function mapWmoCode(code: number): WeatherCondition {
  if (code <= 1) return 'clear'
  if (code <= 48) return 'cloudy'
  if (code >= 71 && code <= 77 || code === 85 || code === 86) return 'snow'
  return 'rain'
}

export async function fetchWeather(lat = 48.42, lon = -71.06): Promise<WeatherData> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) throw new Error('Coordonnées météo invalides')
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,is_day,weather_code&timezone=America%2FToronto`
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!response.ok) throw new Error('Le service météo est indisponible')
  const data = await response.json()
  const current = data?.current
  if (!current || typeof current.temperature_2m !== 'number' || !Number.isFinite(current.temperature_2m) || current.temperature_2m < -100 || current.temperature_2m > 65 || !WEATHER_CODES.has(current.weather_code) || ![0, 1].includes(current.is_day)) {
    throw new Error('La réponse du service météo est invalide')
  }
  return { temperature: current.temperature_2m, isDay: current.is_day === 1, condition: mapWmoCode(current.weather_code) }
}
