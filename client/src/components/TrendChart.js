import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useStore } from '../state/store';
function pathFrom(values, w, h) {
    if (!values.length)
        return '';
    const max = Math.max(...values, 1); // Ensure max is at least 1 to avoid division by zero
    const min = 0; // Always start from 0 for better context
    const scale = (v) => {
        const nv = (v - min) / (max - min);
        return h - nv * (h - 10) - 5; // Padding top/bottom
    };
    const step = values.length > 1 ? w / (values.length - 1) : w;
    let d = `M 0 ${scale(values[0])}`;
    for (let i = 1; i < values.length; i++)
        d += ` L ${i * step} ${scale(values[i])}`;
    return d;
}
function AreaGradient({ id, color }) {
    return (_jsxs("linearGradient", { id: id, x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: color, stopOpacity: 0.2 }), _jsx("stop", { offset: "100%", stopColor: color, stopOpacity: 0 })] }));
}
export function TrendChart() {
    const ts = useStore(s => s.timeseries) || [];
    const [metric, setMetric] = useState('occupancy');
    const w = 280, h = 100;
    const data = useMemo(() => {
        if (metric === 'occupancy')
            return ts.map(t => t.occupancy || 0);
        if (metric === 'activity')
            return ts.map(t => t.activeBuildings || 0);
        if (metric === 'research')
            return ts.map(t => (t.pubs || 0) + (t.collabs || 0));
        return [];
    }, [ts, metric]);
    const path = useMemo(() => pathFrom(data, w, h), [data]);
    const areaPath = useMemo(() => {
        if (!data.length)
            return '';
        return `${path} L ${w} ${h} L 0 ${h} Z`;
    }, [path, data.length]);
    const color = metric === 'occupancy' ? '#60a5fa' : metric === 'activity' ? '#f59e0b' : '#10b981';
    const label = metric === 'occupancy' ? 'Occupation' : metric === 'activity' ? 'Bâtiments Actifs' : 'Recherche';
    const currentValue = data.length ? data[data.length - 1] : 0;
    return (_jsxs("div", { style: { marginTop: 8, background: 'rgba(11,18,32,0.85)', border: '1px solid #1f2937', borderRadius: 12, padding: '10px', backdropFilter: 'blur(8px)' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, children: [_jsxs("div", { style: { fontSize: 13, fontWeight: 600, color: '#e2e8f0' }, children: [label, " ", _jsx("span", { style: { color, marginLeft: 4 }, children: currentValue })] }), _jsxs("div", { style: { display: 'flex', gap: 4 }, children: [_jsx("button", { onClick: () => setMetric('occupancy'), style: { padding: '2px 6px', fontSize: 10, borderRadius: 4, background: metric === 'occupancy' ? '#60a5fa' : '#334155', color: metric === 'occupancy' ? '#fff' : '#94a3b8', border: 'none', cursor: 'pointer' }, children: "Pop" }), _jsx("button", { onClick: () => setMetric('activity'), style: { padding: '2px 6px', fontSize: 10, borderRadius: 4, background: metric === 'activity' ? '#f59e0b' : '#334155', color: metric === 'activity' ? '#fff' : '#94a3b8', border: 'none', cursor: 'pointer' }, children: "Act" }), _jsx("button", { onClick: () => setMetric('research'), style: { padding: '2px 6px', fontSize: 10, borderRadius: 4, background: metric === 'research' ? '#10b981' : '#334155', color: metric === 'research' ? '#fff' : '#94a3b8', border: 'none', cursor: 'pointer' }, children: "Res" })] })] }), _jsx("div", { style: { position: 'relative', height: h }, children: _jsxs("svg", { width: w, height: h, style: { display: 'block', overflow: 'visible' }, children: [_jsx("defs", { children: _jsx(AreaGradient, { id: "grad", color: color }) }), _jsx("line", { x1: "0", y1: h, x2: w, y2: h, stroke: "#334155", strokeWidth: 1 }), _jsx("line", { x1: "0", y1: h / 2, x2: w, y2: h / 2, stroke: "#334155", strokeWidth: 0.5, strokeDasharray: "4 4" }), _jsx("line", { x1: "0", y1: 0, x2: w, y2: 0, stroke: "#334155", strokeWidth: 0.5, strokeDasharray: "4 4" }), _jsx("path", { d: areaPath, fill: "url(#grad)" }), _jsx("path", { d: path, stroke: color, strokeWidth: 2, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }), data.length > 0 && (_jsx("circle", { cx: w, cy: path.split(' ').pop()?.split(',')[1] || path.split('L').pop()?.split(' ')[2], r: 3, fill: "#fff", stroke: color, strokeWidth: 2 }))] }) })] }));
}
