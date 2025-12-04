export type WeatherCondition = 'clear' | 'rain' | 'snow' | 'cloudy'

export interface WeatherData {
    temperature: number
    condition: WeatherCondition
    isDay: boolean
}

// Mapping WMO Weather interpretation codes (WW)
// https://open-meteo.com/en/docs
function mapWmoCode(code: number): WeatherCondition {
    if (code === 0 || code === 1) return 'clear'
    if (code === 2 || code === 3) return 'cloudy'
    if (code >= 45 && code <= 48) return 'cloudy' // Fog
    if (code >= 51 && code <= 67) return 'rain'   // Drizzle / Rain
    if (code >= 71 && code <= 77) return 'snow'   // Snow
    if (code >= 80 && code <= 82) return 'rain'   // Showers
    if (code >= 85 && code <= 86) return 'snow'   // Snow showers
    if (code >= 95) return 'rain'                 // Thunderstorm
    return 'clear'
}

export async function fetchWeather(lat = 48.42, lon = -71.06): Promise<WeatherData> {
    try {
        // Fetch current weather for Saguenay (default coords)
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,is_day,weather_code&timezone=auto`
        const res = await fetch(url)
        if (!res.ok) throw new Error('Weather API error')

        const data = await res.json()
        const current = data.current

        return {
            temperature: current.temperature_2m,
            isDay: current.is_day === 1,
            condition: mapWmoCode(current.weather_code)
        }
    } catch (err) {
        console.error('Failed to fetch weather', err)
        // Fallback
        return { temperature: 15, condition: 'clear', isDay: true }
    }
}
