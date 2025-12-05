import { Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { useStore } from '../state/store'
import { Person } from '../state/types'

const EMOJI_MAP: Record<string, string> = {
  sleep: '😴',
  eat: '🍔',
  work: '💼',
  study: '📚',
  leisure: '🎉',
  travel: '🚶',
  idle: '😐',
  stressed: '😫',
  tired: '🥱',
  happy: '😊'
}

function getEmoji(person: Person) {
  if (!person.state) return ''
  const { currentActivity, mood } = person.state
  
  // Priority to mood if extreme
  if (mood === 'stressed') return EMOJI_MAP.stressed
  // if (mood === 'tired') return EMOJI_MAP.tired // Maybe too common if everyone is tired at night
  
  return EMOJI_MAP[currentActivity] || ''
}

export function PeopleThoughts() {
  const people = useStore(s => s.people)
  const { camera } = useThree()
  const [visibleAgents, setVisibleAgents] = useState<Person[]>([])
  const lastUpdate = useRef(0)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (t - lastUpdate.current > 0.2) { // Update 5 times a second
      lastUpdate.current = t
      
      // Simple distance check
      // Optimization: Don't sort all 500, just pick first N that are close enough
      const candidates: Person[] = []
      const maxDist = 20
      const maxCount = 40
      
      for (let i = 0; i < people.length; i++) {
        const p = people[i]
        const dx = p.position[0] - camera.position.x
        const dz = p.position[2] - camera.position.z
        const distSq = dx*dx + dz*dz
        
        if (distSq < maxDist * maxDist) {
          candidates.push(p)
          if (candidates.length >= maxCount) break
        }
      }
      
      setVisibleAgents(candidates)
    }
  })

  return (
    <>
      {visibleAgents.map(p => {
        const emoji = getEmoji(p)
        if (!emoji) return null
        return (
          <Text
            key={p.id}
            position={[p.position[0], 0.8, p.position[2]]} // Slightly above head (head is at ~0.5 * 1.65 = 0.8)
            fontSize={0.3}
            outlineWidth={0.01}
            outlineColor="white"
            color="black"
            anchorX="center"
            anchorY="bottom"
            renderOrder={10} // Ensure it renders on top of some things
          >
            {emoji}
          </Text>
        )
      })}
    </>
  )
}
