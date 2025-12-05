import { Line, Text } from '@react-three/drei'
import { useMemo } from 'react'
import { useStore } from '../state/store'

export function DepartmentsOverlay() {
  const buildings = useStore(s => s.buildings)
  const depts = useStore(s => s.departments)
  const interactions = useStore(s => s.deptInteractions)
  const flashes = useStore(s => s.deptFlashes)

  const posByBuilding = useMemo(() => {
    const m = new Map<string, [number, number, number]>()
    for (const b of buildings) m.set(b.id, b.position)
    return m
  }, [buildings])

  const centerOf = (bid: string): [number, number, number] => {
    const p = posByBuilding.get(bid) || [0,0,0]
    return [p[0], 2.6, p[2]]
  }

  const idToBuilding = (deptId: string): string | undefined => {
    const d = depts.find(x => x.id === deptId as any)
    return d?.buildingId
  }

  return (
    <group>
      {/* Collaboration / Rivalry lines */}
      {interactions.map((e, idx) => {
        const aB = idToBuilding(e.from)
        const bB = idToBuilding(e.to)
        if (!aB || !bB) return null
        const a = centerOf(aB)
        const b = centerOf(bB)
        const mid: [number, number, number] = [(a[0]+b[0])/2, Math.max(a[1], b[1]) + 1.0, (a[2]+b[2])/2]
        const color = e.type === 'collab' ? '#22d3ee' : '#ef4444'
        const alpha = Math.max(0, Math.min(1, e.remaining / 3.0))
        return (
          <Line key={idx} points={[a, mid, b]} color={color} lineWidth={2} transparent opacity={alpha} dashed dashSize={0.6} gapSize={0.3} />
        )
      })}

      {/* Publish flashes */}
      {flashes.map((f, idx) => {
        const p = centerOf(f.buildingId)
        const alpha = Math.max(0, Math.min(1, f.remaining / 2.0))
        return (
          <Text 
            key={idx} 
            position={[p[0], p[1]+0.8, p[2]]} 
            fontSize={0.7} 
            color="white" 
            fillOpacity={alpha}
            anchorX="center" 
            anchorY="middle"
          >
            📄
          </Text>
        )
      })}
    </group>
  )
}
