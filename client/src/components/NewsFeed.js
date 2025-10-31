import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useStore } from '../state/store';
export function NewsFeed() {
    const news = useStore(s => s.news);
    const items = useMemo(() => news.slice(-8).reverse(), [news]);
    if (!items.length)
        return null;
    return (_jsxs("div", { style: { marginTop: 8, background: 'rgba(11,18,32,0.75)', border: '1px solid #1f2937', borderRadius: 8, padding: '6px 8px', maxHeight: 160, overflowY: 'auto' }, children: [_jsx("div", { style: { fontSize: 12, color: '#9ca3af', marginBottom: 4 }, children: "Actualit\u00E9s" }), _jsx("ul", { style: { listStyle: 'none', padding: 0, margin: 0, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }, children: items.map(it => (_jsx("li", { style: { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }, children: it.text }, it.id))) })] }));
}
