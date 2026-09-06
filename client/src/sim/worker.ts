import { tickSimulation, applyEnvironmentEffects } from './simulation'
import type { Building, Person, Environment } from '../state/store'

interface WorkerState {
    buildings: Building[]
    people: Person[]
    environment: Environment
}

let state: WorkerState = {
    buildings: [],
    people: [],
    environment: { season: 'automne', dayPeriod: 'apresmidi', weekend: false, gameTime: 14 }
}

self.onmessage = (e: MessageEvent) => {
    const { type, payload } = e.data

    switch (type) {
        case 'init':
            state = {
                buildings: payload.buildings,
                people: payload.people,
                environment: payload.environment
            }
            self.postMessage({ type: 'ready' })
            break

        case 'tick':
            const { dt, speed, environment } = payload

            if (environment) {
                state.environment = environment
            }

            state.buildings = applyEnvironmentEffects(state.buildings, state.environment, dt)

            const result = tickSimulation(
                { ...state, dt },
                speed
            )

            state.buildings = result.buildings
            state.people = result.people

            self.postMessage({
                type: 'tick_result',
                payload: {
                    buildings: state.buildings,
                    people: state.people
                }
            })
            break

        case 'update_state':
            if (payload.buildings) state.buildings = payload.buildings
            if (payload.people) state.people = payload.people
            if (payload.environment) state.environment = payload.environment
            self.postMessage({ type: 'state_updated' })
            break

        case 'get_state':
            self.postMessage({
                type: 'state',
                payload: {
                    buildings: state.buildings,
                    people: state.people,
                    environment: state.environment
                }
            })
            break

        default:
            console.warn('Type de message worker inconnu:', type)
    }
}

self.postMessage({ type: 'worker_ready' })
