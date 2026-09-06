import type { Person, Building, Environment } from '../state/types'
import { isBuildingOpen } from '../state/environmentLogic'

/** Called with a person owned by the current simulation snapshot. */
export function updateAgentBehavior(
  person: Person,
  time: number,
  buildings: Building[],
  env: Environment,
  dt = 1 / 60,
): { targetId?: string; mood?: Person['state']['mood'] } {
  if (!buildings.length) return {}
  const sleeping = person.state.currentActivity === 'sleep' && person.presence === 'inside'
  person.traits.energy = Math.max(0, Math.min(1, person.traits.energy + dt * (sleeping ? 0.006 : person.presence === 'walking' ? -0.0015 : -0.0005)))

  const currentBuilding = buildings.find(building => building.id === person.currentBuildingId)
  const crowded = currentBuilding && currentBuilding.occupancy / Math.max(1, currentBuilding.capacity) > 0.8
  let mood: Person['state']['mood'] = person.traits.energy < 0.25 ? 'tired' : crowded && person.traits.introversion > 0.65 ? 'stressed' : 'neutral'
  if (env.condition === 'snow' && person.presence === 'walking') mood = 'stressed'
  else if (person.state.currentActivity === 'leisure' && person.traits.energy > 0.5) mood = 'happy'

  if ((person.state.commandRemaining ?? 0) > 0) {
    person.state.commandRemaining = Math.max(0, person.state.commandRemaining! - dt)
    return { mood }
  }

  // Use the latest task before the current hour; the final task continues after midnight.
  // A stable, personal delay makes punctuality meaningful without per-frame randomness.
  const delay = (1 - person.traits.punctuality) * 0.35
  const personalTime = (time - delay + 24) % 24
  const ordered = [...person.schedule].sort((left, right) => left.time - right.time)
  const task = [...ordered].reverse().find(candidate => candidate.time <= personalTime) ?? ordered[ordered.length - 1]
  if (!task) return { mood }
  const key = `${task.time}:${task.activity}:${task.targetId ?? ''}`
  if (person.state.scheduledTask === key && person.state.currentActivity !== 'idle') return { mood }

  person.state.scheduledTask = key
  let activity = task.activity
  let targetId = task.targetId
  if (activity === 'sleep') targetId = person.homeBuildingId ?? targetId
  else if (activity === 'leisure') targetId ??= chooseLeisureLocation(person, buildings, env)
  else if (activity === 'eat') targetId = chooseDestination(person, buildings.filter(building => building.type === 'food' && isBuildingOpen(building, time)))
  else targetId ??= person.workplace

  // Closed offices and schools send residents home. Emergency services stay open.
  const destination = buildings.find(building => building.id === targetId)
  if (destination && !isBuildingOpen(destination, time)) {
    targetId = person.homeBuildingId
    activity = 'leisure'
  }
  person.state.currentActivity = activity
  if (targetId && buildings.some(building => building.id === targetId)) {
    person.state.history = [...person.state.history.filter(id => id !== targetId), targetId].slice(-5)
    return { targetId, mood }
  }
  return { mood }
}

function chooseDestination(person: Person, buildings: Building[]): string | undefined {
  if (!buildings.length) return person.homeBuildingId
  const ranked = [...buildings].sort((left, right) => {
    const score = (building: Building) => {
      const distance = Math.hypot(building.position[0] - person.position[0], building.position[2] - person.position[2])
      return distance * 0.015 + (building.occupancy / Math.max(1, building.capacity)) * person.traits.introversion - building.activity * (1 - person.traits.introversion)
    }
    return score(left) - score(right)
  })
  // Stable variety avoids every citizen picking the same destination.
  return ranked[person.id % Math.min(3, ranked.length)].id
}

function chooseLeisureLocation(person: Person, buildings: Building[], env: Environment): string | undefined {
  if (person.traits.energy < 0.3 || env.activeScenario === 'storm') return person.homeBuildingId
  const pleasantWeather = env.condition !== 'snow' && env.condition !== 'rain' && (env.temperature ?? 18) > 5
  const candidates = buildings.filter(building => isBuildingOpen(building, env.gameTime) && (
    person.traits.introversion > 0.6
      ? building.id === 'lib' || (building.type === 'park' && pleasantWeather)
      : ['entertainment', 'food', 'fitness'].includes(building.type) || (building.type === 'park' && pleasantWeather)
  ))
  return chooseDestination(person, candidates)
}
