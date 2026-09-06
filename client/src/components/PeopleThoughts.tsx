import { Text, Billboard } from '@react-three/drei'
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
  happy: '😊',
  talking: '💬'
}

function getEmoji(person: Person) {
  if (!person.state) return ''
  const { currentActivity, mood } = person.state
  
  if (mood === 'stressed') return EMOJI_MAP.stressed
  if (mood === 'tired') return EMOJI_MAP.tired
  if (mood === 'talking') return EMOJI_MAP.talking
  


  
  
  return EMOJI_MAP[currentActivity] || ''
}

function ThoughtBubble({ person }: { person: Person }) {
  const emoji = getEmoji(person)
  const groupRef = useRef<any>(null)
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Suivre doucement la personne
      groupRef.current.position.set(
        person.position[0],
        0.9 + Math.sin(clock.getElapsedTime() * 3 + person.id) * 0.05,
        person.position[2]
      )
    }
  })

  if (!emoji) return null

  return (
    <Billboard ref={groupRef} follow={true} lockX={false} lockY={false} lockZ={false}>
      <Text
        fontSize={0.35}
        outlineWidth={0.02}
        outlineColor="white"
        color="black"
        anchorX="center"
        anchorY="bottom"
        renderOrder={10}
      >
        {emoji}
      </Text>
    </Billboard>
  )
}

export function PeopleThoughts() {
  const people = useStore(s => s.people)
  const { camera } = useThree()
  const [visibleAgents, setVisibleAgents] = useState<Person[]>([])
  const lastUpdate = useRef(0)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (t - lastUpdate.current > 0.2) { // Mettre à jour la liste toutes les 200ms
      lastUpdate.current = t
      
      const candidates: Person[] = []
      const maxDist = 25 // Portée augmentée
      const maxCount = 50 // Plus de bulles
      
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
      {visibleAgents.map(p => (
        <ThoughtBubble key={p.id} person={p} />
      ))}
    </>
  )
}
