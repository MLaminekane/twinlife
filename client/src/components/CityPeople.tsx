import { useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../state/store'
import { useView } from '../state/viewStore'

/** Animated, instanced pedestrians. Only outdoor residents consume visible instances. */
export function CityPeople() {
  const population = useStore((s) => s.people.length)
  const shadows = useStore((s) => s.settings.shadows)
  const capacity = 2 ** Math.ceil(Math.log2(Math.max(64, population)))
  const torsos = useRef<THREE.InstancedMesh>(null),
    heads = useRef<THREE.InstancedMesh>(null),
    limbs = useRef<THREE.InstancedMesh>(null),
    bags = useRef<THREE.InstancedMesh>(null)
  const visibleIds = useRef<number[]>([])
  const positions = useRef(new Map<number, THREE.Vector3>())
  const object = useMemo(() => new THREE.Object3D(), []),
    local = useMemo(() => new THREE.Object3D(), []),
    matrix = useMemo(() => new THREE.Matrix4(), []),
    color = useMemo(() => new THREE.Color(), [])
  const time = useRef(0)
  const clothing = [
    '#d2ad75',
    '#e0c9aa',
    '#749489',
    '#658391',
    '#bd876f',
    '#6e7266',
    '#9b8c9c',
    '#b5bd9c',
  ]
  const skin = [
    '#efd1ae',
    '#c99a73',
    '#956d4b',
    '#d8b18c',
    '#62452f',
    '#b5835d',
  ]
  useFrame((_, dt) => {
    if (!torsos.current || !heads.current || !limbs.current || !bags.current)
      return
    const state = useStore.getState()
    if (state.settings.running)
      time.current += Math.min(dt, 0.1) * state.settings.speed
    const visible = state.people.filter((p) => p.presence === 'walking')
    visibleIds.current = visible.map((p) => p.id)
    const active = new Set(visibleIds.current)
    for (const id of positions.current.keys())
      if (!active.has(id)) positions.current.delete(id)
    visible.forEach((p, i) => {
      let position = positions.current.get(p.id)
      if (!position) {
        position = new THREE.Vector3(...p.position)
        positions.current.set(p.id, position)
      }
      if (state.settings.running)
        position.lerp(new THREE.Vector3(...p.position), 1 - Math.exp(-dt * 22))
      const scale = 0.94 + (p.id % 7) * 0.02
      const moving = p.state.currentActivity !== 'talking'
      const stride = moving
        ? Math.sin(time.current * 8 * p.speed + p.id) * 0.5
        : 0
      object.position.copy(position)
      object.rotation.set(0, p.heading ?? 0, 0)
      object.scale.setScalar(scale)
      object.updateMatrix()
      function part(
        ref: THREE.InstancedMesh,
        index: number,
        x: number,
        y: number,
        z: number,
        sx: number,
        sy: number,
        sz: number,
        rotation = 0,
      ) {
        local.position.set(x, y, z)
        local.scale.set(sx, sy, sz)
        local.rotation.set(rotation, 0, 0)
        local.updateMatrix()
        matrix.multiplyMatrices(object.matrix, local.matrix)
        ref.setMatrixAt(index, matrix)
      }
      part(torsos.current!, i, 0, 0.33, 0, 0.105, 0.16, 0.07)
      torsos.current!.setColorAt(
        i,
        color.set(
          p.id === state.selectedPersonId
            ? '#d5ff8b'
            : clothing[p.id % clothing.length],
        ),
      )
      part(heads.current!, i, 0, 0.465, 0, 0.044, 0.052, 0.044)
      heads.current!.setColorAt(i, color.set(skin[p.id % skin.length]))
      for (let j = 0; j < 4; j++) {
        const arm = j > 1,
          side = j % 2 ? 1 : -1,
          angle = stride * side * (arm ? -1 : 1)
        part(
          limbs.current!,
          i * 4 + j,
          side * (arm ? 0.076 : 0.031),
          arm ? 0.32 : 0.115,
          Math.sin(angle) * (arm ? 0.025 : 0.04),
          arm ? 0.024 : 0.034,
          arm ? 0.15 : 0.19,
          arm ? 0.027 : 0.036,
          angle,
        )
        limbs.current!.setColorAt(
          i * 4 + j,
          color.set(arm ? clothing[p.id % clothing.length] : '#414944'),
        )
      }
      part(bags.current!, i, 0, 0.33, -0.062, 0.087, 0.125, 0.041)
    })
    for (const [ref, count] of [
      [torsos, visible.length],
      [heads, visible.length],
      [limbs, visible.length * 4],
      [bags, visible.length],
    ] as const) {
      ref.current!.count = count
      ref.current!.instanceMatrix.needsUpdate = true
      if (ref.current!.instanceColor)
        ref.current!.instanceColor.needsUpdate = true
    }
  })
  function select(e: ThreeEvent<MouseEvent>) {
    if (e.instanceId === undefined) return
    const id = visibleIds.current[e.instanceId]
    if (id === undefined) return
    e.stopPropagation()
    useStore.getState().setSelectedBuilding(null)
    useStore.getState().setSelectedPerson(id)
    useView.setState({ panel: 'people', cinematic: false })
  }
  return (
    <group>
      <instancedMesh
        key={`torso-${capacity}`}
        ref={torsos}
        args={[undefined, undefined, capacity]}
        frustumCulled={false}
        castShadow={shadows}
        onClick={select}
      >
        <boxGeometry />
        <meshStandardMaterial roughness={0.91} />
      </instancedMesh>
      <instancedMesh
        key={`head-${capacity}`}
        ref={heads}
        args={[undefined, undefined, capacity]}
        frustumCulled={false}
        onClick={select}
      >
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.95} />
      </instancedMesh>
      <instancedMesh
        key={`limbs-${capacity}`}
        ref={limbs}
        args={[undefined, undefined, capacity * 4]}
        frustumCulled={false}
      >
        <boxGeometry />
        <meshStandardMaterial roughness={0.95} />
      </instancedMesh>
      <instancedMesh
        key={`bags-${capacity}`}
        ref={bags}
        args={[undefined, undefined, capacity]}
        frustumCulled={false}
      >
        <boxGeometry />
        <meshStandardMaterial color="#48564c" roughness={0.95} />
      </instancedMesh>
    </group>
  )
}
