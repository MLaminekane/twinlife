import { useState } from 'react'
import { useStore } from '../state/store'
import { NewsFeed } from './NewsFeed'

export function HUD() {
  const metrics = useStore(s => s.metrics)
  const [expanded, setExpanded] = useState(true)
  return (
    <div className="hud">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          className="badge"
          onClick={() => setExpanded(v => !v)}
          title={expanded ? 'Réduire' : 'Afficher'}
          style={{ cursor: 'pointer' }}
        >
          {expanded ? '▾ ' : '▸ '}Campus Live
        </button>
        {expanded && (
          <>
            <div>👥 Total: <b>{metrics.totalPeople}</b></div>
            <div>🏢 Actifs: <b>{metrics.activeBuildings}</b></div>
            <div>📊 Occupation: <b>{metrics.totalOccupancy}</b></div>
            {metrics.totalPublications !== undefined && (
              <div>📝 Pubs: <b>{metrics.totalPublications}</b></div>
            )}
            {metrics.activeCollaborations !== undefined && (
              <div>🤝 Collabs: <b>{metrics.activeCollaborations}</b></div>
            )}
            {metrics.activeRivalries !== undefined && (
              <div>⚔️ Rivalités: <b>{metrics.activeRivalries}</b></div>
            )}
          </>
        )}
      </div>
      {expanded && <NewsFeed />}
    </div>
  )
}
