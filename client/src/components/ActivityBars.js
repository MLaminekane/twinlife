import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useStore } from '../state/store';
export function ActivityBars() {
    const buildings = useStore(s => s.buildings);
    return (_jsx("group", { children: buildings.map((b) => {
            const height = 0.2 + b.activity * 2.0;
            return (_jsxs("mesh", { position: [b.position[0], height / 2, b.position[2] + b.size[2] / 2 + 0.4], children: [_jsx("boxGeometry", { args: [Math.max(0.4, b.size[0] / 2), height, 0.2] }), _jsx("meshStandardMaterial", { color: '#38bdf8', emissive: '#0ea5e9', emissiveIntensity: 0.6 })] }, b.id));
        }) }));
}
