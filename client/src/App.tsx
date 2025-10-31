import { Canvas } from '@react-three/fiber'
import { OrbitControls, SoftShadows, Text } from '@react-three/drei'
import { EffectComposer, Bloom, SMAA, SSAO } from '@react-three/postprocessing'
import { Suspense } from 'react'
import { useStore } from './state/store'
import { CampusScene } from './components/CampusScene'
import { HUD } from './components/HUD'
import { ControlsPanel } from './components/ControlsPanel'
import { FocusCamera } from './components/FocusCamera'
import { AutoTarget } from './components/AutoTarget'
import { MapView } from './components/MapView'

export default function App() {
  const glow = useStore(s => s.settings.glow)
  const shadows = useStore(s => s.settings.shadows)

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
      <MapView />
      <ControlsPanel />
    </div>
  )
}
