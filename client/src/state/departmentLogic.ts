import type { Building, Department, NewsItem, Scenario } from './types'

export function processDepartmentDynamics(
  dt: number,
  departments: Department[],
  buildings: Building[],
  scenario: Scenario,
  deptFlashes: Array<{ buildingId: string; remaining: number }>,
  deptInteractions: Array<{ from: string; to: string; type: 'collab' | 'rivalry'; remaining: number }>,
  news: NewsItem[]
) {
  const basePub = 0.25, baseCol = 0.15, baseRiv = 0.10
  const aiW = scenario.investmentAI
  const humW = scenario.investmentHumanities
  
  for (const d of departments) {
    const leanAI = d.id === 'eng' || d.id === 'bio'
    const deptFactor = leanAI ? (0.6 * aiW + 0.4 * (1 - humW)) : (0.6 * humW + 0.4 * (1 - aiW))
    const pubRate = basePub * (0.6 + 0.8 * deptFactor)
    const colRate = baseCol * (0.6 + 0.7 * (aiW * 0.6 + humW * 0.4))
    const rivRate = baseRiv * (0.7 + 0.6 * (aiW * 0.5 + (1 - humW) * 0.3))
    
    // Publish
    if (Math.random() < pubRate * dt) {
      d.publications += 1
      const b = buildings.find(x => x.id === d.buildingId)
      if (b) b.activity = Math.min(1, b.activity + 0.05)
      deptFlashes.push({ buildingId: d.buildingId, remaining: 2.0 })
      const id = news.length ? news[news.length - 1].id + 1 : 1
      news.push({ id, ts: Date.now(), kind: 'pub', text: `📄 ${d.name} publie un article (total ${d.publications})` })
      if (news.length > 50) news.shift()
    }
    
    // Collaboration
    if (Math.random() < colRate * dt) {
      const others = departments.filter(x => x.id !== d.id)
      const peer = others[Math.floor(Math.random() * others.length)]
      d.collaborations[peer.id] = (d.collaborations[peer.id] ?? 0) + 1
      peer.collaborations[d.id] = (peer.collaborations[d.id] ?? 0) + 1
      deptInteractions.push({ from: d.id, to: peer.id, type: 'collab', remaining: 3.0 })
      const id = news.length ? news[news.length - 1].id + 1 : 1
      news.push({ id, ts: Date.now(), kind: 'collab', text: `🤝 ${d.name} × ${peer.name} lancent une collaboration` })
      if (news.length > 50) news.shift()
    }
    
    // Rivalry
    if (Math.random() < rivRate * dt) {
      const others = departments.filter(x => x.id !== d.id)
      const peer = others[Math.floor(Math.random() * others.length)]
      d.rivalries[peer.id] = (d.rivalries[peer.id] ?? 0) + 1
      const bSelf = buildings.find(x => x.id === d.buildingId)
      const bPeer = buildings.find(x => x.id === peer.buildingId)
      if (bSelf) bSelf.activity = Math.min(1, bSelf.activity + 0.02)
      if (bPeer) bPeer.activity = Math.max(0, bPeer.activity - 0.03)
      deptInteractions.push({ from: d.id, to: peer.id, type: 'rivalry', remaining: 3.0 })
      const id = news.length ? news[news.length - 1].id + 1 : 1
      news.push({ id, ts: Date.now(), kind: 'rivalry', text: `⚔️ ${d.name} défie ${peer.name}` })
      if (news.length > 50) news.shift()
    }
  }
}
