import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useMemo } from 'react';
function RoundedQuad({ pos, color, w = 36, h = 36, r = 4, alpha = 0.06 }) {
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        const rr = Math.min(r, w / 2, h / 2);
        const x = -w / 2, y = -h / 2;
        s.moveTo(x + rr, y);
        s.lineTo(x + w - rr, y);
        s.quadraticCurveTo(x + w, y, x + w, y + rr);
        s.lineTo(x + w, y + h - rr);
        s.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
        s.lineTo(x + rr, y + h);
        s.quadraticCurveTo(x, y + h, x, y + h - rr);
        s.lineTo(x, y + rr);
        s.quadraticCurveTo(x, y, x + rr, y);
        return s;
    }, [w, h, r]);
    return (_jsxs("mesh", { "rotation-x": -Math.PI / 2, position: pos, children: [_jsx("shapeGeometry", { args: [shape] }), _jsx("meshBasicMaterial", { color: color, transparent: true, opacity: alpha })] }));
}
export function Zones() {
    const size = 40;
    return (_jsxs("group", { children: [_jsx(RoundedQuad, { pos: [-size / 2, 0.001, size / 2], color: "#16a34a" }), _jsx(RoundedQuad, { pos: [size / 2, 0.001, size / 2], color: "#2563eb" }), _jsx(RoundedQuad, { pos: [-size / 2, 0.001, -size / 2], color: "#b45309" }), _jsx(RoundedQuad, { pos: [size / 2, 0.001, -size / 2], color: "#a21caf" }), _jsx(Text, { position: [-size / 2, 0.01, size / 2], fontSize: 1.2, color: "#cbd5e1", anchorX: "center", anchorY: "middle", children: "Universit\u00E9" }), _jsx(Text, { position: [size / 2, 0.01, size / 2], fontSize: 1.2, color: "#cbd5e1", anchorX: "center", anchorY: "middle", children: "Logement \u00E9tudiant" }), _jsx(Text, { position: [-size / 2, 0.01, -size / 2], fontSize: 1.2, color: "#cbd5e1", anchorX: "center", anchorY: "middle", children: "Centre-ville" }), _jsx(Text, { position: [size / 2, 0.01, -size / 2], fontSize: 1.2, color: "#cbd5e1", anchorX: "center", anchorY: "middle", children: "Place du Royaume" })] }));
}
