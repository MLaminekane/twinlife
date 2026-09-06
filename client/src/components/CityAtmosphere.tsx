import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../state/store'
import { nightAmount, seededCityRandom } from './cityLayout'

export function CityAtmosphere() {
  const sun = useRef<THREE.DirectionalLight>(null)
  const fill = useRef<THREE.HemisphereLight>(null)
  const background = useMemo(() => new THREE.Color('#7f998d'), [])
  const nightColor = useMemo(() => new THREE.Color('#142532'), [])
  const dayColor = useMemo(() => new THREE.Color('#95afa5'), [])
  const duskColor = useMemo(() => new THREE.Color('#a6a18e'), [])
  const fog = useMemo(() => new THREE.Fog('#94aaa1', 85, 205), [])
  useFrame(({ scene }) => {
    const { environment, settings } = useStore.getState()
    const night = nightAmount(environment.gameTime)
    const cloudy =
      environment.condition === 'rain' ||
      environment.condition === 'snow' ||
      environment.condition === 'cloudy'
    const angle = ((environment.gameTime - 6) / 12) * Math.PI
    const dusk = Math.max(0, 1 - Math.abs(environment.gameTime - 18) / 2) * 0.55
    background.copy(dayColor).lerp(duskColor, dusk).lerp(nightColor, night)
    if (cloudy) background.lerp(new THREE.Color('#7d8c91'), 0.22)
    scene.background = background
    fog.color.copy(background)
    fog.near = cloudy ? 60 : 90
    fog.far = cloudy ? 150 : 205
    scene.fog = fog
    if (sun.current) {
      sun.current.position.set(
        Math.cos(angle) * 55,
        Math.max(9, Math.sin(angle) * 65),
        20,
      )
      sun.current.intensity = (1 - night) * (cloudy ? 1.25 : 2.7) + night * 0.18
      sun.current.color.set(
        night > 0.7 ? '#92b6db' : cloudy ? '#e8eee5' : '#ffdfad',
      )
      sun.current.castShadow = settings.shadows
    }
    if (fill.current) {
      fill.current.intensity = (cloudy ? 1.6 : 1.25) * (1 - night) + night * 0.5
      fill.current.color.set(night > 0.6 ? '#759eab' : '#d4e6dd')
    }
  })
  return (
    <>
      <hemisphereLight ref={fill} args={['#d4e6dd', '#57634f', 1.25]} />
      <directionalLight
        ref={sun}
        position={[-45, 35, 20]}
        intensity={2.7}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-65}
        shadow-camera-right={65}
        shadow-camera-top={65}
        shadow-camera-bottom={-65}
        shadow-camera-near={1}
        shadow-camera-far={170}
        shadow-normalBias={0.08}
        shadow-bias={-0.00015}
      />
      <WeatherParticles />
    </>
  )
}

function WeatherParticles() {
  const condition = useStore((s) => s.environment.condition)
  const points = useRef<THREE.Points>(null)
  const count = 1300
  const positions = useMemo(() => {
    const random = seededCityRandom(321)
    const data = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      data[i * 3] = (random() - 0.5) * 90
      data[i * 3 + 1] = random() * 32
      data[i * 3 + 2] = (random() - 0.5) * 84
    }
    return data
  }, [])
  useFrame((_, dt) => {
    if (!points.current || !useStore.getState().settings.running) return
    const data = points.current.geometry.attributes.position
      .array as Float32Array
    const snow = condition === 'snow'
    for (let i = 0; i < count; i++) {
      data[i * 3 + 1] -= Math.min(dt, 0.1) * (snow ? 1.4 : 16)
      data[i * 3] += (snow ? 0.16 : 1.7) * Math.min(dt, 0.1)
      if (data[i * 3 + 1] < 0.1) data[i * 3 + 1] = 32
      if (data[i * 3] > 45) data[i * 3] = -45
    }
    points.current.geometry.attributes.position.needsUpdate = true
  })
  if (condition !== 'snow' && condition !== 'rain') return null
  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={condition === 'snow' ? '#f0f5ed' : '#c5e0e5'}
        size={condition === 'snow' ? 0.11 : 0.055}
        transparent
        opacity={condition === 'snow' ? 0.8 : 0.65}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}
