import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Html } from '@react-three/drei';
import { FinanceService } from '../lib/financeService';
export function WallStreetPanel({ visible, onClose }) {
    const [data, setData] = useState(null);
    useEffect(() => {
        if (visible) {
            const load = async () => {
                const base = FinanceService.getMockMarketData();
                const btc = await FinanceService.getBitcoinData();
                setData({ ...base, bitcoin: btc });
            };
            load();
            const interval = setInterval(load, 10000); // Refresh every 10s
            return () => clearInterval(interval);
        }
    }, [visible]);
    if (!visible || !data)
        return null;
    return (_jsx(Html, { position: [-12, 8, 7], center: true, distanceFactor: 15, zIndexRange: [100, 0], children: _jsxs("div", { className: "bg-gray-900 text-white p-4 rounded-lg shadow-2xl border border-green-500 w-80 font-mono text-xs opacity-90", children: [_jsxs("div", { className: "flex justify-between items-center mb-2 border-b border-gray-700 pb-2", children: [_jsx("h2", { className: "text-lg font-bold text-green-400", children: "WALL STREET HUB" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-white", children: "\u2715" })] }), _jsxs("div", { className: "mb-4 bg-gray-800 p-2 rounded", children: [_jsx("div", { className: "text-gray-400", children: "BITCOIN (BTC)" }), _jsxs("div", { className: "text-2xl font-bold flex items-center gap-2", children: ["$", data.bitcoin.price.toLocaleString(), _jsxs("span", { className: data.bitcoin.change24h >= 0 ? 'text-green-500 text-sm' : 'text-red-500 text-sm', children: [data.bitcoin.change24h > 0 ? '▲' : '▼', " ", Math.abs(data.bitcoin.change24h).toFixed(2), "%"] })] })] }), _jsxs("div", { className: "mb-4 flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400", children: "SENTIMENT:" }), _jsx("span", { className: `font-bold ${data.marketSentiment === 'Bullish' ? 'text-green-400' : 'text-red-400'}`, children: data.marketSentiment.toUpperCase() })] }), _jsxs("div", { className: "mb-4 space-y-1", children: [_jsx("div", { className: "text-gray-400 mb-1", children: "TOP MOVERS" }), data.topStocks.map(s => (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "font-bold", children: s.symbol }), _jsxs("span", { children: ["$", s.price.toFixed(2)] }), _jsxs("span", { className: s.change >= 0 ? 'text-green-500' : 'text-red-500', children: [s.change > 0 ? '+' : '', s.change.toFixed(2), "%"] })] }, s.symbol)))] }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-400 mb-1", children: "LATEST NEWS" }), _jsx("div", { className: "space-y-2 max-h-32 overflow-y-auto", children: data.news.map((n, i) => (_jsxs("div", { className: "border-l-2 border-blue-500 pl-2", children: [_jsx("div", { className: "font-semibold text-blue-300 leading-tight", children: n.title }), _jsxs("div", { className: "text-[10px] text-gray-500", children: [n.source, " \u2022 ", n.time] })] }, i))) })] }), _jsx("div", { className: "mt-3 text-center text-gray-600 italic", children: "\"Greed, for lack of a better word, is good.\"" })] }) }));
}
