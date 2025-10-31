import { useMemo } from 'react'
import { useStore } from '../state/store'

export function NewsFeed() {
  const news = useStore(s => s.news)
  const items = useMemo(() => news.slice(-8).reverse(), [news])
  if (!items.length) return null
  return (
    <div style={{ marginTop: 8, background: 'rgba(11,18,32,0.75)', border: '1px solid #1f2937', borderRadius: 8, padding: '6px 8px', maxHeight: 160, overflowY: 'auto' }}>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Actualités</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map(it => (
          <li key={it.id} style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{it.text}</li>
        ))}
      </ul>
    </div>
  )
}
