import { Canvas } from '@react-three/fiber'
import { OrbitControls, SoftShadows, Text } from '@react-three/drei'
import { EffectComposer, Bloom, SMAA, SSAO } from '@react-three/postprocessing'
import { Suspense, useState } from 'react'
import { useStore } from './state/store'
import { CampusScene } from './components/CampusScene'
import { HUD } from './components/HUD'
import { ControlsPanel } from './components/ControlsPanel'
import { FocusCamera } from './components/FocusCamera'
import { AutoTarget } from './components/AutoTarget'
import { MapView } from './components/MapView'
import { AgentLoop } from './components/AgentLoop'
import { PersistGate } from './components/PersistGate'
import { LLMPanel } from './components/LLMPanel'
import { BuildingActivityPanel } from './components/BuildingActivityPanel'
import { DialogueModal } from './components/DialogueModal'

export default function App() {
  const glow = useStore(s => s.settings.glow)
  const shadows = useStore(s => s.settings.shadows)
  const [showLLM, setShowLLM] = useState(false)

  return (
    <div className="app-root">
      <Canvas shadows={shadows} camera={{ position: [22, 18, 22], fov: 55 }}>
        <color attach="background" args={[0x0a0e14]} />
        <ambientLight intensity={0.35} />
        <directionalLight
          castShadow={shadows}
          position={[15, 25, 15]}
          intensity={1.2}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        {shadows && <SoftShadows size={25} samples={12} focus={0.4} />}
        <Suspense fallback={null}>
          <CampusScene />
        </Suspense>
        <OrbitControls makeDefault />
        <FocusCamera />
  <AutoTarget />
        {glow && (
          <EffectComposer>
            <SMAA />
            <SSAO intensity={0.3} radius={0.2} luminanceInfluence={0.6} />
            <Bloom intensity={1.15} luminanceThreshold={0.22} luminanceSmoothing={0.9} radius={0.85} />
          </EffectComposer>
        )}
      </Canvas>
      <HUD />
      <DialogueModal />
  <AgentLoop />
  <PersistGate />
      <MapView />
      <BuildingActivityPanel />
      <ControlsPanel />
      
      {/* Bouton pour ouvrir le panneau LLM */}
      <button 
        className="btn"
        onClick={() => setShowLLM(v => !v)}
        style={{ 
          position: 'absolute', 
          right: showLLM ? 420 : 10, 
          top: 12, 
          zIndex: 25,
          background: showLLM ? '#3b82f6' : '#111827',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
      >
        🤖 {showLLM ? 'Fermer' : 'Assistant'} LLM
      </button>
      
      {showLLM && <LLMPanel />}
    </div>
  )
}
