import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Text } from '@react-three/drei';
export function Roads() {
    return (_jsxs("group", { children: [_jsxs("mesh", { "rotation-x": -Math.PI / 2, position: [0, 0.0005, -2], children: [_jsx("planeGeometry", { args: [80, 2.2] }), _jsx("meshStandardMaterial", { color: "#0b1220" })] }), _jsx(Text, { position: [0, 0.01, -2], fontSize: 0.9, color: "#cbd5e1", anchorX: "center", anchorY: "middle", "rotation-x": -Math.PI / 2, children: "Avenue Principale" }), _jsxs("mesh", { "rotation-x": -Math.PI / 2, "rotation-z": Math.PI / 2, position: [-6, 0.0005, 0], children: [_jsx("planeGeometry", { args: [80, 1.6] }), _jsx("meshStandardMaterial", { color: "#0b1220" })] }), _jsx(Text, { position: [-6, 0.01, 0], fontSize: 0.7, color: "#cbd5e1", anchorX: "center", anchorY: "middle", "rotation-x": -Math.PI / 2, children: "All\u00E9e Ouest" })] }));
}
