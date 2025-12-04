import type { Building, Person } from '../state/store'
import { seededRandom, randomName } from '../lib/helpers'

export const initialBuildings: Building[] = [
    // === QUADRANT NW (HAUT-GAUCHE) : CAMPUS UNIVERSITAIRE - VERT ===
    { id: 'sci', name: 'Sciences', position: [-22, 2, 15], size: [5, 5, 6], activity: 0.5, occupancy: 0 },
    { id: 'eng', name: 'Ingénierie', position: [-12, 2, 15], size: [5, 5, 5], activity: 0.5, occupancy: 0 },
    { id: 'med', name: 'Médecine', position: [-22, 2, 7], size: [6, 5, 5], activity: 0.5, occupancy: 0 },
    { id: 'bus', name: 'Économie', position: [-12, 2, 7], size: [5, 5, 5], activity: 0.5, occupancy: 0 },
    { id: 'art', name: 'Arts', position: [-28, 2, 11], size: [4, 4, 5], activity: 0.5, occupancy: 0 },
    { id: 'law', name: 'Droit', position: [-6, 2, 11], size: [4.5, 4.5, 4], activity: 0.5, occupancy: 0 },
    { id: 'lib', name: 'Bibliothèque', position: [-17, 2, 22], size: [6, 5, 5], activity: 0.5, occupancy: 0 },
    { id: 'gym', name: 'Gymnase', position: [-22, 2, 25], size: [7, 4, 5], activity: 0.45, occupancy: 0 },
    { id: 'cafe', name: 'Cafétéria', position: [-12, 2, 25], size: [5, 3, 6], activity: 0.6, occupancy: 0 },
    
    // === QUADRANT NE (HAUT-DROITE) : CENTRE-VILLE & ENTREPRISES - BLEU ===
    { id: 'tech-tower', name: 'Tour Tech', position: [8, 3, 15], size: [5, 8, 5], activity: 0.6, occupancy: 0 },
    { id: 'corp-hq', name: 'Siège Social', position: [18, 3, 15], size: [6, 7, 6], activity: 0.55, occupancy: 0 },
    { id: 'startup-hub', name: 'Hub Startups', position: [8, 2, 7], size: [5, 4, 5], activity: 0.5, occupancy: 0 },
    { id: 'bank', name: 'Banque', position: [18, 2, 7], size: [5, 5, 4], activity: 0.5, occupancy: 0 },
    { id: 'city-hall', name: 'Mairie', position: [13, 2, 22], size: [7, 5, 5], activity: 0.45, occupancy: 0 },
    { id: 'office-park', name: 'Parc de Bureaux', position: [25, 2, 11], size: [6, 5, 6], activity: 0.5, occupancy: 0 },
    { id: 'hospital', name: 'Hôpital', position: [5, 2, 25], size: [7, 6, 7], activity: 0.7, occupancy: 0 },
    { id: 'police', name: 'Commissariat', position: [20, 2, 25], size: [5, 4, 5], activity: 0.5, occupancy: 0 },
    
    // === QUADRANT SW (BAS-GAUCHE) : QUARTIER RÉSIDENTIEL - MARRON/ORANGE ===
    { id: 'res-tower-a', name: 'Tour Résidentielle A', position: [-22, 3, -8], size: [5, 6, 5], activity: 0.4, occupancy: 0 },
    { id: 'res-tower-b', name: 'Tour Résidentielle B', position: [-12, 3, -8], size: [5, 6, 5], activity: 0.4, occupancy: 0 },
    { id: 'res-tower-c', name: 'Tour Résidentielle C', position: [-22, 3, -16], size: [5, 6, 5], activity: 0.4, occupancy: 0 },
    { id: 'res-tower-d', name: 'Tour Résidentielle D', position: [-12, 3, -16], size: [5, 6, 5], activity: 0.4, occupancy: 0 },
    { id: 'res-family', name: 'Logements Familiaux', position: [-28, 2, -12], size: [6, 4, 7], activity: 0.35, occupancy: 0 },
    { id: 'res-student', name: 'Résidences Étudiantes', position: [-6, 2, -12], size: [5, 5, 6], activity: 0.5, occupancy: 0 },
    { id: 'park', name: 'Parc Public', position: [-17, 1, -23], size: [8, 1, 8], activity: 0.3, occupancy: 0 },
    { id: 'school', name: 'École Primaire', position: [-8, 2, -4], size: [6, 4, 5], activity: 0.5, occupancy: 0 },
    
    // === QUADRANT SE (BAS-DROITE) : ZONE COMMERCIALE - VIOLET/MAGENTA ===
    { id: 'mall', name: 'Centre Commercial', position: [13, 2, -8], size: [9, 4, 7], activity: 0.65, occupancy: 0 },
    { id: 'restaurant', name: 'Restaurants', position: [8, 2, -16], size: [6, 3, 6], activity: 0.7, occupancy: 0 },
    { id: 'cinema', name: 'Cinéma', position: [18, 2, -16], size: [7, 5, 5], activity: 0.6, occupancy: 0 },
    { id: 'supermarket', name: 'Supermarché', position: [25, 2, -8], size: [8, 4, 6], activity: 0.7, occupancy: 0 },
    { id: 'hotel', name: 'Hôtel', position: [5, 3, -4], size: [5, 7, 5], activity: 0.5, occupancy: 0 },
    { id: 'spa', name: 'Centre de Loisirs', position: [13, 2, -23], size: [6, 3, 5], activity: 0.45, occupancy: 0 },
    { id: 'market', name: 'Marché Public', position: [25, 2, -20], size: [7, 2, 7], activity: 0.6, occupancy: 0 }
]

export function initPeople(count: number, buildings: Building[]): Person[] {
    const rand = seededRandom(42)
    const arr: Person[] = []
    for (let i = 0; i < count; i++) {
        const b = buildings[Math.floor(rand() * buildings.length)]
        const pos: [number, number, number] = [
            b.position[0] + (rand() - 0.5) * b.size[0],
            0.1,
            b.position[2] + (rand() - 0.5) * b.size[2]
        ]
        arr.push({ id: i, position: pos, targetBuildingId: b.id, speed: 0.8 + rand() * 0.6, name: randomName(rand) })
    }
    return arr
}
