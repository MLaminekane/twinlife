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

    // La cible souhaitée est la position de la personne
    target.current.set(p.position[0], p.position[1], p.position[2])

    // Position caméra souhaitée : derrière et au-dessus par rapport à la vue actuelle
    const cam = camera as THREE.PerspectiveCamera
    const offsetBack = 6
    const offsetUp = 3.2
    // calculer la direction arrière de la caméra vers la personne
    tmp.current.copy(cam.position).sub(target.current).normalize()
    desired.current.copy(target.current)
    desired.current.addScaledVector(tmp.current, offsetBack)
    desired.current.y += offsetUp

    // Interpoler doucement la position de la caméra et la cible des contrôles
    cam.position.lerp(desired.current, Math.min(1, dt * 2.5))
    if ((controls as any)?.target) {
      ;(controls as any).target.lerp(target.current, Math.min(1, dt * 3.0))
      ;(controls as any).update?.()
    }

    // Arrêter le focus si très proche
    if (cam.position.distanceTo(desired.current) < 0.05) {
      // garder la sélection pour maintenir PeopleLabels, ou effacer ? On garde.
    }
  })

  return null
}
