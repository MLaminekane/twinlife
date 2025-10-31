import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useStore } from '../state/store';
import { NewsFeed } from './NewsFeed';
import { TrendChart } from './TrendChart';
export function HUD() {
    const metrics = useStore(s => s.metrics);
    const [expanded, setExpanded] = useState(true);
    return (_jsxs("div", { className: "hud", children: [_jsxs("div", { style: { display: 'flex', gap: 12, alignItems: 'center' }, children: [_jsxs("button", { className: "badge", onClick: () => setExpanded(v => !v), title: expanded ? 'Réduire' : 'Afficher', style: { cursor: 'pointer' }, children: [expanded ? '▾ ' : '▸ ', "Campus Live"] }), expanded && (_jsxs(_Fragment, { children: [_jsxs("div", { children: ["\uD83D\uDC65 Total: ", _jsx("b", { children: metrics.totalPeople })] }), _jsxs("div", { children: ["\uD83C\uDFE2 Actifs: ", _jsx("b", { children: metrics.activeBuildings })] }), _jsxs("div", { children: ["\uD83D\uDCCA Occupation: ", _jsx("b", { children: metrics.totalOccupancy })] }), metrics.totalPublications !== undefined && (_jsxs("div", { children: ["\uD83D\uDCDD Pubs: ", _jsx("b", { children: metrics.totalPublications })] })), metrics.activeCollaborations !== undefined && (_jsxs("div", { children: ["\uD83E\uDD1D Collabs: ", _jsx("b", { children: metrics.activeCollaborations })] })), metrics.activeRivalries !== undefined && (_jsxs("div", { children: ["\u2694\uFE0F Rivalit\u00E9s: ", _jsx("b", { children: metrics.activeRivalries })] }))] }))] }), expanded && (_jsxs(_Fragment, { children: [_jsx(TrendChart, {}), _jsx(NewsFeed, {})] }))] }));
}
