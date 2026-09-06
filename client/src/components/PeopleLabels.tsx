import { Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useRef, useState } from 'react'
import { useStore } from '../state/store'

export function PeopleLabels() {
  const people = useStore(s => s.people)
  const { camera } = useThree()
  const [target, setTarget] = useState<{ id: number, name: string, dist: number } | null>(null)
  const lastId = useRef<number | null>(null)
  const textRef = useRef<any>(null)
  const tmp = useRef(new THREE.Vector3())
  const posRef = useRef(new THREE.Vector3())
  const up = useRef(new THREE.Vector3())

  useFrame(() => {
  if (!people.length) { if (target) setTarget(null); return }
    let bestIdx = -1
    let bestScore = Infinity
  const maxWorldDist = 7.0 // permettre un peu plus d'espace quand zoomé
  const maxScreenDist = 0.2  // accepter légèrement hors centre

    for (let i = 0; i < people.length; i++) {
      const p = people[i]
      // Distance monde depuis la caméra
      const dx = p.position[0] - camera.position.x
      const dz = p.position[2] - camera.position.z
      const worldDist = Math.hypot(dx, dz)
      if (worldDist > maxWorldDist) continue
  // Devant la caméra et près du centre de l'écran
      tmp.current.set(p.position[0], p.position[1], p.position[2]).project(camera)
      const ndcX = tmp.current.x
      const ndcY = tmp.current.y
      const ndcZ = tmp.current.z
      if (ndcZ < 0 || ndcZ > 1) continue // derrière ou clippé
      const screenDist = Math.hypot(ndcX, ndcY)
      if (screenDist > maxScreenDist) continue
      // Le score favorise le centre et la proximité
      const score = screenDist * 2 + worldDist * 0.5
      if (score < bestScore) { bestScore = score; bestIdx = i }
    }

    if (bestIdx >= 0) {
      const p = people[bestIdx]
      const dx = p.position[0] - camera.position.x
      const dz = p.position[2] - camera.position.z
      const d = Math.hypot(dx, dz)
      if (lastId.current !== p.id || !target || Math.abs(target.dist - d) > 0.1) {
        lastId.current = p.id
        setTarget({ id: p.id, name: p.name, dist: d })
      }
      // Positionner le label À L'INTÉRIEUR du carré (légère élévation verticale pour éviter le z-fighting)
      up.current.set(0, 1, 0)
      posRef.current.set(p.position[0], p.position[1], p.position[2])
      posRef.current.addScaledVector(up.current, 0.12)
    } else if (target) {
      setTarget(null)
      lastId.current = null
    }

    // Faire face à la caméra si présente
    if (textRef.current) {
      textRef.current.quaternion.copy(camera.quaternion)
      if (target) {
        // Mettre à jour la position à chaque frame pendant le suivi de la personne en mouvement
        const p = people.find(pp => pp.id === target.id)
        if (p) {
          up.current.set(0, 1, 0)
          posRef.current.set(p.position[0], p.position[1], p.position[2])
          posRef.current.addScaledVector(up.current, 0.12)
          textRef.current.position.copy(posRef.current)
        }
      }
    }
  })

  if (!target) return null
  // Adapter la taille de police selon la proximité
  const fontSize = Math.min(0.18, Math.max(0.12, 0.28 - target.dist * 0.01))

  return (
    <Text
      ref={textRef}
      position={posRef.current.toArray() as [number, number, number]}
      fontSize={fontSize}
      color="#ffffff"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.015}
      outlineColor="#111827"
    >
      {target.name}
    </Text>
  )
}
