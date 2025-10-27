import { useStore } from '../state/store'

export function HUD() {
  const metrics = useStore(s => s.metrics)
  return (
    <div className="hud">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span className="badge">Campus Live</span>
        <div>👥 Total: <b>{metrics.totalPeople}</b></div>
        <div>🏢 Actifs: <b>{metrics.activeBuildings}</b></div>
        <div>📊 Occupation: <b>{metrics.totalOccupancy}</b></div>
      </div>
    </div>
  )
}
