import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'

export type CityInstance = {
  position: [number, number, number]
  scale?: [number, number, number]
  rotation?: [number, number, number]
  color?: string
}

/** A single draw call for repeated architectural and landscape details. */
export function CityInstances({
  items,
  geometry = 'box',
  color = '#ffffff',
  roughness = 0.8,
  metalness = 0,
  emissive = '#000000',
  emissiveIntensity = 0,
  castShadow = false,
}: {
  items: CityInstance[]
  geometry?: 'box' | 'sphere' | 'cylinder'
  color?: string
  roughness?: number
  metalness?: number
  emissive?: string
  emissiveIntensity?: number
  castShadow?: boolean
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const object = new THREE.Object3D()
    const instanceColor = new THREE.Color()
    items.forEach((item, index) => {
      object.position.set(...item.position)
      object.scale.set(...(item.scale ?? [1, 1, 1]))
      object.rotation.set(...(item.rotation ?? [0, 0, 0]))
      object.updateMatrix()
      mesh.setMatrixAt(index, object.matrix)
      mesh.setColorAt(index, instanceColor.set(item.color ?? '#ffffff'))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items])
  if (!items.length) return null
  return (
    <instancedMesh
      key={items.length}
      ref={ref}
      args={[undefined, undefined, items.length]}
      castShadow={castShadow}
      receiveShadow
    >
      {geometry === 'box' ? (
        <boxGeometry />
      ) : geometry === 'sphere' ? (
        <icosahedronGeometry args={[1, 1]} />
      ) : (
        <cylinderGeometry args={[1, 1, 1, 7]} />
      )}
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    </instancedMesh>
  )
}
