import { useStore } from '../state/store'
export const ZONE_COLORS = {
  campus: '#b9f579',
  downtown: '#83c9db',
  residential: '#e1c9a1',
  commercial: '#b9a4d9',
}
export const ZONE_NAMES = {
  campus: 'Campus',
  downtown: 'Centre-ville',
  residential: 'Résidentiel',
  commercial: 'Commerces',
}
export function MiniMap({ large = false }: { large?: boolean }) {
  const buildings = useStore((s) => s.buildings)
  const selected = useStore((s) => s.selectedBuildingId)
  return (
    <svg
      className={`minimap ${large ? 'minimap-large' : ''}`}
      viewBox="-43 -43 86 86"
      role="img"
      aria-label="Plan interactif des quatre quartiers"
    >
      <rect x="-43" y="-43" width="86" height="86" rx="4" fill="#172122" />
      <path
        d="M-41 -2 H41 M-2 -41 V41 M-41 -38 H38 V38 H-38 V-38"
        fill="none"
        stroke="#344244"
        strokeWidth="1.3"
      />
      {buildings.map((b) => (
        <g
          key={b.id}
          role="button"
          tabIndex={0}
          aria-label={`Explorer ${b.name}`}
          onClick={() => {
            useStore.getState().setSelectedPerson(null)
            useStore.getState().setSelectedBuilding(b.id)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              useStore.getState().setSelectedBuilding(b.id)
            }
          }}
        >
          <title>
            {b.name} · {b.occupancy} personnes
          </title>
          <rect
            x={b.position[0] - b.size[0] / 2}
            y={-b.position[2] - b.size[2] / 2}
            width={b.size[0]}
            height={b.size[2]}
            rx=".6"
            fill={ZONE_COLORS[b.zone]}
            opacity={selected === b.id ? 1 : 0.55}
            stroke={selected === b.id ? '#fff' : 'none'}
            strokeWidth=".7"
          />
        </g>
      ))}
      <text x="35" y="-33" fill="#dce5de" fontSize="4" textAnchor="middle">
        N
      </text>
      <path d="M35 -31 l-1.3 3 h2.6 Z" fill="#b9f579" />
    </svg>
  )
}
