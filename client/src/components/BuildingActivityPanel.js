import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useStore } from '../state/store';
import { useMemo, useState, useEffect } from 'react';
import { FinanceService } from '../lib/financeService';
export function BuildingActivityPanel() {
    const selectedBuildingId = useStore(s => s.selectedBuildingId);
    const setSelectedBuilding = useStore(s => s.setSelectedBuilding);
    const buildings = useStore(s => s.buildings);
    const people = useStore(s => s.people);
    const environment = useStore(s => s.environment);
    const buildingEvents = useStore(s => s.buildingEvents);
    const [financeData, setFinanceData] = useState(null);
    const building = useMemo(() => buildings.find(b => b.id === selectedBuildingId), [buildings, selectedBuildingId]);
    // Fetch finance data if Economics building is selected
    useEffect(() => {
        if (selectedBuildingId === 'bus') {
            const load = async () => {
                const data = await FinanceService.getMarketData();
                setFinanceData(data);
            };
            load();
            const interval = setInterval(load, 60000); // Refresh every 60s for news/rss
            return () => clearInterval(interval);
        }
        else {
            setFinanceData(null);
        }
    }, [selectedBuildingId]);
    const buildingPeople = useMemo(() => people.filter(p => p.targetBuildingId === selectedBuildingId || p.workplace === selectedBuildingId), [people, selectedBuildingId]);
    // Categorize people
    const stats = useMemo(() => ({
        total: buildingPeople.length,
        students: buildingPeople.filter(p => p.role === 'student').length,
        employees: buildingPeople.filter(p => p.role === 'employee' || p.role === 'worker').length,
        professors: buildingPeople.filter(p => p.role === 'professor').length,
        visitors: buildingPeople.filter(p => p.role === 'visitor').length,
        doctors: buildingPeople.filter(p => p.customData?.job === 'doctor' || (building?.id.includes('hospital') && p.role === 'employee')).length,
        patients: buildingPeople.filter(p => p.customData?.status === 'patient' || (building?.id.includes('hospital') && p.role === 'visitor')).length,
    }), [buildingPeople, building]);
    // Generate context-aware events/news
    const events = useMemo(() => {
        if (!building || !selectedBuildingId)
            return [];
        const dynamic = buildingEvents[selectedBuildingId] || [];
        const staticEvts = getBuildingEvents(building, environment, stats);
        return [...dynamic, ...staticEvts].slice(0, 20);
    }, [buildingEvents, selectedBuildingId, building, environment, stats]);
    if (!selectedBuildingId || !building)
        return null;
    const isEco = building.id === 'bus';
    return (_jsxs("div", { className: `building-panel ${isEco ? 'eco-theme' : ''}`, children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { children: isEco ? 'WALL STREET HUB' : building.name }), _jsx("button", { className: "close-btn", onClick: () => setSelectedBuilding(null), children: "\u00D7" })] }), _jsx("div", { className: "panel-content", children: isEco && financeData ? (
                // === ECONOMICS / FINANCE VIEW ===
                _jsxs("div", { className: "finance-view", children: [_jsxs("div", { className: "ticker-box", children: [_jsx("div", { className: "label", children: "BITCOIN (BTC)" }), _jsxs("div", { className: "value-row", children: [_jsxs("span", { className: "big-val", children: ["$", financeData.bitcoin.price.toLocaleString()] }), _jsxs("span", { className: `change ${financeData.bitcoin.change24h >= 0 ? 'up' : 'down'}`, children: [financeData.bitcoin.change24h > 0 ? '▲' : '▼', " ", Math.abs(financeData.bitcoin.change24h).toFixed(2), "%"] })] })] }), _jsxs("div", { className: "sentiment-row", children: [_jsx("span", { className: "label", children: "MARKET SENTIMENT" }), _jsx("span", { className: `sentiment ${financeData.marketSentiment === 'Bullish' ? 'bull' : 'bear'}`, children: financeData.marketSentiment })] }), _jsxs("div", { className: "stocks-list", children: [_jsx("div", { className: "label", children: "TOP MOVERS" }), financeData.topStocks.map(s => (_jsxs("div", { className: "stock-row", children: [_jsx("span", { className: "symbol", children: s.symbol }), _jsxs("span", { className: "price", children: ["$", s.price.toFixed(2)] }), _jsxs("span", { className: `change ${s.change >= 0 ? 'up' : 'down'}`, children: [s.change > 0 ? '+' : '', s.change.toFixed(2), "%"] })] }, s.symbol)))] }), _jsxs("div", { className: "news-feed", children: [_jsx("div", { className: "label", children: "LATEST NEWS" }), _jsx("div", { className: "news-scroll", children: financeData.news.map((n, i) => (_jsxs("div", { className: "news-item", children: [_jsx("div", { className: "title", children: n.title }), _jsxs("div", { className: "meta", children: [n.source, " \u2022 ", n.time] }), n.url && n.url !== '#' && (_jsx("a", { href: n.url, target: "_blank", rel: "noopener noreferrer", className: "read-btn", children: "Lire l'article \u2197" }))] }, i))) })] }), _jsxs("div", { className: "traders-count", children: [_jsx("span", { className: "icon", children: "\uD83D\uDC65" }), " ", stats.total, " Traders Active"] })] })) : (
                // === STANDARD VIEW ===
                _jsxs(_Fragment, { children: [_jsxs("div", { className: "stat-row main-stat", children: [_jsx("span", { className: "label", children: "Occupancy" }), _jsxs("span", { className: "value", children: [stats.total, " ", _jsx("small", { children: "people" })] })] }), _jsxs("div", { className: "stats-grid", children: [stats.doctors > 0 && (_jsxs("div", { className: "stat-item", children: [_jsx("span", { className: "stat-val", children: stats.doctors }), _jsx("span", { className: "stat-lbl", children: "Doctors" })] })), stats.patients > 0 && (_jsxs("div", { className: "stat-item", children: [_jsx("span", { className: "stat-val", children: stats.patients }), _jsx("span", { className: "stat-lbl", children: "Patients" })] })), stats.students > 0 && (_jsxs("div", { className: "stat-item", children: [_jsx("span", { className: "stat-val", children: stats.students }), _jsx("span", { className: "stat-lbl", children: "Students" })] })), stats.employees > 0 && !stats.doctors && (_jsxs("div", { className: "stat-item", children: [_jsx("span", { className: "stat-val", children: stats.employees }), _jsx("span", { className: "stat-lbl", children: "Staff" })] }))] }), _jsxs("div", { className: "activity-feed", children: [_jsx("h4", { children: "Live Activity Feed" }), _jsx("ul", { children: events.map((e, i) => (_jsxs("li", { className: `event-item ${e.type}`, children: [_jsx("span", { className: "time", children: e.time }), _jsx("span", { className: "text", children: e.text })] }, i))) })] }), _jsxs("div", { className: "people-list", children: [_jsx("h4", { children: "People Inside" }), _jsxs("div", { className: "people-scroll", children: [buildingPeople.slice(0, 10).map(p => (_jsxs("div", { className: "person-row", children: [_jsx("span", { className: "avatar", children: p.gender === 'female' ? '👩' : '👨' }), _jsx("span", { className: "name", children: p.name }), _jsx("span", { className: "role", children: p.role || 'Visitor' })] }, p.id))), buildingPeople.length > 10 && (_jsxs("div", { className: "more-people", children: ["...and ", buildingPeople.length - 10, " more"] }))] })] })] })) }), _jsx("style", { children: `
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
      ` })] }));
}
function getBuildingEvents(building, env, stats) {
    const events = [];
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    // Static info only - no fake random events
    if (building.id.includes('law') || building.id === 'law') {
        events.push({ time, text: "Faculty of Law", type: 'info' });
    }
    else if (building.zone === 'campus') {
        events.push({ time, text: "Campus Building", type: 'info' });
    }
    return events;
}
