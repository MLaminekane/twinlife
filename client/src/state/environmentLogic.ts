import type { Building, Environment } from './types'

export function dayPeriodForTime(time: number): Environment['dayPeriod'] {
  const hour = ((time % 24) + 24) % 24
  if (hour >= 5 && hour < 11) return 'matin'
  if (hour >= 11 && hour < 14) return 'midi'
  if (hour >= 14 && hour < 18) return 'apresmidi'
  if (hour >= 18 && hour < 22) return 'soir'
  return 'nuit'
}

export const periodStart: Record<Environment['dayPeriod'], number> = {
  matin: 8, midi: 12, apresmidi: 15, soir: 19, nuit: 23,
}

export function normalizeEnvironment(env: Environment, patch: Partial<Environment>): Environment {
  const gameTime = Number.isFinite(patch.gameTime)
    ? ((patch.gameTime! % 24) + 24) % 24
    : patch.dayPeriod ? periodStart[patch.dayPeriod] : env.gameTime
  return { ...env, ...patch, gameTime, dayPeriod: dayPeriodForTime(gameTime) }
}

export function isBuildingOpen(building: Building, time: number): boolean {
  const hours = building.openingHours
  if (!hours || hours.open === hours.close || (hours.open === 0 && hours.close === 24)) return true
  return hours.open < hours.close
    ? time >= hours.open && time < hours.close
    : time >= hours.open || time < hours.close
}

/** Relative activity model; values describe this simulated city, not measured demand. */
export function computeEnvActivityTarget(building: Building, env: Environment): number {
  const period = dayPeriodForTime(env.gameTime)
  const night = period === 'nuit'
  const evening = period === 'soir'
  let target = 0.5
  switch (building.type) {
    case 'residence': target = night ? 0.8 : evening ? 0.65 : 0.28; break
    case 'academic':
    case 'research': target = night ? 0.07 : evening ? 0.25 : env.weekend ? 0.32 : 0.78; break
    case 'office':
    case 'administration': target = night ? 0.06 : evening ? 0.2 : env.weekend ? 0.2 : 0.82; break
    case 'food': target = period === 'midi' || evening ? 0.92 : night ? 0.1 : 0.52; break
    case 'entertainment': target = evening ? 0.9 : night ? 0.2 : 0.48; break
    case 'retail': target = night ? 0.06 : env.weekend ? 0.84 : 0.65; break
    case 'fitness': target = evening || period === 'matin' ? 0.76 : night ? 0.08 : 0.4; break
    case 'healthcare': target = night ? 0.48 : 0.73; break
    case 'civic': target = night ? 0.15 : 0.5; break
    case 'park': target = night ? 0.04 : env.weekend ? 0.72 : 0.46; break
  }
  if (!isBuildingOpen(building, env.gameTime)) target *= 0.15
  if (env.condition === 'snow' || env.condition === 'rain') {
    target *= building.type === 'park' ? 0.15 : building.type === 'residence' ? 1.12 : 0.94
  }
  if (env.activeScenario === 'festival' && ['food', 'park', 'entertainment', 'retail'].includes(building.type)) target = Math.max(target, 0.88)
  if (env.activeScenario === 'storm') {
    if (building.type === 'healthcare') target = 0.98
    else if (building.type === 'residence') target = 0.85
    else target *= 0.55
  }
  return Math.max(0, Math.min(1, target))
}

export function computeTargetPopulation(env: Environment, basePop = 500): number {
  let factor = env.populationFactor ?? 1
  if (dayPeriodForTime(env.gameTime) === 'nuit') factor *= 0.85
  if (env.weekend) factor *= 0.9
  if (env.season === 'hiver') factor *= 0.95
  return Math.max(100, Math.round(basePop * factor))
}

/** Poisson probability prevents events depending on the rendering frame rate. */
export function eventProbability(ratePerSecond: number, dt: number): number {
  return 1 - Math.exp(-Math.max(0, ratePerSecond) * Math.max(0, dt))
}
