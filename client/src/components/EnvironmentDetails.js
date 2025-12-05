import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
// Simple low-poly tree geometry
function TreeInstances({ count = 50, area = 40, offset = [0, 0] }) {
    const [offsetX, offsetZ] = offset;
    const trees = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * area * 2 + offsetX;
            const z = (Math.random() - 0.5) * area * 2 + offsetZ;
            // Avoid placing trees on the main roads (approximate exclusion zones)
            // Main Avenue: z approx -2, width ~4
            // West Alley: x approx -6, width ~4
            if (Math.abs(z + 2) < 3 || Math.abs(x + 6) < 3)
                continue;
            // Avoid river (approx z = -25)
            if (Math.abs(z + 25) < 4)
                continue;
            const scale = 0.5 + Math.random() * 0.5;
            temp.push({ position: [x, 0, z], scale });
        }
        return temp;
    }, [count, area, offsetX, offsetZ]);
    return (_jsxs("group", { children: [_jsxs(Instances, { range: trees.length, children: [_jsx("cylinderGeometry", { args: [0.1, 0.15, 1, 6] }), _jsx("meshStandardMaterial", { color: "#5c4033" }), trees.map((data, i) => (_jsx(Instance, { position: [data.position[0], 0.5 * data.scale, data.position[2]], scale: [data.scale, data.scale, data.scale] }, i)))] }), _jsxs(Instances, { range: trees.length, children: [_jsx("coneGeometry", { args: [0.8, 1.5, 7] }), _jsx("meshStandardMaterial", { color: "#2d4c1e" }), trees.map((data, i) => (_jsx(Instance, { position: [data.position[0], 1.2 * data.scale, data.position[2]], scale: [data.scale, data.scale, data.scale] }, i)))] }), _jsxs(Instances, { range: trees.length, children: [_jsx("coneGeometry", { args: [0.6, 1.2, 7] }), _jsx("meshStandardMaterial", { color: "#3a5f27" }), trees.map((data, i) => (_jsx(Instance, { position: [data.position[0], 1.8 * data.scale, data.position[2]], scale: [data.scale, data.scale, data.scale] }, i)))] })] }));
}
function River() {
    // A simple winding river mesh
    const curve = useMemo(() => {
        return new THREE.CatmullRomCurve3([
            new THREE.Vector3(-50, 0, -25),
            new THREE.Vector3(-20, 0, -22),
            new THREE.Vector3(0, 0, -28),
            new THREE.Vector3(30, 0, -24),
            new THREE.Vector3(50, 0, -26),
        ]);
    }, []);
    const geometry = useMemo(() => {
        return new THREE.TubeGeometry(curve, 20, 1.5, 8, false);
    }, [curve]);
    return (_jsx("group", { children: _jsx("mesh", { geometry: geometry, position: [0, -0.3, 0], scale: [1, 0.3, 1], receiveShadow: true, children: _jsx("meshStandardMaterial", { color: "#3b82f6", roughness: 0.2, metalness: 0.1 }) }) }));
}
function Mountains() {
    const mountains = useMemo(() => {
        return [
            { pos: [-40, 0, -40], scale: 15, color: '#64748b' },
            { pos: [-25, 0, -45], scale: 12, color: '#475569' },
            { pos: [35, 0, -42], scale: 18, color: '#64748b' },
            { pos: [50, 0, -35], scale: 14, color: '#475569' },
        ];
    }, []);
    return (_jsx("group", { children: mountains.map((m, i) => (_jsxs("mesh", { position: [m.pos[0], m.scale * 0.4, m.pos[2]], children: [_jsx("coneGeometry", { args: [m.scale, m.scale, 5] }), _jsx("meshStandardMaterial", { color: m.color, flatShading: true })] }, i))) }));
}
function StreetLamps() {
    // Place lamps along the main avenue (z = -2)
    const lamps = useMemo(() => {
        const temp = [];
        // Along X axis (Avenue Principale)
        for (let x = -35; x <= 35; x += 10) {
            temp.push({ x, z: -3.5, rot: 0 }); // Top side
            temp.push({ x, z: -0.5, rot: Math.PI }); // Bottom side
        }
        // Along Z axis (Allée Ouest, x = -6)
        for (let z = -35; z <= 35; z += 10) {
            if (Math.abs(z + 2) < 3)
                continue; // Skip intersection
            temp.push({ x: -7.5, z, rot: -Math.PI / 2 });
            temp.push({ x: -4.5, z, rot: Math.PI / 2 });
        }
        return temp;
    }, []);
    return (_jsx("group", { children: lamps.map((lamp, i) => (_jsxs("group", { position: [lamp.x, 0, lamp.z], rotation: [0, lamp.rot, 0], children: [_jsxs("mesh", { position: [0, 1.5, 0], children: [_jsx("cylinderGeometry", { args: [0.05, 0.05, 3] }), _jsx("meshStandardMaterial", { color: "#1a202c" })] }), _jsxs("mesh", { position: [0, 2.8, 0.3], rotation: [Math.PI / 4, 0, 0], children: [_jsx("boxGeometry", { args: [0.05, 0.05, 0.8] }), _jsx("meshStandardMaterial", { color: "#1a202c" })] }), _jsxs("mesh", { position: [0, 2.6, 0.6], children: [_jsx("sphereGeometry", { args: [0.15] }), _jsx("meshStandardMaterial", { color: "#fbbf24", emissive: "#fbbf24", emissiveIntensity: 2, toneMapped: false }), _jsx("pointLight", { intensity: 1, distance: 8, color: "#fbbf24" })] })] }, i))) }));
}
function Benches() {
    const benches = useMemo(() => {
        const temp = [];
        // Place benches near intersections or along paths
        temp.push({ x: 2, z: -4, rot: 0 });
        temp.push({ x: -2, z: -4, rot: 0 });
        temp.push({ x: -8, z: 2, rot: Math.PI / 2 });
        temp.push({ x: -8, z: -6, rot: Math.PI / 2 });
        return temp;
    }, []);
    return (_jsx("group", { children: benches.map((b, i) => (_jsxs("group", { position: [b.x, 0.2, b.z], rotation: [0, b.rot, 0], children: [_jsxs("mesh", { position: [0, 0.2, 0], children: [_jsx("boxGeometry", { args: [1.5, 0.1, 0.5] }), _jsx("meshStandardMaterial", { color: "#854d0e" })] }), _jsxs("mesh", { position: [-0.6, -0.1, 0], children: [_jsx("boxGeometry", { args: [0.1, 0.4, 0.4] }), _jsx("meshStandardMaterial", { color: "#1e293b" })] }), _jsxs("mesh", { position: [0.6, -0.1, 0], children: [_jsx("boxGeometry", { args: [0.1, 0.4, 0.4] }), _jsx("meshStandardMaterial", { color: "#1e293b" })] })] }, i))) }));
}
export function EnvironmentDetails() {
    return (_jsxs("group", { children: [_jsx(TreeInstances, { count: 60 }), _jsx(TreeInstances, { count: 80, area: 15, offset: [-35, -35] }), _jsx(TreeInstances, { count: 80, area: 15, offset: [35, -35] }), _jsx(River, {}), _jsx(Mountains, {}), _jsx(StreetLamps, {}), _jsx(Benches, {})] }));
}
