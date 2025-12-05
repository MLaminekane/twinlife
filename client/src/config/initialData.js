import { seededRandom, randomName } from '../lib/helpers';
export const initialBuildings = [
    // === QUADRANT NW (HAUT-GAUCHE) : CAMPUS UNIVERSITAIRE - VERT ===
    { id: 'sci', name: 'Sciences', position: [-22, 2, 15], size: [5, 5, 6], activity: 0.5, occupancy: 0 },
    { id: 'eng', name: 'Ingénierie', position: [-12, 2, 15], size: [5, 5, 5], activity: 0.5, occupancy: 0 },
    { id: 'med', name: 'Médecine', position: [-22, 2, 7], size: [6, 5, 5], activity: 0.5, occupancy: 0 },
    { id: 'bus', name: 'Économie', position: [-12, 2, 7], size: [5, 5, 5], activity: 0.9, occupancy: 0 },
    { id: 'art', name: 'Arts', position: [-28, 2, 11], size: [4, 4, 5], activity: 0.5, occupancy: 0 },
    { id: 'law', name: 'Droit', position: [-10, 2, 32], size: [4.5, 4.5, 4], activity: 0.5, occupancy: 0 },
    { id: 'lib', name: 'Bibliothèque', position: [-18, 2, 22], size: [6, 5, 5], activity: 0.5, occupancy: 0 },
    { id: 'gym', name: 'Gymnase', position: [-25, 2, 25], size: [7, 4, 5], activity: 0.45, occupancy: 0 },
    { id: 'cafe', name: 'Cafétéria', position: [-12, 2, 25], size: [5, 3, 6], activity: 0.6, occupancy: 0 },
    // === QUADRANT NE (HAUT-DROITE) : CENTRE-VILLE & ENTREPRISES - BLEU ===
    { id: 'tech-tower', name: 'Tour Tech', position: [8, 3, 15], size: [5, 8, 5], activity: 0.6, occupancy: 0 },
    { id: 'corp-hq', name: 'Siège Social', position: [20, 3, 20], size: [6, 7, 6], activity: 0.55, occupancy: 0 },
    { id: 'startup-hub', name: 'Hub Startups', position: [8, 2, 7], size: [5, 4, 5], activity: 0.5, occupancy: 0 },
    { id: 'bank', name: 'Banque', position: [19, 2, 7], size: [5, 5, 4], activity: 0.5, occupancy: 0 },
    { id: 'city-hall', name: 'Mairie', position: [20, 2, 32], size: [7, 5, 5], activity: 0.45, occupancy: 0 },
    { id: 'office-park', name: 'Parc de Bureaux', position: [27, 2, 11], size: [6, 5, 6], activity: 0.5, occupancy: 0 },
    { id: 'hospital', name: 'Hôpital', position: [5, 2, 25], size: [7, 6, 7], activity: 0.7, occupancy: 0 },
    { id: 'police', name: 'Commissariat', position: [20, 2, 25], size: [5, 4, 5], activity: 0.5, occupancy: 0 },
    // === QUADRANT SW (BAS-GAUCHE) : QUARTIER RÉSIDENTIEL - MARRON/ORANGE ===
    { id: 'res-tower-a', name: 'Tour Résidentielle A', position: [-25, 3, -8], size: [5, 6, 5], activity: 0.4, occupancy: 0 },
    { id: 'res-tower-b', name: 'Tour Résidentielle B', position: [-12, 3, -8], size: [5, 6, 5], activity: 0.4, occupancy: 0 },
    { id: 'res-tower-c', name: 'Tour Résidentielle C', position: [-26, 3, -16], size: [5, 6, 5], activity: 0.4, occupancy: 0 },
    { id: 'res-tower-d', name: 'Tour Résidentielle D', position: [-19, 3, -16], size: [5, 6, 5], activity: 0.4, occupancy: 0 },
    { id: 'res-family', name: 'Logements Familiaux', position: [-33, 2, -12], size: [6, 4, 7], activity: 0.35, occupancy: 0 },
    { id: 'res-student', name: 'Résidences Étudiantes', position: [-13, 2, -20], size: [5, 5, 6], activity: 0.5, occupancy: 0 },
    { id: 'park', name: 'Parc Public', position: [-17, 1, -30], size: [8, 1, 8], activity: 0.3, occupancy: 0 },
    { id: 'school', name: 'École Primaire', position: [-18, 2, -7], size: [6, 4, 5], activity: 0.5, occupancy: 0 },
    // === QUADRANT SE (BAS-DROITE) : ZONE COMMERCIALE - VIOLET/MAGENTA ===
    { id: 'mall', name: 'Centre Commercial', position: [13, 2, -8], size: [9, 4, 7], activity: 0.65, occupancy: 0 },
    { id: 'restaurant', name: 'Restaurants', position: [8, 2, -16], size: [6, 3, 6], activity: 0.7, occupancy: 0 },
    { id: 'cinema', name: 'Cinéma', position: [18, 2, -16], size: [7, 5, 5], activity: 0.6, occupancy: 0 },
    { id: 'supermarket', name: 'Supermarché', position: [25, 2, -8], size: [8, 4, 6], activity: 0.7, occupancy: 0 },
    { id: 'hotel', name: 'Hôtel', position: [5, 3, -4], size: [5, 7, 5], activity: 0.5, occupancy: 0 },
    { id: 'spa', name: 'Centre de Loisirs', position: [13, 2, -23], size: [6, 3, 5], activity: 0.45, occupancy: 0 },
    { id: 'market', name: 'Marché Public', position: [25, 2, -20], size: [7, 2, 7], activity: 0.6, occupancy: 0 }
];
export function initPeople(count, buildings) {
    const rand = seededRandom(42);
    const arr = [];
    const residential = buildings.filter(b => b.id.startsWith('res') || b.zone === 'residential');
    const workplaces = buildings.filter(b => b.zone === 'downtown' || b.zone === 'commercial');
    const campus = buildings.filter(b => b.zone === 'campus');
    const food = buildings.filter(b => b.id === 'cafe' || b.id === 'restaurant' || b.id === 'mall');
    for (let i = 0; i < count; i++) {
        const roleVal = rand();
        const role = roleVal < 0.6 ? 'student' : (roleVal < 0.9 ? 'employee' : 'visitor');
        // Assign home and work
        const home = residential[Math.floor(rand() * residential.length)] || buildings[0];
        let work;
        if (role === 'student') {
            // 40% chance to be in Economics (Wall Street vibe)
            if (rand() < 0.4)
                work = buildings.find(b => b.id === 'bus');
            else
                work = campus[Math.floor(rand() * campus.length)];
        }
        else {
            work = workplaces[Math.floor(rand() * workplaces.length)];
        }
        // Generate Schedule
        const schedule = [];
        if (role === 'student') {
            schedule.push({ time: 8, activity: 'study', targetId: work?.id });
            schedule.push({ time: 12, activity: 'eat', targetId: food[Math.floor(rand() * food.length)]?.id });
            schedule.push({ time: 13, activity: 'study', targetId: work?.id });
            schedule.push({ time: 17, activity: 'leisure' }); // Dynamic target
            schedule.push({ time: 22, activity: 'sleep', targetId: home?.id });
        }
        else {
            schedule.push({ time: 9, activity: 'work', targetId: work?.id });
            schedule.push({ time: 12, activity: 'eat', targetId: food[Math.floor(rand() * food.length)]?.id });
            schedule.push({ time: 13, activity: 'work', targetId: work?.id });
            schedule.push({ time: 18, activity: 'leisure' });
            schedule.push({ time: 23, activity: 'sleep', targetId: home?.id });
        }
        const b = buildings[Math.floor(rand() * buildings.length)];
        const pos = [
            b.position[0] + (rand() - 0.5) * b.size[0],
            0.1,
            b.position[2] + (rand() - 0.5) * b.size[2]
        ];
        arr.push({
            id: i,
            position: pos,
            targetBuildingId: b.id,
            speed: 0.8 + rand() * 0.6,
            name: randomName(rand),
            role: role,
            workplace: work?.id,
            traits: {
                introversion: rand(),
                punctuality: 0.5 + rand() * 0.5,
                energy: 1.0
            },
            schedule: schedule,
            state: {
                currentActivity: 'idle',
                mood: 'neutral',
                history: []
            }
        });
    }
    return arr;
}
