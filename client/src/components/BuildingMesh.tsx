import { memo, useMemo } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import { Building, useStore } from '../state/store'
import { CityInstances, type CityInstance } from './CityInstances'
import { nightAmount, seededCityRandom } from './cityLayout'

const FACADES = {
  campus: ['#d4c5a6', '#c6b69a', '#dfd6c3', '#b2b7b0'],
  downtown: ['#778b91', '#8c999b', '#71858b', '#a5aca7'],
  residential: ['#b99879', '#c0a48a', '#b68e70', '#c8b49b'],
  commercial: ['#bbaf97', '#c3b79d', '#a49380', '#c8bca5'],
}

export const BuildingMesh = memo(function BuildingMesh({
  building,
  onClick,
}: {
  building: Building
  onClick?: (e: ThreeEvent<MouseEvent>) => void
}) {
  const shadows = useStore((s) => s.settings.shadows)
  const night = useStore(
    (s) => Math.round(nightAmount(s.environment.gameTime) * 8) / 8,
  )
  const snow = useStore((s) => s.environment.condition === 'snow')
  const [sx, sy, sz] = building.size
  const seed = [...building.id].reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  )
  const facade = FACADES[building.zone][seed % 4]
  const office = building.type === 'office' || building.type === 'research'
  const residential = building.type === 'residence'
  const park = building.type === 'park'
  const activity = Math.round(building.activity * 5) / 5

  const details = useMemo(() => {
    const random = seededCityRandom(seed)
    const glass: CityInstance[] = []
    const lit: CityInstance[] = []
    const trim: CityInstance[] = []
    const balconies: CityInstance[] = []
    const solar: CityInstance[] = []
    const floors = Math.max(2, Math.floor(sy / 0.82))
    const floorHeight = (sy - 0.55) / floors
    for (let floor = 0; floor < floors; floor++) {
      const y = 0.4 + (floor + 0.5) * floorHeight
      for (let side = 0; side < 4; side++) {
        const width = side < 2 ? sx : sz
        const columns = Math.max(2, Math.floor(width / (office ? 0.7 : 1.0)))
        const windowWidth = (width / columns) * (office ? 0.81 : 0.59)
        for (let column = 0; column < columns; column++) {
          const along = -width / 2 + ((column + 0.5) * width) / columns
          const item: CityInstance = {
            position:
              side < 2
                ? [along, y, (side === 0 ? 1 : -1) * (sz / 2 + 0.015)]
                : [(side === 2 ? 1 : -1) * (sx / 2 + 0.015), y, along],
            scale:
              side < 2
                ? [windowWidth, floorHeight * 0.66, 0.035]
                : [0.035, floorHeight * 0.66, windowWidth],
            color: ['#48616a', '#58757c', '#6b8284', '#3b535c'][
              Math.floor(random() * 4)
            ],
          }
          if (random() < 0.12 + activity * 0.36)
            lit.push({
              ...item,
              color: ['#f2c481', '#e3b878', '#d5b78f'][
                Math.floor(random() * 3)
              ],
            })
          else glass.push(item)
          if (residential && floor > 0 && side < 2 && column % 2 === 0) {
            balconies.push({
              position: [
                along,
                y - floorHeight * 0.35,
                (side === 0 ? 1 : -1) * (sz / 2 + 0.19),
              ],
              scale: [windowWidth + 0.16, 0.07, 0.48],
              color: '#e0d6c5',
            })
            balconies.push({
              position: [
                along,
                y - 0.03,
                (side === 0 ? 1 : -1) * (sz / 2 + 0.42),
              ],
              scale: [windowWidth + 0.14, floorHeight * 0.42, 0.04],
              color: '#626c6c',
            })
          }
        }
      }
      if (office || floor === floors - 1 || residential)
        trim.push({
          position: [0, 0.42 + floor * floorHeight, 0],
          scale: [sx + 0.05, 0.06, sz + 0.05],
        })
    }
    for (let x = -sx / 2 + 0.65; x < sx / 2 - 0.35; x += 0.74) {
      solar.push({
        position: [x, sy + 0.27, -sz * 0.18],
        scale: [0.61, 0.055, Math.min(1.5, sz * 0.35)],
        rotation: [-0.17, 0, 0],
        color: '#263e4c',
      })
    }
    return { glass, lit, trim, balconies, solar }
  }, [sx, sy, sz, seed, office, residential, activity])

  if (park) return <UrbanPark size={building.size} />

  return (
    <group onClick={onClick}>
      <mesh position={[0, 0.035, 0]} receiveShadow>
        <boxGeometry args={[sx + 0.8, 0.09, sz + 0.8]} />
        <meshStandardMaterial color="#b9b6a7" roughness={0.92} />
      </mesh>
      <mesh position={[0, sy / 2 + 0.12, 0]} castShadow={shadows} receiveShadow>
        <boxGeometry args={[sx, sy, sz]} />
        <meshStandardMaterial
          color={facade}
          roughness={office ? 0.59 : 0.88}
          metalness={office ? 0.2 : 0.03}
        />
      </mesh>
      <CityInstances items={details.glass} roughness={0.24} metalness={0.68} />
      <CityInstances
        items={details.lit}
        color={night > 0.4 ? '#fff1d2' : '#a8c2bd'}
        emissive="#ffc785"
        emissiveIntensity={night * 1.25 + 0.025}
        roughness={0.28}
        metalness={0.36}
      />
      <CityInstances
        items={details.trim}
        color={office ? '#bac6c1' : '#d3c9b5'}
      />
      <CityInstances items={details.balconies} castShadow={shadows} />
      {/* Raised cornice, recessed roof, mechanical room and photovoltaic array. */}
      <mesh position={[0, sy + 0.15, 0]} castShadow={shadows}>
        <boxGeometry args={[sx + 0.18, 0.19, sz + 0.18]} />
        <meshStandardMaterial
          color={snow ? '#e6e9e4' : '#d2cebc'}
          roughness={0.9}
        />
      </mesh>
      <mesh position={[0, sy + 0.26, 0]} receiveShadow>
        <boxGeometry args={[sx - 0.34, 0.065, sz - 0.34]} />
        <meshStandardMaterial
          color={snow ? '#f0f1e9' : '#787e77'}
          roughness={0.94}
        />
      </mesh>
      <mesh position={[sx * 0.18, sy + 0.51, sz * 0.24]} castShadow={shadows}>
        <boxGeometry args={[sx * 0.3, 0.45, sz * 0.27]} />
        <meshStandardMaterial
          color="#9da69e"
          metalness={0.35}
          roughness={0.6}
        />
      </mesh>
      <mesh
        position={[sx * 0.18, sy + 0.76, sz * 0.24]}
        rotation-x={Math.PI / 2}
      >
        <torusGeometry args={[Math.min(sx, sz) * 0.07, 0.035, 4, 14]} />
        <meshStandardMaterial color="#596661" roughness={0.6} />
      </mesh>
      {!snow && (
        <CityInstances
          items={details.solar}
          roughness={0.23}
          metalness={0.75}
        />
      )}
      {/* Street-level entrance canopy and a softly illuminated lobby. */}
      <mesh position={[0, 0.62, sz / 2 + 0.025]}>
        <boxGeometry args={[Math.min(1.35, sx * 0.4), 1.02, 0.045]} />
        <meshStandardMaterial
          color="#38535a"
          roughness={0.16}
          metalness={0.5}
          emissive="#eac490"
          emissiveIntensity={night * 0.4}
        />
      </mesh>
      <mesh position={[0, 1.25, sz / 2 + 0.31]} castShadow={shadows}>
        <boxGeometry args={[Math.min(2.1, sx * 0.6), 0.1, 0.85]} />
        <meshStandardMaterial
          color={building.type === 'food' ? '#b97853' : '#d7d0ba'}
          roughness={0.7}
        />
      </mesh>
      {building.id === 'tech-tower' && (
        <mesh position={[0, sy + 1.3, 0]}>
          <cylinderGeometry args={[0.028, 0.07, 2.1, 6]} />
          <meshStandardMaterial
            color="#b6c6c5"
            metalness={0.8}
            roughness={0.25}
          />
        </mesh>
      )}
      {building.type === 'healthcare' && (
        <group position={[-sx * 0.2, sy + 0.82, sz * 0.24]}>
          <mesh>
            <boxGeometry args={[0.55, 0.13, 0.08]} />
            <meshStandardMaterial
              color="#faf4e5"
              emissive="#ffbfb0"
              emissiveIntensity={night * 0.6}
            />
          </mesh>
          <mesh>
            <boxGeometry args={[0.13, 0.55, 0.08]} />
            <meshStandardMaterial
              color="#faf4e5"
              emissive="#ffbfb0"
              emissiveIntensity={night * 0.6}
            />
          </mesh>
        </group>
      )}
      {building.id === 'bus' && (
        <mesh position={[0, sy - 0.25, sz / 2 + 0.04]}>
          <boxGeometry args={[sx * 0.8, 0.12, 0.06]} />
          <meshStandardMaterial
            color="#88bd9d"
            emissive="#6cc7a0"
            emissiveIntensity={0.4 + night}
          />
        </mesh>
      )}
    </group>
  )
})

