/**
 * Web Worker for offloading simulation calculations
 * Keeps the main thread free for rendering
 */

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
    environment: { season: 'automne', dayPeriod: 'apresmidi', weekend: false }
}

// Handle messages from main thread
self.onmessage = (e: MessageEvent) => {
    const { type, payload } = e.data

    switch (type) {
        case 'init':
            // Initialize worker state
            state = {
                buildings: payload.buildings,
                people: payload.people,
                environment: payload.environment
            }
            self.postMessage({ type: 'ready' })
            break

        case 'tick':
            // Run simulation tick
            const { dt, speed, environment } = payload

            // Update environment if provided
            if (environment) {
                state.environment = environment
            }

            // Apply environment effects to buildings
            state.buildings = applyEnvironmentEffects(state.buildings, state.environment, dt)

            // Tick simulation (move people, update occupancy)
            const result = tickSimulation(
                { ...state, dt },
                speed
            )

            state.buildings = result.buildings
            state.people = result.people

            // Send results back to main thread
            self.postMessage({
                type: 'tick_result',
                payload: {
                    buildings: state.buildings,
                    people: state.people
                }
            })
            break

        case 'update_state':
            // Update specific parts of state (e.g., after directive)
            if (payload.buildings) state.buildings = payload.buildings
            if (payload.people) state.people = payload.people
            if (payload.environment) state.environment = payload.environment
            self.postMessage({ type: 'state_updated' })
            break

        case 'get_state':
            // Return current state
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
            console.warn('Unknown worker message type:', type)
    }
}

// Signal that worker is ready
self.postMessage({ type: 'worker_ready' })
