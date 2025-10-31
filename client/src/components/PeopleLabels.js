import { jsx as _jsx } from "react/jsx-runtime";
import { Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef, useState } from 'react';
import { useStore } from '../state/store';
export function PeopleLabels() {
    const people = useStore(s => s.people);
    const { camera } = useThree();
    const [target, setTarget] = useState(null);
    const lastId = useRef(null);
    const textRef = useRef(null);
    const tmp = useRef(new THREE.Vector3());
    const posRef = useRef(new THREE.Vector3());
    const up = useRef(new THREE.Vector3());
    useFrame(() => {
        if (!people.length) {
            if (target)
                setTarget(null);
            return;
        }
        let bestIdx = -1;
        let bestScore = Infinity;
        const maxWorldDist = 7.0; // allow a bit more room when zoomed
        const maxScreenDist = 0.2; // accept slightly off-center
        for (let i = 0; i < people.length; i++) {
            const p = people[i];
            // World distance from camera
            const dx = p.position[0] - camera.position.x;
            const dz = p.position[2] - camera.position.z;
            const worldDist = Math.hypot(dx, dz);
            if (worldDist > maxWorldDist)
                continue;
            // In front of camera and near center of screen
            tmp.current.set(p.position[0], p.position[1], p.position[2]).project(camera);
            const ndcX = tmp.current.x;
            const ndcY = tmp.current.y;
            const ndcZ = tmp.current.z;
            if (ndcZ < 0 || ndcZ > 1)
                continue; // behind or clipped
            const screenDist = Math.hypot(ndcX, ndcY);
            if (screenDist > maxScreenDist)
                continue;
            // Score favors on-center and closer
            const score = screenDist * 2 + worldDist * 0.5;
            if (score < bestScore) {
                bestScore = score;
                bestIdx = i;
            }
        }
        if (bestIdx >= 0) {
            const p = people[bestIdx];
            const dx = p.position[0] - camera.position.x;
            const dz = p.position[2] - camera.position.z;
            const d = Math.hypot(dx, dz);
            if (lastId.current !== p.id || !target || Math.abs(target.dist - d) > 0.1) {
                lastId.current = p.id;
                setTarget({ id: p.id, name: p.name, dist: d });
            }
            // Position label INSIDE the square (slight vertical lift to avoid z-fighting)
            up.current.set(0, 1, 0);
            posRef.current.set(p.position[0], p.position[1], p.position[2]);
            posRef.current.addScaledVector(up.current, 0.12);
        }
        else if (target) {
            setTarget(null);
            lastId.current = null;
        }
        // Make the text face the camera if present
        if (textRef.current) {
            textRef.current.quaternion.copy(camera.quaternion);
            if (target) {
                // Update position each frame while tracking the moving person
                const p = people.find(pp => pp.id === target.id);
                if (p) {
                    up.current.set(0, 1, 0);
                    posRef.current.set(p.position[0], p.position[1], p.position[2]);
                    posRef.current.addScaledVector(up.current, 0.12);
                    textRef.current.position.copy(posRef.current);
                }
            }
        }
    });
    if (!target)
        return null;
    // Scale font with proximity
    const fontSize = Math.min(0.18, Math.max(0.12, 0.28 - target.dist * 0.01));
    return (_jsx(Text, { ref: textRef, position: posRef.current.toArray(), fontSize: fontSize, color: "#ffffff", anchorX: "center", anchorY: "middle", outlineWidth: 0.015, outlineColor: "#111827", children: target.name }));
}