function UrbanPark({ size: [sx, , sz] }: { size: [number, number, number] }) {
  return (
    <group>
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[sx, 0.12, sz]} />
        <meshStandardMaterial color="#819477" roughness={1} />
      </mesh>
      <mesh position={[0, 0.13, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[2.2, 48]} />
        <meshStandardMaterial color="#c9c3ad" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[1.2, 1.3, 0.32, 40]} />
        <meshStandardMaterial color="#c6c5b7" />
      </mesh>
      <mesh position={[0, 0.45, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[1.07, 40]} />
        <meshStandardMaterial
          color="#60969a"
          metalness={0.4}
          roughness={0.13}
        />
      </mesh>
      <mesh position={[0, 0.67, 0]}>
        <cylinderGeometry args={[0.17, 0.23, 0.52, 12]} />
        <meshStandardMaterial color="#cecbb9" />
      </mesh>
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <group key={`${x}-${z}`} position={[x * sx * 0.35, 0, z * sz * 0.35]}>
            <mesh position={[0, 0.55, 0]} castShadow>
              <cylinderGeometry args={[0.065, 0.1, 1.1, 6]} />
              <meshStandardMaterial color="#78604c" />
            </mesh>
            <mesh position={[0, 1.5, 0]} scale={[0.8, 1.1, 0.8]} castShadow>
              <icosahedronGeometry args={[1, 1]} />
              <meshStandardMaterial color="#759365" roughness={0.9} />
            </mesh>
          </group>
        )),
      )}
    </group>
  )
}
