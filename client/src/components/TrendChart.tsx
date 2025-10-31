import { useMemo } from 'react'
import { useStore } from '../state/store'

function pathFrom(values: number[], w: number, h: number) {
  if (!values.length) return ''
  const max = Math.max(...values)
  const min = Math.min(...values)
  const scale = (v: number) => {
    const nv = (v - min) / (max - min || 1)
    return h - nv * (h - 2) - 1
  }
  const step = values.length > 1 ? w / (values.length - 1) : w
  let d = `M 0 ${scale(values[0])}`
  for (let i = 1; i < values.length; i++) d += ` L ${i*step} ${scale(values[i])}`
  return d
}

export function TrendChart() {
  const ts = useStore(s => s.timeseries) || []
  const w = 260, h = 80
  const ai = ts.map(t => t.ai)
  const hum = ts.map(t => t.hum)
  const pubs = ts.map(t => t.pubs)
  const collabs = ts.map(t => t.collabs)
  const rival = ts.map(t => t.rivalries)

  const paths = useMemo(() => ({
    ai: pathFrom(ai, w, h),
    hum: pathFrom(hum, w, h),
    pubs: pathFrom(pubs, w, h),
    collabs: pathFrom(collabs, w, h),
    rival: pathFrom(rival, w, h)
  }), [ts])

  return (
    <div style={{ marginTop: 8, background: 'rgba(11,18,32,0.75)', border: '1px solid #1f2937', borderRadius: 8, padding: '6px 8px' }}>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Évolution IA vs Humanités et Activité</div>
      <svg width={w} height={h} style={{ display: 'block' }}>
        <path d={paths.ai} stroke="#22d3ee" strokeWidth={1.5} fill="none" />
        <path d={paths.hum} stroke="#f472b6" strokeWidth={1.2} fill="none" />
        <path d={paths.pubs} stroke="#f59e0b" strokeWidth={1} fill="none" opacity={0.9} />
        <path d={paths.collabs} stroke="#10b981" strokeWidth={1} fill="none" opacity={0.9} />
        <path d={paths.rival} stroke="#ef4444" strokeWidth={1} fill="none" opacity={0.9} />
      </svg>
      <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 12, color: '#9ca3af' }}>
        <span style={{ color: '#22d3ee' }}>IA</span>
        <span style={{ color: '#f472b6' }}>Humanités</span>
        <span style={{ color: '#f59e0b' }}>Pubs</span>
        <span style={{ color: '#10b981' }}>Collabs</span>
        <span style={{ color: '#ef4444' }}>Rivalités</span>
      </div>
    </div>
  )
}
