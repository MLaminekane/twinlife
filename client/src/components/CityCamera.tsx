import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useStore } from '../state/store'
import { CameraPreset, useView } from '../state/viewStore'
const VIEWS: Record<
  CameraPreset,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  overview: { position: [-65, 55, 72], target: [0, 0, 0] },
  campus: { position: [-44, 26, 46], target: [-19, 0, 18] },
  downtown: { position: [41, 28, 48], target: [15, 0, 17] },
  top: { position: [0, 95, 0.1], target: [0, 0, 0] },
}
export function CityCamera() {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as unknown as {
    target: Vector3
    update: () => void
    addEventListener: (event: string, handler: () => void) => void
    removeEventListener: (event: string, handler: () => void) => void
  } | null
  const preset = useView((s) => s.cameraPreset)
  const request = useView((s) => s.cameraRequest)
  const buildingId = useStore((s) => s.selectedBuildingId)
  const personId = useStore((s) => s.selectedPersonId)
  const position = useRef(new Vector3(...VIEWS.overview.position))
  const target = useRef(new Vector3())
  const moving = useRef(true)
  useEffect(() => {
    position.current.set(...VIEWS[preset].position)
    target.current.set(...VIEWS[preset].target)
    moving.current = true
  }, [preset, request])
  useEffect(() => {
    const building = useStore
      .getState()
      .buildings.find((b) => b.id === buildingId)
    if (!building) return
    target.current.set(
      building.position[0],
      building.size[1] * 0.3,
      building.position[2],
    )
    position.current.copy(target.current).add(new Vector3(-15, 15, 19))
    moving.current = true
  }, [buildingId])
  useEffect(() => {
    const stop = () => {
      moving.current = false
    }
    controls?.addEventListener('start', stop)
    return () => controls?.removeEventListener('start', stop)
  }, [controls])
  useFrame((_, dt) => {
    if (!controls) return
    if (personId !== null) {
      const person = useStore.getState().people.find((p) => p.id === personId)
      if (person) {
        target.current.set(...person.position)
        position.current.copy(target.current).add(new Vector3(-5, 5, 8))
        moving.current = true
      }
    }
    if (!moving.current) return
    const smoothing = 1 - Math.exp(-dt * 3)
    camera.position.lerp(position.current, smoothing)
    controls.target.lerp(target.current, smoothing)
    controls.update()
    if (
      personId === null &&
      camera.position.distanceTo(position.current) < 0.04
    )
      moving.current = false
  })
  return null
}
