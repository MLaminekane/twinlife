import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useStore } from '../state/store';
export function HUD() {
    const metrics = useStore(s => s.metrics);
    return (_jsx("div", { className: "hud", children: _jsxs("div", { style: { display: 'flex', gap: 12, alignItems: 'center' }, children: [_jsx("span", { className: "badge", children: "Campus Live" }), _jsxs("div", { children: ["\uD83D\uDC65 Total: ", _jsx("b", { children: metrics.totalPeople })] }), _jsxs("div", { children: ["\uD83C\uDFE2 Actifs: ", _jsx("b", { children: metrics.activeBuildings })] }), _jsxs("div", { children: ["\uD83D\uDCCA Occupation: ", _jsx("b", { children: metrics.totalOccupancy })] })] }) }));
}
