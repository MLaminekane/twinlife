import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../state/store'
import { nightAmount, seededCityRandom } from './cityLayout'

const COUNT = 48

/** Traffic is illustrative; it follows the streets and the simulation clock. */
export function CityTraffic({ mobility = false }: { mobility?: boolean }) {
  const bodies = useRef<THREE.InstancedMesh>(null)
  const cabins = useRef<THREE.InstancedMesh>(null)
  const wheels = useRef<THREE.InstancedMesh>(null)
  const lamps = useRef<THREE.InstancedMesh>(null)
  const elapsed = useRef(0)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const matrix = useMemo(() => new THREE.Matrix4(), [])
  const carColor = useMemo(() => new THREE.Color(), [])
  const local = useMemo(() => new THREE.Object3D(), [])
  const traffic = useMemo(() => {
    const random = seededCityRandom(992)
    return Array.from({ length: COUNT }, (_, i) => ({
      offset: random() * 298,
      speed: 1.25 + random() * 0.65,
      direction: i % 2 ? 1 : -1,
      bus: i % 13 === 0,
      color: [
        '#d3d7cc',
        '#b2c4bf',
        '#bd8761',
        '#506f7b',
        '#bac0ac',
        '#b76c57',
        '#d6be78',
      ][i % 7],
    }))
  }, [])

  useFrame((_, delta) => {
    if (!bodies.current || !cabins.current || !wheels.current || !lamps.current)
      return
    const state = useStore.getState()
    if (state.settings.running)
      elapsed.current +=
        Math.min(delta, 0.1) *
        Math.min(state.settings.speed, 6) *
        (state.environment.condition === 'rain' ||
        state.environment.condition === 'snow'
          ? 0.72
          : 1)
    const night = nightAmount(state.environment.gameTime)
    ;(lamps.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
      night * 2 + 0.2
    traffic.forEach((car, i) => {
      let x: number, z: number, heading: number
      // Closed routes share the central avenue and meet the perimeter without teleporting.
      const left = i < 30 || i % 2 === 0 ? -39 : -2
      const right = i < 30 || i % 2 === 1 ? 36 : -2
      const width = right - left,
        height = 74
      const routeLength = 2 * (width + height)
      const p =
        (((car.offset + elapsed.current * car.speed * car.direction) %
          routeLength) +
          routeLength) %
        routeLength
      if (p < width) {
        x = left + p
        z = -37
        heading = Math.PI / 2
      } else if (p < width + height) {
        x = right
        z = -37 + p - width
        heading = 0
      } else if (p < 2 * width + height) {
        x = right - (p - width - height)
        z = 37
        heading = -Math.PI / 2
      } else {
        x = left
        z = 37 - (p - 2 * width - height)
        heading = Math.PI
      }
      x += Math.cos(heading) * car.direction * 0.48
      z -= Math.sin(heading) * car.direction * 0.48
      if (car.direction < 0) heading += Math.PI
      const length = car.bus ? 1.65 : 0.85
      dummy.position.set(x, 0.22, z)
      dummy.rotation.set(0, heading, 0)
      dummy.scale.set(0.4, car.bus ? 0.35 : 0.2, length)
      dummy.updateMatrix()
      bodies.current!.setMatrixAt(i, dummy.matrix)
      bodies.current!.setColorAt(
        i,
        carColor.set(mobility ? '#86d7c1' : car.color),
      )
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      local.rotation.set(0, 0, 0)
      local.position.set(0, car.bus ? 0.22 : 0.18, -0.04)
      local.scale.set(0.34, car.bus ? 0.21 : 0.18, length * 0.61)
      local.updateMatrix()
      matrix.multiplyMatrices(dummy.matrix, local.matrix)
      cabins.current!.setMatrixAt(i, matrix)
      for (let j = 0; j < 4; j++) {
        local.position.set(
          (j % 2 ? 1 : -1) * 0.19,
          -0.07,
          (j < 2 ? 1 : -1) * length * 0.29,
        )
        local.scale.set(0.055, 0.1, 0.1)
        local.updateMatrix()
        matrix.multiplyMatrices(dummy.matrix, local.matrix)
        wheels.current!.setMatrixAt(i * 4 + j, matrix)
      }
      for (let j = 0; j < 2; j++) {
        local.position.set((j ? 1 : -1) * 0.125, 0.01, length * 0.51)
        local.scale.set(0.09, 0.05, 0.025)
        local.updateMatrix()
        matrix.multiplyMatrices(dummy.matrix, local.matrix)
        lamps.current!.setMatrixAt(i * 2 + j, matrix)
      }
    })
    for (const ref of [bodies, cabins, wheels, lamps])
      ref.current!.instanceMatrix.needsUpdate = true
    if (bodies.current.instanceColor)
      bodies.current.instanceColor.needsUpdate = true
  })
  return (
    <group>
      <instancedMesh
        ref={bodies}
        args={[undefined, undefined, COUNT]}
        frustumCulled={false}
        castShadow
      >
        <boxGeometry />
        <meshStandardMaterial roughness={0.3} metalness={0.35} />
      </instancedMesh>
      <instancedMesh
        ref={cabins}
        args={[undefined, undefined, COUNT]}
        frustumCulled={false}
      >
        <boxGeometry />
        <meshStandardMaterial
          color="#35515a"
          roughness={0.18}
          metalness={0.5}
        />
      </instancedMesh>
      <instancedMesh
        ref={wheels}
        args={[undefined, undefined, COUNT * 4]}
        frustumCulled={false}
      >
        <boxGeometry />
        <meshStandardMaterial color="#252c2b" roughness={0.96} />
      </instancedMesh>
      <instancedMesh
        ref={lamps}
        args={[undefined, undefined, COUNT * 2]}
        frustumCulled={false}
      >
        <boxGeometry />
        <meshStandardMaterial
          color="#f7e2b8"
          emissive="#ffd19c"
          emissiveIntensity={1}
        />
      </instancedMesh>
    </group>
  )
}
