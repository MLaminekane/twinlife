import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useFrame } from '@react-three/fiber';
import { Text, Grid } from '@react-three/drei';
import { useStore } from '../state/store';
import { PeoplePoints } from './PeoplePoints';
import { PeopleLabels } from './PeopleLabels';
import { Zones } from './Zones';
import { ActivityBars } from './ActivityBars';
import { Roads } from './Roads';
import { BuildingMesh } from './BuildingMesh';
export function CampusScene() {
    const buildings = useStore(s => s.buildings);
    const visible = useStore(s => s.settings.visibleBuildings);
    const labels = useStore(s => s.settings.labels);
    const tick = useStore(s => s.tick);
    // Animation loop ticks simulation
    useFrame((_, dt) => tick(Math.min(0.05, dt)));
    return (_jsxs("group", { children: [_jsxs("mesh", { "rotation-x": -Math.PI / 2, receiveShadow: true, children: [_jsx("planeGeometry", { args: [80, 80] }), _jsx("meshStandardMaterial", { color: "#0c121a" })] }), _jsx(Zones, {}), _jsx(Grid, { position: [0, 0.002, 0], args: [80, 80], cellSize: 2, cellThickness: 0.4, sectionSize: 10, sectionThickness: 1, fadeDistance: 40, fadeStrength: 1, infiniteGrid: true }), _jsx(Roads, {}), buildings.filter(b => visible.has(b.id)).map((b) => (_jsxs("group", { position: [b.position[0], 0, b.position[2]], children: [_jsx(BuildingMesh, { building: b }), labels && (_jsx(Text, { position: [0, b.size[1] + 0.6, 0], fontSize: 0.6, color: "#cbd5e1", anchorX: "center", anchorY: "middle", children: b.name }))] }, b.id))), _jsx(ActivityBars, {}), _jsx(PeoplePoints, {}), _jsx(PeopleLabels, {})] }));
}
