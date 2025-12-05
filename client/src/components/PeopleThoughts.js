import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Text, Billboard } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { useStore } from '../state/store';
const EMOJI_MAP = {
    sleep: '😴',
    eat: '🍔',
    work: '💼',
    study: '📚',
    leisure: '🎉',
    travel: '🚶',
    idle: '😐',
    stressed: '😫',
    tired: '🥱',
    happy: '😊',
    talking: '💬'
};
function getEmoji(person) {
    if (!person.state)
        return '';
    const { currentActivity, mood } = person.state;
    if (mood === 'stressed')
        return EMOJI_MAP.stressed;
    if (mood === 'tired')
        return EMOJI_MAP.tired;
    if (mood === 'talking')
        return EMOJI_MAP.talking;
    return EMOJI_MAP[currentActivity] || '';
}
function ThoughtBubble({ person }) {
    const emoji = getEmoji(person);
    const groupRef = useRef(null);
    useFrame(({ clock }) => {
        if (groupRef.current) {
            // Smoothly follow the person
            groupRef.current.position.set(person.position[0], 0.9 + Math.sin(clock.getElapsedTime() * 3 + person.id) * 0.05, person.position[2]);
        }
    });
    if (!emoji)
        return null;
    return (_jsx(Billboard, { ref: groupRef, follow: true, lockX: false, lockY: false, lockZ: false, children: _jsx(Text, { fontSize: 0.35, outlineWidth: 0.02, outlineColor: "white", color: "black", anchorX: "center", anchorY: "bottom", renderOrder: 10, children: emoji }) }));
}
export function PeopleThoughts() {
    const people = useStore(s => s.people);
    const { camera } = useThree();
    const [visibleAgents, setVisibleAgents] = useState([]);
    const lastUpdate = useRef(0);
    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (t - lastUpdate.current > 0.2) { // Update list every 200ms
            lastUpdate.current = t;
            const candidates = [];
            const maxDist = 25; // Increased range
            const maxCount = 50; // More bubbles
            for (let i = 0; i < people.length; i++) {
                const p = people[i];
                const dx = p.position[0] - camera.position.x;
                const dz = p.position[2] - camera.position.z;
                const distSq = dx * dx + dz * dz;
                if (distSq < maxDist * maxDist) {
                    candidates.push(p);
                    if (candidates.length >= maxCount)
                        break;
                }
            }
            setVisibleAgents(candidates);
        }
    });
    return (_jsx(_Fragment, { children: visibleAgents.map(p => (_jsx(ThoughtBubble, { person: p }, p.id))) }));
}
