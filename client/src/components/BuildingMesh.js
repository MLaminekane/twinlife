import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as THREE from 'three';
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../state/store';
export function BuildingMesh({ building }) {
    const shadows = useStore(s => s.settings.shadows);
    const color = useMemo(() => new THREE.Color('#1e293b'), []);
    const emissive = useMemo(() => new THREE.Color('#60a5fa'), []);
    // Simple window planes grid precomputed
    const windows = useMemo(() => {
        const planes = [];
        const [sx, sy, sz] = building.size;
        const cols = Math.max(3, Math.floor(sx * 2));
        const rows = Math.max(3, Math.floor((sy) * 2));
        for (let side = 0; side < 2; side++) {
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const x = -sx / 2 + (i + 0.5) * (sx / cols);
                    const y = (j + 0.5) * (sy / rows) - sy / 2 + 0.3;
                    const z = side === 0 ? sz / 2 + 0.01 : -sz / 2 - 0.01;
                    planes.push({ pos: [x, y, z], vis: Math.random() });
                }
            }
        }
        return planes;
    }, [building.size]);
    useFrame(() => {
        // flicker based on activity
        const act = building.activity;
        for (const w of windows) {
            if (Math.random() < 0.02 + act * 0.08) {
                w.vis = Math.random() < (0.2 + act * 0.7) ? 1 : 0;
            }
        }
    });
    return (_jsxs("group", { children: [_jsxs("mesh", { castShadow: shadows, receiveShadow: true, position: [0, building.size[1] / 2, 0], children: [_jsx("boxGeometry", { args: building.size }), _jsx("meshStandardMaterial", { color: color, roughness: 0.8, metalness: 0.1 })] }), windows.map((w, idx) => (_jsxs("mesh", { position: [w.pos[0], w.pos[1] + building.size[1] / 2, w.pos[2]], children: [_jsx("planeGeometry", { args: [0.25, 0.18] }), _jsx("meshBasicMaterial", { color: emissive, transparent: true, opacity: 0.85 * w.vis })] }, idx)))] }));
}
