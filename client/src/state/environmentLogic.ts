import type { Building, Environment } from './types'

export function computeEnvActivityTarget(b: Building, env: Environment): number {
  const id = b.id
  let base = 0.5
  
  // Time of day influences
  switch (env.dayPeriod) {
    case 'matin':
      if (id === 'lib') base += 0.05
      if (id === 'adm') base += 0.1
      break
    case 'midi':
    case 'apresmidi':
      if (id === 'sci' || id === 'eng' || id === 'bus' || id === 'law' || id === 'med') base += 0.15
      break
    case 'soir':
      if (id === 'lib' || id === 'art') base += 0.2
      if (id === 'adm') base -= 0.1
      break
    case 'nuit':
      if (id === 'lib') base += 0.1
      if (id === 'adm') base -= 0.2
      base -= 0.15
      break
  }
  
  // Weekend effect
  if (env.weekend) {
    if (id === 'adm' || id === 'bus' || id === 'law') base -= 0.2
    if (id === 'lib' || id === 'art') base += 0.15
  }
  
  // Season influences
  switch (env.season) {
    case 'hiver':
      if (id === 'lib') base += 0.15
      if (id === 'art') base -= 0.05
      break
    case 'ete':
      if (id === 'art') base += 0.1
      break
    case 'printemps':
      if (id === 'sci' || id === 'eng') base += 0.05
      break
    case 'automne':
      if (id === 'bus' || id === 'law') base += 0.05
      break
  }
  
  return Math.max(0, Math.min(1, base))
}

export function computeTargetPopulation(env: Environment, basePop: number = 500): number {
  let factor = 1
  if (env.dayPeriod === 'nuit') factor *= 0.85
  if (env.weekend) factor *= 0.9
  if (env.season === 'hiver') factor *= 0.95
  return Math.max(100, Math.round(basePop * factor))
}
