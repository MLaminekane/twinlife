import { Component, Suspense, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useStore } from './state/store'
import { useView } from './state/viewStore'
import { CampusScene } from './components/CampusScene'
import { CityAtmosphere } from './components/CityAtmosphere'
import { CityCamera } from './components/CityCamera'
import { ExperienceShell } from './components/ExperienceShell'
import { AgentLoop } from './components/AgentLoop'
import { PersistGate } from './components/PersistGate'
import { MiniMap } from './components/MiniMap'

class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed)
      return (
        <div className="scene-fallback">
          <MiniMap large />
          <p>
            La vue 3D n’est pas disponible dans ce navigateur. Explorez les
            bâtiments sur le plan.
          </p>
          <button onClick={() => window.location.reload()}>
            Réessayer la 3D
          </button>
        </div>
      )
    return this.props.children
  }
}

export default function App() {
  const shadows = useStore((s) => s.settings.shadows)
  const glow = useStore((s) => s.settings.glow)
  const layer = useView((s) => s.layer)
  const quality = useView((s) => s.quality)
  const cinematic = useView((s) => s.cinematic)
  return (
    <div className="app-root">
      <ExperienceShell>
        <SceneBoundary>
          <Canvas
            shadows={shadows}
            dpr={quality === 'high' ? [1, 1.75] : 1}
            camera={{ position: [-65, 55, 72], fov: 45, near: 0.1, far: 400 }}
            gl={{ antialias: true, preserveDrawingBuffer: true }}
            onPointerMissed={() => {
              useStore.getState().setSelectedBuilding(null)
              useStore.getState().setSelectedPerson(null)
            }}
          >
            <Suspense fallback={null}>
              <CityAtmosphere />
              <CampusScene layer={layer} />
            </Suspense>
            <OrbitControls
              makeDefault
              target={[0, 0, 0]}
              minDistance={5}
              maxDistance={145}
              maxPolarAngle={Math.PI * 0.48}
              enableDamping
              dampingFactor={0.07}
              autoRotate={cinematic}
              autoRotateSpeed={0.45}
            />
            <CityCamera />
            {glow && quality === 'high' && (
              <EffectComposer multisampling={0}>
                <Bloom
                  intensity={0.28}
                  luminanceThreshold={1.1}
                  luminanceSmoothing={0.6}
                  mipmapBlur
                />
              </EffectComposer>
            )}
          </Canvas>
        </SceneBoundary>
      </ExperienceShell>
      <AgentLoop />
      <PersistGate />
    </div>
  )
}
