import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Canvas } from '@react-three/fiber';
import { OrbitControls, SoftShadows } from '@react-three/drei';
import { EffectComposer, Bloom, SMAA, SSAO } from '@react-three/postprocessing';
import { Suspense, useState } from 'react';
import { useStore } from './state/store';
import { CampusScene } from './components/CampusScene';
import { HUD } from './components/HUD';
import { ControlsPanel } from './components/ControlsPanel';
import { FocusCamera } from './components/FocusCamera';
import { AutoTarget } from './components/AutoTarget';
import { MapView } from './components/MapView';
import { AgentLoop } from './components/AgentLoop';
import { PersistGate } from './components/PersistGate';
import { LLMPanel } from './components/LLMPanel';
import { BuildingActivityPanel } from './components/BuildingActivityPanel';
import { DialogueModal } from './components/DialogueModal';
export default function App() {
    const glow = useStore(s => s.settings.glow);
    const shadows = useStore(s => s.settings.shadows);
    const [showLLM, setShowLLM] = useState(false);
    return (_jsxs("div", { className: "app-root", children: [_jsxs(Canvas, { shadows: shadows, camera: { position: [22, 18, 22], fov: 55 }, children: [_jsx("color", { attach: "background", args: [0x0a0e14] }), _jsx("ambientLight", { intensity: 0.35 }), _jsx("directionalLight", { castShadow: shadows, position: [15, 25, 15], intensity: 1.2, "shadow-mapSize-width": 2048, "shadow-mapSize-height": 2048 }), shadows && _jsx(SoftShadows, { size: 25, samples: 12, focus: 0.4 }), _jsx(Suspense, { fallback: null, children: _jsx(CampusScene, {}) }), _jsx(OrbitControls, { makeDefault: true }), _jsx(FocusCamera, {}), _jsx(AutoTarget, {}), glow && (_jsxs(EffectComposer, { children: [_jsx(SMAA, {}), _jsx(SSAO, { intensity: 0.3, radius: 0.2, luminanceInfluence: 0.6 }), _jsx(Bloom, { intensity: 1.15, luminanceThreshold: 0.22, luminanceSmoothing: 0.9, radius: 0.85 })] }))] }), _jsx(HUD, {}), _jsx(DialogueModal, {}), _jsx(AgentLoop, {}), _jsx(PersistGate, {}), _jsx(MapView, {}), _jsx(BuildingActivityPanel, {}), _jsx(ControlsPanel, {}), _jsxs("button", { className: "btn", onClick: () => setShowLLM(v => !v), style: {
                    position: 'absolute',
                    right: showLLM ? 420 : 10,
                    top: 12,
                    zIndex: 25,
                    background: showLLM ? '#3b82f6' : '#111827',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }, children: ["\uD83E\uDD16 ", showLLM ? 'Fermer' : 'Assistant', " LLM"] }), showLLM && _jsx(LLMPanel, {})] }));
}
