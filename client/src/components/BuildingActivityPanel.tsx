import { useStore } from '../state/store'
import { Building, Person } from '../state/types'
import { useMemo, useState, useEffect } from 'react'
import { FinanceService, FinanceData } from '../lib/financeService'

export function BuildingActivityPanel() {
  const selectedBuildingId = useStore(s => s.selectedBuildingId)
  const setSelectedBuilding = useStore(s => s.setSelectedBuilding)
  const buildings = useStore(s => s.buildings)
  const people = useStore(s => s.people)
  const environment = useStore(s => s.environment)
  const buildingEvents = useStore(s => s.buildingEvents)

  const [financeData, setFinanceData] = useState<FinanceData | null>(null)

  const building = useMemo(() => 
    buildings.find(b => b.id === selectedBuildingId), 
    [buildings, selectedBuildingId]
  )

  // Fetch finance data if Economics building is selected
  useEffect(() => {
    if (selectedBuildingId === 'bus') {
      const load = async () => {
        const data = await FinanceService.getMarketData()
        setFinanceData(data)
      }
      load()
      const interval = setInterval(load, 60000) // Refresh every 60s for news/rss
      return () => clearInterval(interval)
    } else {
      setFinanceData(null)
    }
  }, [selectedBuildingId])

  const buildingPeople = useMemo(() => 
    people.filter(p => p.targetBuildingId === selectedBuildingId || p.workplace === selectedBuildingId),
    [people, selectedBuildingId]
  )

  // Categorize people
  const stats = useMemo(() => ({
    total: buildingPeople.length,
    students: buildingPeople.filter(p => p.role === 'student').length,
    employees: buildingPeople.filter(p => p.role === 'employee' || p.role === 'worker').length,
    professors: buildingPeople.filter(p => p.role === 'professor').length,
    visitors: buildingPeople.filter(p => p.role === 'visitor').length,
    doctors: buildingPeople.filter(p => p.customData?.job === 'doctor' || (building?.id.includes('hospital') && p.role === 'employee')).length,
    patients: buildingPeople.filter(p => p.customData?.status === 'patient' || (building?.id.includes('hospital') && p.role === 'visitor')).length,
  }), [buildingPeople, building])

  // Generate context-aware events/news
  const events = useMemo(() => {
    if (!building || !selectedBuildingId) return []
    const dynamic = buildingEvents[selectedBuildingId] || []
    const staticEvts = getBuildingEvents(building, environment, stats)
    return [...dynamic, ...staticEvts].slice(0, 20)
  }, [buildingEvents, selectedBuildingId, building, environment, stats])

  if (!selectedBuildingId || !building) return null

  const isEco = building.id === 'bus'

  return (
    <div className={`building-panel ${isEco ? 'eco-theme' : ''}`}>
      <div className="panel-header">
        <h3>{isEco ? 'WALL STREET HUB' : building.name}</h3>
        <button className="close-btn" onClick={() => setSelectedBuilding(null)}>×</button>
      </div>
      
      <div className="panel-content">
        {isEco && financeData ? (
          // === ECONOMICS / FINANCE VIEW ===
          <div className="finance-view">
            {/* Bitcoin Ticker */}
            <div className="ticker-box">
              <div className="label">BITCOIN (BTC)</div>
              <div className="value-row">
                <span className="big-val">${financeData.bitcoin.price.toLocaleString()}</span>
                <span className={`change ${financeData.bitcoin.change24h >= 0 ? 'up' : 'down'}`}>
                  {financeData.bitcoin.change24h > 0 ? '▲' : '▼'} {Math.abs(financeData.bitcoin.change24h).toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Market Sentiment */}
            <div className="sentiment-row">
              <span className="label">MARKET SENTIMENT</span>
              <span className={`sentiment ${financeData.marketSentiment === 'Bullish' ? 'bull' : 'bear'}`}>
                {financeData.marketSentiment}
              </span>
            </div>

            {/* Stocks */}
            <div className="stocks-list">
              <div className="label">TOP MOVERS</div>
              {financeData.topStocks.map(s => (
                <div key={s.symbol} className="stock-row">
                  <span className="symbol">{s.symbol}</span>
                  <span className="price">${s.price.toFixed(2)}</span>
                  <span className={`change ${s.change >= 0 ? 'up' : 'down'}`}>
                    {s.change > 0 ? '+' : ''}{s.change.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>

            {/* News Feed */}
            <div className="news-feed">
              <div className="label">LATEST NEWS</div>
              <div className="news-scroll">
                {financeData.news.map((n, i) => (
                  <div key={i} className="news-item">
                    <div className="title">{n.title}</div>
                    <div className="meta">{n.source} • {n.time}</div>
                    {n.url && n.url !== '#' && (
                      <a href={n.url} target="_blank" rel="noopener noreferrer" className="read-btn">
                        Lire l'article ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="traders-count">
              <span className="icon">👥</span> {stats.total} Traders Active
            </div>
          </div>
        ) : (
          // === STANDARD VIEW ===
          <>
            <div className="stat-row main-stat">
              <span className="label">Occupancy</span>
              <span className="value">{stats.total} <small>people</small></span>
            </div>

            <div className="stats-grid">
              {stats.doctors > 0 && (
                <div className="stat-item">
                  <span className="stat-val">{stats.doctors}</span>
                  <span className="stat-lbl">Doctors</span>
                </div>
              )}
              {stats.patients > 0 && (
                <div className="stat-item">
                  <span className="stat-val">{stats.patients}</span>
                  <span className="stat-lbl">Patients</span>
                </div>
              )}
              {stats.students > 0 && (
                <div className="stat-item">
                  <span className="stat-val">{stats.students}</span>
                  <span className="stat-lbl">Students</span>
                </div>
              )}
              {stats.employees > 0 && !stats.doctors && (
                <div className="stat-item">
                  <span className="stat-val">{stats.employees}</span>
                  <span className="stat-lbl">Staff</span>
                </div>
              )}
            </div> 

            <div className="activity-feed">
              <h4>Live Activity Feed</h4>
              <ul>
                {events.map((e, i) => (
                  <li key={i} className={`event-item ${e.type}`}>
                    <span className="time">{e.time}</span>
                    <span className="text">{e.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="people-list">
              <h4>People Inside</h4>
              <div className="people-scroll">
                {buildingPeople.slice(0, 10).map(p => (
                  <div key={p.id} className="person-row">
                    <span className="avatar">{p.gender === 'female' ? '👩' : '👨'}</span>
                    <span className="name">{p.name}</span>
                    <span className="role">{p.role || 'Visitor'}</span>
                  </div>
                ))}
                {buildingPeople.length > 10 && (
                  <div className="more-people">...and {buildingPeople.length - 10} more</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .building-panel {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 320px;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: white;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          z-index: 1000;
          overflow: hidden;
          animation: slideIn 0.3s ease-out;
        }
        .building-panel.eco-theme {
          border: 1px solid #10b981;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
        }
        .eco-theme .panel-header {
          background: rgba(6, 78, 59, 0.4);
          border-bottom: 1px solid #10b981;
        }
        .eco-theme h3 { color: #34d399; letter-spacing: 1px; }

        /* Finance Styles */
        .finance-view { display: flex; flex-direction: column; gap: 16px; }
        .ticker-box { background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); }
        .ticker-box .label { font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px; }
        .value-row { display: flex; align-items: baseline; gap: 10px; }
        .big-val { font-size: 1.5rem; font-weight: 700; color: white; font-family: monospace; }
        .change { font-size: 0.9rem; font-weight: 600; }
        .change.up { color: #4ade80; }
        .change.down { color: #f87171; }

        .sentiment-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .sentiment { font-weight: 700; text-transform: uppercase; }
        .sentiment.bull { color: #4ade80; }
        .sentiment.bear { color: #f87171; }

        .stocks-list { display: flex; flex-direction: column; gap: 6px; }
        .stock-row { display: flex; justify-content: space-between; font-family: monospace; font-size: 0.9rem; }
        .stock-row .symbol { font-weight: 700; color: #60a5fa; }

        .news-feed .label { font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase; }
        .news-scroll { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
        .news-item { border-left: 2px solid #3b82f6; padding-left: 8px; }
        .news-item .title { font-size: 0.85rem; font-weight: 500; line-height: 1.3; color: #e2e8f0; }
        .news-item .meta { font-size: 0.7rem; color: #64748b; margin-top: 2px; }
        .read-btn {
          display: inline-block; margin-top: 4px; font-size: 0.7rem; color: #3b82f6; text-decoration: none;
          border: 1px solid #3b82f6; padding: 2px 6px; border-radius: 4px; transition: all 0.2s;
        }
        .read-btn:hover { background: #3b82f6; color: white; }

        .traders-count { text-align: center; font-size: 0.8rem; color: #94a3b8; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); }

        @keyframes slideIn {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .panel-header {
          padding: 16px;
          background: rgba(255,255,255,0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .panel-header h3 { margin: 0; font-size: 1.1rem; font-weight: 600; }
        .close-btn {
          background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer;
          padding: 0; line-height: 1;
        }
        .close-btn:hover { color: white; }
        .panel-content { padding: 16px; }
        .stat-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .main-stat .value { font-size: 1.5rem; font-weight: 700; color: #4ade80; }
        .main-stat small { font-size: 0.9rem; color: #94a3b8; font-weight: 400; margin-left: 4px; }
        
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 20px;
        }
        .stat-item {
          background: rgba(255,255,255,0.03);
          padding: 10px;
          border-radius: 8px;
          text-align: center;
        }
        .stat-val { display: block; font-size: 1.2rem; font-weight: 700; color: #e2e8f0; }
        .stat-lbl { display: block; font-size: 0.8rem; color: #94a3b8; margin-top: 2px; }

        .activity-feed h4, .people-list h4 {
          font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 10px 0;
        }
        .activity-feed ul { list-style: none; padding: 0; margin: 0 0 20px 0; }
        .event-item {
          font-size: 0.85rem; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex; gap: 10px;
        }
        .event-item .time { color: #64748b; font-family: monospace; }
        .event-item.urgent .text { color: #f87171; }
        .event-item.info .text { color: #60a5fa; }
        .event-item.sale .text { color: #fbbf24; }

        .people-scroll { max-height: 150px; overflow-y: auto; }
        .person-row {
          display: flex; align-items: center; gap: 10px; padding: 6px 0;
          font-size: 0.9rem; border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .person-row .name { flex: 1; color: #e2e8f0; }
        .person-row .role { color: #64748b; font-size: 0.8rem; }
      `}</style>
    </div>
  )
}

function getBuildingEvents(building: Building, env: any, stats: any) {
  const events = []
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  
  // Static info only - no fake random events
  if (building.id.includes('law') || building.id === 'law') {
    events.push({ time, text: "Faculty of Law", type: 'info' })
  } else if (building.zone === 'campus') {
    events.push({ time, text: "Campus Building", type: 'info' })
  }
  
  return events
}
