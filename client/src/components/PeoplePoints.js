import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../state/store';
export function PeoplePoints() {
    const people = useStore(s => s.people);
    const glow = useStore(s => s.settings.glow);
    const positions = useMemo(() => new Float32Array(people.length * 3), [people.length]);
    const ref = useRef(null);
    useFrame(() => {
        for (let i = 0; i < people.length; i++) {
            const p = people[i];
            positions[i * 3 + 0] = p.position[0];
            positions[i * 3 + 1] = p.position[1];
            positions[i * 3 + 2] = p.position[2];
        }
        if (ref.current) {
            ;
            ref.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            ref.current.geometry.attributes.position.needsUpdate = true;
        }
    });
    const color = new THREE.Color('#60a5fa');
    return (_jsxs("points", { ref: ref, children: [_jsx("bufferGeometry", { children: _jsx("bufferAttribute", { attach: "attributes-position", args: [positions, 3] }) }), _jsx("pointsMaterial", { size: 0.18, sizeAttenuation: true, color: color, depthWrite: false, transparent: true, opacity: glow ? 0.95 : 0.85 })] }));
}
