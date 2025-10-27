import { Canvas } from '@react-three/fiber'
import { OrbitControls, SoftShadows, Text } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Suspense } from 'react'
import { useStore } from './state/store'
import { CampusScene } from './components/CampusScene'
import { HUD } from './components/HUD'
import { ControlsPanel } from './components/ControlsPanel'

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
        {glow && (
          <EffectComposer>
            <Bloom intensity={1.2} luminanceThreshold={0.2} luminanceSmoothing={0.9} radius={0.85} />
          </EffectComposer>
        )}
      </Canvas>
      <HUD />
      <ControlsPanel />
    </div>
  )
}
