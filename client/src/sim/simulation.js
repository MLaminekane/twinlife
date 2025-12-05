/**
 * Core simulation functions that can be used in both main thread and worker
 */
/**
 * Seeded random number generator for reproducible simulations
 */
function seededRandom(seed) {
    let t = seed >>> 0;
    return () => (t = (t * 1664525 + 1013904223) >>> 0) / 4294967296;
}
/**
 * Tick the simulation: Move people, update occupancy
 */
export function tickSimulation(state, speed) {
    const { buildings, people, dt } = state;
    // Clone to avoid mutations
    const nextBuildings = buildings.map(b => ({ ...b, occupancy: 0 }));
    const nextPeople = [...people];
    // Move people towards target buildings
    for (const p of nextPeople) {
        const target = nextBuildings.find(b => b.id === p.targetBuildingId);
        const dx = target.position[0] - p.position[0];
        const dz = target.position[2] - p.position[2];
        const dist = Math.hypot(dx, dz);
        const step = Math.min(dist, dt * p.speed * speed);
        if (dist > 0.01) {
            p.position[0] += (dx / dist) * step;
            p.position[2] += (dz / dist) * step;
        }
        else {
            // Pick a new target occasionally
            if (Math.random() < 0.01 + target.activity * 0.05) {
                const others = nextBuildings.filter(b => b.id !== target.id);
                if (others.length > 0) {
                    p.targetBuildingId = others[Math.floor(Math.random() * others.length)].id;
                }
            }
        }
    }
    // Calculate occupancy
    for (const p of nextPeople) {
        const nearest = nextBuildings.reduce((a, b) => {
            const da = Math.hypot(a.position[0] - p.position[0], a.position[2] - p.position[2]);
            const db = Math.hypot(b.position[0] - p.position[0], b.position[2] - p.position[2]);
            return da < db ? a : b;
        });
        nearest.occupancy += 1;
    }
    return { buildings: nextBuildings, people: nextPeople };
}
/**
 * Apply environment-based activity adjustments
 */
export function applyEnvironmentEffects(buildings, environment, dt) {
    const nextBuildings = buildings.map(b => ({ ...b }));
    const envActivityFor = (b) => {
        const id = b.id;
        let base = 0.5;
        // Time of day effects
        switch (environment.dayPeriod) {
            case 'matin':
                if (id === 'lib')
                    base += 0.05;
                if (id === 'adm')
                    base += 0.1;
                break;
            case 'midi':
            case 'apresmidi':
                if (['sci', 'eng', 'bus', 'law', 'med'].includes(id))
                    base += 0.15;
                break;
            case 'soir':
                if (id === 'lib' || id === 'art')
                    base += 0.2;
                if (id === 'adm')
                    base -= 0.1;
                break;
            case 'nuit':
                if (id === 'lib')
                    base += 0.1;
                if (id === 'adm')
                    base -= 0.2;
                base -= 0.15;
                break;
        }
        // Weekend effects
        if (environment.weekend) {
            if (['adm', 'bus', 'law'].includes(id))
                base -= 0.2;
            if (id === 'lib' || id === 'art')
                base += 0.15;
        }
        // Season effects
        switch (environment.season) {
            case 'hiver':
                if (id === 'lib')
                    base += 0.15;
                if (id === 'art')
                    base -= 0.05;
                break;
            case 'ete':
                if (id === 'art')
                    base += 0.1;
                break;
            case 'printemps':
                if (id === 'sci' || id === 'eng')
                    base += 0.05;
                break;
            case 'automne':
                if (id === 'bus' || id === 'law')
                    base += 0.05;
                break;
        }
        return Math.max(0, Math.min(1, base));
    };
    // Nudge activity toward environmental target
    for (const b of nextBuildings) {
        let target = envActivityFor(b);
        // Weather influence
        if (environment.condition === 'rain' || environment.condition === 'snow') {
            // Bad weather: boost indoor activity, reduce outdoor/transit
            if (['lib', 'sci', 'eng', 'bus', 'med'].includes(b.id)) {
                target = Math.min(1, target + 0.1);
            }
        }
        b.activity += (target - b.activity) * Math.min(1, dt * 0.3);
    }
    return nextBuildings;
}
