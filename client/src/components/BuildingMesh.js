import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as THREE from 'three';
import { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useStore } from '../state/store';
export function BuildingMesh({ building, onClick }) {
    const shadows = useStore(s => s.settings.shadows);
    const { camera } = useThree();
    const [lod, setLod] = useState(0);
    const groupRef = useRef(null);
    const isEco = building.id === 'bus';
    const color = useMemo(() => new THREE.Color(isEco ? '#0f172a' : '#1e293b'), [isEco]);
    const emissive = useMemo(() => new THREE.Color(isEco ? '#10b981' : '#60a5fa'), [isEco]);
    // LOD 0: Detailed windows (individual meshes)
    const windowsDetailed = useMemo(() => {
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
    // LOD 1: Simplified windows (fewer, larger quads)
    const windowsSimplified = useMemo(() => {
        const planes = [];
        const [sx, sy, sz] = building.size;
        const cols = Math.max(2, Math.floor(sx));
        const rows = Math.max(2, Math.floor(sy));
        for (let side = 0; side < 2; side++) {
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const x = -sx / 2 + (i + 0.5) * (sx / cols);
                    const y = (j + 0.5) * (sy / rows) - sy / 2 + 0.3;
                    const z = side === 0 ? sz / 2 + 0.01 : -sz / 2 - 0.01;
                    planes.push({ pos: [x, y, z] });
                }
            }
        }
        return planes;
    }, [building.size]);
    // Update LOD based on camera distance
    useFrame(() => {
        if (!groupRef.current)
            return;
        const distance = camera.position.distanceTo(groupRef.current.position);
        // LOD thresholds
        if (distance < 25) {
            setLod(0); // Detailed
        }
        else if (distance < 50) {
            setLod(1); // Simplified
        }
        else {
            setLod(2); // Minimal
        }
        // Flicker windows for LOD 0 (detailed)
        if (lod === 0) {
            const act = building.activity;
            for (const w of windowsDetailed) {
                if (Math.random() < 0.02 + act * 0.08) {
                    w.vis = Math.random() < (0.2 + act * 0.7) ? 1 : 0;
                }
            }
        }
    });
    return (_jsxs("group", { ref: groupRef, children: [_jsxs("mesh", { castShadow: shadows, receiveShadow: true, position: [0, building.size[1] / 2, 0], onClick: onClick, children: [_jsx("boxGeometry", { args: building.size }), _jsx("meshStandardMaterial", { color: color, roughness: 0.8, metalness: 0.1 })] }), lod === 0 && windowsDetailed.map((w, idx) => (_jsxs("mesh", { position: [w.pos[0], w.pos[1] + building.size[1] / 2, w.pos[2]], children: [_jsx("planeGeometry", { args: [0.25, 0.18] }), _jsx("meshBasicMaterial", { color: emissive, transparent: true, opacity: 0.85 * w.vis })] }, idx))), lod === 1 && windowsSimplified.map((w, idx) => (_jsxs("mesh", { position: [w.pos[0], w.pos[1] + building.size[1] / 2, w.pos[2]], children: [_jsx("planeGeometry", { args: [0.5, 0.4] }), _jsx("meshBasicMaterial", { color: emissive, transparent: true, opacity: 0.6 * (0.3 + building.activity * 0.7) })] }, idx))), lod === 2 && (_jsxs("mesh", { position: [0, building.size[1] / 2, 0], children: [_jsx("boxGeometry", { args: building.size }), _jsx("meshStandardMaterial", { color: color, emissive: emissive, emissiveIntensity: building.activity * 0.3, roughness: 0.8, metalness: 0.1 })] })), isEco && (_jsxs("mesh", { position: [0, building.size[1] - 0.5, 0], children: [_jsx("boxGeometry", { args: [building.size[0] + 0.2, 0.4, building.size[2] + 0.2] }), _jsx("meshStandardMaterial", { color: "#064e3b", emissive: "#10b981", emissiveIntensity: 0.8 })] }))] }));
}
