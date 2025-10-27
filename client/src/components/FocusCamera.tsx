import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../state/store'
import { useRef } from 'react'

export function FocusCamera() {
  const selectedId = useStore(s => s.selectedPersonId)
  const people = useStore(s => s.people)
  const setSelected = useStore(s => s.setSelectedPerson)
  const { camera, controls } = useThree((s: any) => ({ camera: s.camera, controls: s.controls }))
  const tmp = useRef(new THREE.Vector3())
  const desired = useRef(new THREE.Vector3())
  const target = useRef(new THREE.Vector3())

  useFrame((_, dt) => {
    if (!selectedId) return
    const p = people.find(pp => pp.id === selectedId)
    if (!p) { setSelected(null); return }

    // Desired target is the person position
    target.current.set(p.position[0], p.position[1], p.position[2])

    // Desired camera position: behind and above relative to current view
    const cam = camera as THREE.PerspectiveCamera
    const offsetBack = 6
    const offsetUp = 3.2
    // compute back direction from camera to person
    tmp.current.copy(cam.position).sub(target.current).normalize()
    desired.current.copy(target.current)
    desired.current.addScaledVector(tmp.current, offsetBack)
    desired.current.y += offsetUp

    // Smoothly interpolate camera position and controls target
    cam.position.lerp(desired.current, Math.min(1, dt * 2.5))
    if ((controls as any)?.target) {
      ;(controls as any).target.lerp(target.current, Math.min(1, dt * 3.0))
      ;(controls as any).update?.()
    }

    // Stop focusing if very close
    if (cam.position.distanceTo(desired.current) < 0.05) {
      // keep selection to maintain PeopleLabels, or clear? We'll keep it.
    }
  })

  return null
}
