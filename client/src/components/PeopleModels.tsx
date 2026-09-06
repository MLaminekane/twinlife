import * as THREE from 'three'
import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useStore } from '../state/store'

/**
 * Rendu avancé utilisant des modèles 3D personnalisés
 * Placer un modèle .glb/.gltf dans public/models/person.glb
 */
export function PeopleModels() {
  const people = useStore(s => s.people)
  const glow = useStore(s => s.settings.glow)
  
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const tempObject = useMemo(() => new THREE.Object3D(), [])
  const tempColor = useMemo(() => new THREE.Color(), [])
  
  // Charger le modèle 3D (vous devez ajouter person.glb dans votre dossier public/models)
  // Alternative : utiliser une géométrie personnalisée simple
  const geometry = useMemo(() => {
    // Créer une forme humanoïde simple avec des boîtes
    const group = new THREE.Group()
    
    // Tête
    const head = new THREE.BoxGeometry(0.1, 0.1, 0.1)
    const headMesh = new THREE.Mesh(head)
    headMesh.position.y = 0.25
    
    // Corps
    const body = new THREE.BoxGeometry(0.12, 0.2, 0.08)
    const bodyMesh = new THREE.Mesh(body)
    bodyMesh.position.y = 0.1
    
    // Fusionner les géométries pour de meilleures performances
    const mergedGeometry = new THREE.BufferGeometry()
    const geometries = [head, body].map((geo, i) => {
      const mesh = i === 0 ? headMesh : bodyMesh
      const cloned = geo.clone()
      cloned.applyMatrix4(mesh.matrix)
      return cloned
    })
    
    // Ou utiliser un cône/capsule simple comme humanoïde
    return new THREE.CapsuleGeometry(0.06, 0.25, 4, 8)
  }, [])

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#60a5fa',
      roughness: 0.6,
      metalness: 0.1,
      emissive: glow ? '#60a5fa' : '#000000',
      emissiveIntensity: glow ? 0.2 : 0
    })
  }, [glow])

  useFrame(() => {
    if (!meshRef.current) return
    const mesh = meshRef.current

    for (let i = 0; i < people.length; i++) {
      const person = people[i]
      
      tempObject.position.set(
        person.position[0],
        person.position[1] + 0.15, // Légère élévation
        person.position[2]
      )
      
      // Ajouter une rotation basée sur la direction du mouvement (optionnel)
      const target = person.targetBuildingId
      // On pourrait calculer la rotation pour faire face à la cible ici
      
      tempObject.updateMatrix()
      mesh.setMatrixAt(i, tempObject.matrix)
      
      // Variation de couleur
      if (person.gender === 'male') {
        tempColor.setHex(0x60a5fa)
      } else if (person.gender === 'female') {
        tempColor.setHex(0xf472b6)
      } else {
        tempColor.setHex(0x60a5fa)
      }
      mesh.setColorAt(i, tempColor)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  if (people.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, people.length]}
      castShadow
      receiveShadow
    />
  )
}
