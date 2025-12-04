import { useEffect } from 'react'
import { useStore } from '../state/store'

export function WeatherWidget() {
    const env = useStore(s => s.environment)
    const fetchWeather = useStore(s => s.fetchRealWeather)

    useEffect(() => {
        // Initial fetch if realTime is not set or on mount
        fetchWeather()
        // Refresh every 10 minutes
        const interval = setInterval(fetchWeather, 600000)
        return () => clearInterval(interval)
    }, [fetchWeather])

    const icon = (() => {
        if (env.condition === 'rain') return '🌧️'
        if (env.condition === 'snow') return '❄️'
        if (env.condition === 'cloudy') return '☁️'
        if (env.dayPeriod === 'nuit') return '🌙'
        return '☀️'
    })()

    return (
        <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(11,18,32,0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #1f2937',
            borderRadius: 24,
            padding: '6px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#e2e8f0',
            fontSize: 14,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontWeight: 600 }}>
                    {env.temperature !== undefined ? `${Math.round(env.temperature)}°C` : '--'}
                </span>
                <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'capitalize' }}>
                    {env.condition || 'Chargement...'}
                </span>
            </div>
            <div style={{ width: 1, height: 20, background: '#334155', margin: '0 4px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, alignItems: 'flex-end' }}>
                <span style={{ fontSize: 11, fontWeight: 500 }}>Saguenay</span>
                <span style={{ fontSize: 10, color: '#60a5fa' }}>Temps Réel</span>
            </div>
        </div>
    )
}
