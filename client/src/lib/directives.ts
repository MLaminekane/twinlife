import type { Directive, Building, Person, Settings, Environment, NewsItem } from '../state/store'
import { randomName, findNonOverlappingPosition, overlapsXZ } from './helpers'
import { normalizeEnvironment } from '../state/environmentLogic'
import { initPeople } from '../config/initialData'
import { saveState } from './persistence'
import { computeDefaultEntrance, sampleInsideBuilding, worldToGeo } from './world'

interface DirectiveContext {
    buildings: Building[]
    people: Person[]
    settings: Settings
    environment: Environment
    effects: any[]
    news: NewsItem[]
    buildingEvents: Record<string, { text: string; type: 'urgent' | 'info' | 'sale'; time?: string }[]>
}

export function applyDirective(
    directive: Directive,
    context: DirectiveContext,
    _get: () => any
): Partial<DirectiveContext> {
    const { buildings: stateBuildings, people: statePeople, settings: stateSettings, environment, news: originalNews, effects: stateEffects, buildingEvents: stateBuildingEvents } = context

    const people = statePeople.map(person => ({ ...person, state: { ...person.state, history: [...person.state.history] } }))
    const stateNews = [...originalNews]

    const pushNews = (item: Omit<NewsItem, 'id' | 'ts'>) => {
        const id = stateNews.length ? stateNews[stateNews.length - 1].id + 1 : 1
        const next = [...stateNews, { ...item, id, ts: Date.now() }]
        stateNews.length = 0
        stateNews.push(...next.slice(Math.max(0, next.length - 50)))
    }

    let buildings = stateBuildings.map(b => ({ ...b }))
    const settings = { ...stateSettings, visibleBuildings: new Set(stateSettings.visibleBuildings) }
    let envOut = environment
    const buildingEvents = { ...stateBuildingEvents }

    // Événements de bâtiments
    if (directive.buildingEvents) {
        directive.buildingEvents.forEach(evt => {
            const b = buildings.find(x => x.name.toLowerCase().includes(evt.buildingName.toLowerCase()))
            if (b) {
                const current = buildingEvents[b.id] || []
                const newEvents = evt.events.map(e => ({ ...e, time: e.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }))
                buildingEvents[b.id] = [...newEvents, ...current].slice(0, 20)
                pushNews({ kind: 'activity', text: `📢 Nouveaux événements pour ${b.name}` })
            }
        })
    }

    // Changements d'activité des bâtiments
    if (directive.buildingActivityChanges) {
        directive.buildingActivityChanges.forEach(change => {
            const b = buildings.find(x => x.name.toLowerCase().includes(change.buildingName.toLowerCase()))
            if (b) b.activity = Math.max(0, Math.min(1, b.activity + change.activityDelta))
        })
    }

    // Contrôles de vitesse globale
    if (directive.global?.speedMultiplier) {
        settings.speed = Math.max(0.1, Math.min(5, settings.speed * directive.global.speedMultiplier))
    }
    if (typeof directive.global?.speedSet === 'number') {
        settings.speed = Math.max(0.1, Math.min(5, directive.global.speedSet))
    }

    // Flux de personnes
    if (directive.personFlows) {
        const assigned = new Set<number>()
        directive.personFlows.forEach(flow => {
            const target = buildings.find(building => building.id === flow.to || building.name.toLowerCase().includes(flow.to.toLowerCase()))
            if (!target) return
            const source = flow.from ? buildings.find(building => building.id === flow.from || building.name.toLowerCase().includes(flow.from!.toLowerCase())) : undefined
            if (flow.from && !source) return
            const candidates = people.filter(person => !assigned.has(person.id) && person.currentBuildingId !== target.id && (!source || person.currentBuildingId === source.id))
            for (const person of candidates.slice(0, Math.max(0, Math.floor(flow.count)))) {
                person.targetBuildingId = target.id
                person.route = []
                person.routeIndex = 0
                person.state = { ...person.state, currentActivity: 'commuting', talkingWith: undefined, commandRemaining: 120, scheduledTask: undefined }
                assigned.add(person.id)
            }
        })
    }

    // Définir l'activité absolue
    if (directive.buildingActivitySet) {
        directive.buildingActivitySet.forEach(s => {
            const b = buildings.find(x => x.name.toLowerCase().includes(s.buildingName.toLowerCase()))
            if (b) b.activity = Math.max(0, Math.min(1, s.level))
        })
    }

    // Effets temporisés
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

    // Ajouter des bâtiments
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
            buildings.push({ 
                id, 
                name: add.name, 
                position: [pos[0], 2, pos[2]], 
                size, 
                activity: add.activity ?? 0.5, 
                occupancy: 0,
                capacity: add.capacity ?? Math.round(size[0] * size[2] * 6),
                zone: add.zone ?? 'commercial',
                type: add.type ?? 'office',
                entrances: [computeDefaultEntrance([pos[0], 2, pos[2]], size, add.zone ?? 'commercial')],
                geoPosition: worldToGeo([pos[0], 2, pos[2]]),
                isCustom: true
            })
            settings.visibleBuildings.add(id)
            pushNews({ kind: 'building', text: `🏗️ Nouveau bâtiment: ${add.name}` })
        })
    }

    // Supprimer des bâtiments
    if (directive.buildingRemove) {
        directive.buildingRemove.forEach(idOrName => {
            const index = buildings.findIndex(b => 
                b.id === idOrName || 
                b.name.toLowerCase().includes(idOrName.toLowerCase())
            )
            if (index !== -1 && buildings.length > 1) {
                const removed = buildings[index]
                buildings.splice(index, 1)
                settings.visibleBuildings.delete(removed.id)
                // Réaffecter les personnes qui étaient dans ce bâtiment
                people.forEach(p => {
                    if (p.targetBuildingId === removed.id || p.workplace === removed.id || p.currentBuildingId === removed.id || p.homeBuildingId === removed.id || p.schedule.some(task => task.targetId === removed.id)) {
                        const newTarget = buildings[Math.floor(Math.random() * buildings.length)]
                        p.targetBuildingId = newTarget.id
                        p.route = []
                        p.routeIndex = 0
                        if (p.homeBuildingId === removed.id) p.homeBuildingId = newTarget.id
                        p.schedule = p.schedule.map(task => task.targetId === removed.id ? { ...task, targetId: newTarget.id } : task)
                        if (p.currentBuildingId === removed.id) {
                            p.currentBuildingId = newTarget.id
                            p.position = sampleInsideBuilding(newTarget, p.id)
                            p.presence = 'inside'
                            p.route = []
                            p.routeIndex = 0
                        }
                        if (p.workplace === removed.id) {
                            p.workplace = newTarget.id
                        }
                    }
                })
                pushNews({ kind: 'building', text: `🗑️ Bâtiment supprimé: ${removed.name}` })
            }
        })
    }

    // Ajouter des personnes
    if (directive.peopleAdd) {
        directive.peopleAdd.forEach(add => {
            const startIndex = people.length ? Math.max(...people.map(p => p.id)) + 1 : 0
            const target = add.to ? buildings.find(x => x.name.toLowerCase().includes(add.to!.toLowerCase())) : undefined
            const workplace = add.workplace ? buildings.find(x => x.name.toLowerCase().includes(add.workplace!.toLowerCase())) : undefined
            
            for (let i = 0; i < add.count; i++) {
                const id = startIndex + i
                const b = target ?? buildings[Math.floor(Math.random() * buildings.length)]
                const pos = sampleInsideBuilding(b, id + 1)
                people.push({ 
                    id, 
                    position: pos, 
                    targetBuildingId: b.id, 
                    currentBuildingId: b.id,
                    homeBuildingId: b.id,
                    speed: 0.8 + Math.random() * 0.6, 
                    heading: Math.random() * Math.PI * 2,
                    presence: 'inside',
                    isCustom: true,
                    gender: add.gender, 
                    name: add.name || randomName(Math.random),
                    role: add.role,
                    workplace: workplace?.id,
                    department: add.department,
                    customData: add.customData,
                    traits: { introversion: Math.random(), punctuality: Math.random(), energy: 1 },
                    schedule: add.role === 'student' 
                        ? [{ time: 8, activity: 'study', targetId: workplace?.id }, { time: 22, activity: 'sleep' }]
                        : [{ time: 9, activity: 'work', targetId: workplace?.id }, { time: 18, activity: 'leisure' }, { time: 23, activity: 'sleep' }],
                    state: { currentActivity: 'idle', mood: 'neutral', history: [] }
                })
            }
            const personName = add.name || `${add.count} personne${add.count > 1 ? 's' : ''}`
            const roleText = add.role ? ` (${add.role})` : ''
            const workplaceText = workplace ? ` travaillant à ${workplace.name}` : ''
            pushNews({ kind: 'people', text: `➕ ${personName}${roleText} ajouté${add.count > 1 ? 's' : ''}${workplaceText}${target && !workplace ? ` vers ${target.name}` : ''}` })
        })
    }

    // Supprimer des personnes
    if (directive.peopleRemove) {
        directive.peopleRemove.forEach(remove => {
            if (remove.all) {
                const count = people.length
                people.length = 0
                pushNews({ kind: 'people', text: `🗑️ Toutes les personnes supprimées (${count})` })
            } else if (remove.name) {
                const index = people.findIndex(p => 
                    p.name.toLowerCase().includes(remove.name!.toLowerCase())
                )
                if (index !== -1) {
                    const removed = people.splice(index, 1)[0]
                    pushNews({ kind: 'people', text: `🗑️ ${removed.name} supprimé` })
                }
            } else if (typeof remove.id === 'number') {
                const index = people.findIndex(p => p.id === remove.id)
                if (index !== -1) {
                    const removed = people.splice(index, 1)[0]
                    pushNews({ kind: 'people', text: `🗑️ ${removed.name} supprimé` })
                }
            }
        })
    }

    // Contrôles de visibilité
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

    // Paramètres d'interface
    if (directive.settings) {
        if (typeof directive.settings.glow === 'boolean') settings.glow = directive.settings.glow
        if (typeof directive.settings.shadows === 'boolean') settings.shadows = directive.settings.shadows
        if (typeof directive.settings.labels === 'boolean') settings.labels = directive.settings.labels
    }

    // Environnement
    if (directive.environment) {
        envOut = normalizeEnvironment(environment, directive.environment)
    }

    // Réinitialiser aléatoirement
    if (directive.global?.resetRandom) {
        const newBuildings = buildings.map(b => ({ ...b, activity: 0.2 + Math.random() * 0.6, occupancy: 0 }))
        const newPeople = initPeople(people.length, newBuildings)
        return { buildings: newBuildings, people: newPeople, settings, effects: effectsOut, environment: envOut, buildingEvents, news: stateNews }
    }

    // Sauvegarder l'état après modifications
    if (directive.buildingAdd || directive.peopleAdd || directive.buildingRemove || directive.peopleRemove) {
        saveState(buildings, people)
    }

    return { buildings, people, settings, effects: effectsOut, environment: envOut, buildingEvents, news: stateNews }
}
