import type { Directive, Building, Person, Settings, Environment, NewsItem } from '../state/store'
import { seededRandom, randomName, findNonOverlappingPosition, overlapsXZ } from './helpers'
import { initPeople } from '../config/initialData'

interface DirectiveContext {
    buildings: Building[]
    people: Person[]
    settings: Settings
    environment: Environment
    effects: any[]
    news: NewsItem[]
}

export function applyDirective(
    directive: Directive,
    context: DirectiveContext,
    get: () => any
): Partial<DirectiveContext> {
    const { buildings: stateBuildings, people, settings: stateSettings, environment, news: stateNews, effects: stateEffects } = context

    const pushNews = (item: Omit<NewsItem, 'id' | 'ts'>) => {
        const id = stateNews.length ? stateNews[stateNews.length - 1].id + 1 : 1
        const next = [...stateNews, { ...item, id, ts: Date.now() }]
        stateNews.length = 0
        stateNews.push(...next.slice(Math.max(0, next.length - 50)))
    }

    let buildings = stateBuildings.map(b => ({ ...b }))
    const settings = { ...stateSettings }
    let envOut = environment

    // Building activity changes
    if (directive.buildingActivityChanges) {
        directive.buildingActivityChanges.forEach(change => {
            const b = buildings.find(x => x.name.toLowerCase().includes(change.buildingName.toLowerCase()))
            if (b) b.activity = Math.max(0, Math.min(1, b.activity + change.activityDelta))
        })
    }

    // Global speed controls
    if (directive.global?.speedMultiplier) {
        settings.speed = Math.max(0.1, Math.min(5, settings.speed * directive.global.speedMultiplier))
    }
    if (typeof directive.global?.speedSet === 'number') {
        settings.speed = Math.max(0.1, Math.min(5, directive.global.speedSet))
    }

    // Person flows
    if (directive.personFlows) {
        const rand = seededRandom(123)
        directive.personFlows.forEach(flow => {
            const target = buildings.find(x => x.name.toLowerCase().includes(flow.to.toLowerCase()))
            if (!target) return
            for (let i = 0; i < flow.count; i++) {
                const p = people[Math.floor(rand() * people.length)]
                p.targetBuildingId = target.id
            }
        })
    }

    // Set absolute activity
    if (directive.buildingActivitySet) {
        directive.buildingActivitySet.forEach(s => {
            const b = buildings.find(x => x.name.toLowerCase().includes(s.buildingName.toLowerCase()))
            if (b) b.activity = Math.max(0, Math.min(1, s.level))
        })
    }

    // Timed effects
    let effectsOut = stateEffects.slice()
    if (directive.effects) {
        directive.effects.forEach(e => {
            if (e.type === 'activitySpike') {
                const b = buildings.find(x => x.name.toLowerCase().includes(e.buildingName.toLowerCase()))
                if (b) {
                    b.activity = Math.max(0, Math.min(1, b.activity + e.delta))
                    effectsOut.push({ type: 'activityRevert', buildingId: b.id, delta: e.delta, remaining: e.durationSec })
                    pushNews({ kind: 'activity', text: `⚡ Pic d'activité sur ${b.name} (+${e.delta.toFixed(2)}) pendant ${e.durationSec}s` })
                }
            } else if (e.type === 'pause') {
                settings.running = false
                effectsOut.push({ type: 'pause', remaining: e.durationSec })
                pushNews({ kind: 'system', text: `⏸️ Pause de ${e.durationSec}s` })
            }
        })
    }

    // Add buildings
    if (directive.buildingAdd) {
        directive.buildingAdd.forEach(add => {
            const id = add.name.toLowerCase().replace(/\s+/g, '-').slice(0, 12) + '-' + Math.floor(Math.random() * 1000)
            const size: [number, number, number] = add.size ?? [4 + Math.random() * 2, 4, 4 + Math.random() * 2]
            const desired: [number, number, number] | undefined = add.position ? [add.position[0], 2, add.position[2]] : undefined
            let pos: [number, number, number]
            if (desired) {
                const overlaps = buildings.some(b => overlapsXZ(desired, size, b.position, b.size))
                pos = overlaps ? findNonOverlappingPosition(size, buildings) : desired
            } else {
                pos = findNonOverlappingPosition(size, buildings)
            }
            buildings.push({ id, name: add.name, position: [pos[0], 2, pos[2]], size, activity: 0.5, occupancy: 0 })
            settings.visibleBuildings.add(id)
            pushNews({ kind: 'building', text: `🏗️ Nouveau bâtiment: ${add.name}` })
        })
    }

    // Add people
    if (directive.peopleAdd) {
        directive.peopleAdd.forEach(add => {
            const startIndex = people.length
            const target = add.to ? buildings.find(x => x.name.toLowerCase().includes(add.to!.toLowerCase())) : undefined
            for (let i = 0; i < add.count; i++) {
                const id = startIndex + i
                const b = target ?? buildings[Math.floor(Math.random() * buildings.length)]
                const pos: [number, number, number] = [
                    b.position[0] + (Math.random() - 0.5) * b.size[0],
                    0.1,
                    b.position[2] + (Math.random() - 0.5) * b.size[2]
                ]
                people.push({ id, position: pos, targetBuildingId: b.id, speed: 0.8 + Math.random() * 0.6, gender: add.gender, name: randomName(Math.random) })
            }
            pushNews({ kind: 'people', text: `➕ ${add.count} personnes ajoutées${target ? ` vers ${target.name}` : ''}` })
        })
    }

    // Visibility controls
    if (directive.visibility) {
        const vb = new Set(settings.visibleBuildings)
        const byName = (name: string) => buildings.find(x => x.name.toLowerCase().includes(name.toLowerCase()))?.id
        if (directive.visibility.showAll) {
            settings.visibleBuildings = new Set(buildings.map(b => b.id))
        }
        if (directive.visibility.hide?.length) {
            for (const n of directive.visibility.hide) {
                const id = byName(n); if (id) vb.delete(id)
            }
            settings.visibleBuildings = vb
        }
        if (directive.visibility.showOnly?.length) {
            const set = new Set<string>()
            for (const n of directive.visibility.showOnly) {
                const id = byName(n); if (id) set.add(id)
            }
            if (set.size > 0) settings.visibleBuildings = set
        }
    }

    // UI settings
    if (directive.settings) {
        if (typeof directive.settings.glow === 'boolean') settings.glow = directive.settings.glow
        if (typeof directive.settings.shadows === 'boolean') settings.shadows = directive.settings.shadows
        if (typeof directive.settings.labels === 'boolean') settings.labels = directive.settings.labels
    }

    // Environment
    if (directive.environment) {
        envOut = { ...get().environment, ...directive.environment }
    }

    // Reset random
    if (directive.global?.resetRandom) {
        const newBuildings = buildings.map(b => ({ ...b, activity: 0.2 + Math.random() * 0.6, occupancy: 0 }))
        const newPeople = initPeople(people.length, newBuildings)
        return { buildings: newBuildings, people: newPeople, settings, effects: effectsOut, environment: envOut }
    }

    return { buildings, settings, effects: effectsOut, environment: envOut }
}
