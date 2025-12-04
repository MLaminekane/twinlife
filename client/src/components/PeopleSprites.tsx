import * as THREE from 'three'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../state/store'

/**
 * Alternative rendering using sprites (2D icons that always face camera)
 * Better for top-down views or when you want emoji/icon style people
 */
export function PeopleSprites() {
  const people = useStore(s => s.people)
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const tempObject = useMemo(() => new THREE.Object3D(), [])
  const tempColor = useMemo(() => new THREE.Color(), [])

  // Create a plane geometry (will always face camera with sprite material)
  const geometry = useMemo(() => new THREE.PlaneGeometry(0.3, 0.3), [])

  // Create sprite-like material with a simple circle texture
  const material = useMemo(() => {
    // Create a canvas texture with a person icon
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    
    // Draw a simple person icon (circle head + body)
    ctx.fillStyle = '#60a5fa'
    ctx.beginPath()
    ctx.arc(32, 20, 12, 0, Math.PI * 2) // Head
    ctx.fill()
    ctx.fillRect(26, 32, 12, 20) // Body
    ctx.fillRect(20, 40, 8, 12) // Left leg
    ctx.fillRect(36, 40, 8, 12) // Right leg
    
    const texture = new THREE.CanvasTexture(canvas)
    
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      alphaTest: 0.1
    })
  }, [])

  useFrame(({ camera }) => {
    if (!meshRef.current) return
    const mesh = meshRef.current

    for (let i = 0; i < people.length; i++) {
      const person = people[i]
      
      tempObject.position.set(
        person.position[0],
        person.position[1] + 0.15, // Slightly elevated
        person.position[2]
      )
      
      // Make sprite face camera (billboard effect)
      tempObject.quaternion.copy(camera.quaternion)
      
      tempObject.updateMatrix()
      mesh.setMatrixAt(i, tempObject.matrix)
      
      // Color by gender
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
    />
  )
}
