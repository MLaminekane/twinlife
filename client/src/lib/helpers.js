export function seededRandom(seed) {
    let t = seed >>> 0;
    return () => (t = (t * 1664525 + 1013904223) >>> 0) / 4294967296;
}
// Simple French-like fake names
const FIRST_NAMES = ['Alex', 'Camille', 'Nadia', 'Hugo', 'Lina', 'Sofiane', 'Emma', 'Lucas', 'Zoé', 'Théo', 'Inès', 'Yanis', 'Maya', 'Noé', 'Léa', 'Nolan', 'Chloé', 'Enzo', 'Sarah', 'Adam'];
const LAST_NAMES = ['Dubois', 'Moreau', 'Lefevre', 'Fontaine', 'Lambert', 'Mercier', 'Blanc', 'Rousseau', 'Legrand', 'Martel', 'Boucher', 'Renard', 'Garnier', 'Collet', 'Moulin', 'Lemoine', 'Francois', 'Noel', 'Chevalier', 'Perrin'];
export function randomName(randFn) {
    const f = FIRST_NAMES[Math.floor(randFn() * FIRST_NAMES.length)];
    const l = LAST_NAMES[Math.floor(randFn() * LAST_NAMES.length)];
    return `${f} ${l}`;
}
// Compute 2D AABB overlap on XZ-plane with a margin corridor
export function overlapsXZ(aPos, aSize, bPos, bSize, margin = 1) {
    const dx = Math.abs(aPos[0] - bPos[0]);
    const dz = Math.abs(aPos[2] - bPos[2]);
    const allowX = (aSize[0] + bSize[0]) / 2 + margin;
    const allowZ = (aSize[2] + bSize[2]) / 2 + margin;
    return dx < allowX && dz < allowZ;
}
// Find a non-overlapping position on a coarse grid around the origin
export function findNonOverlappingPosition(size, buildings, bounds = 40, step = 3) {
    // Try the origin first
    const candidates = [];
    for (let r = 0; r <= bounds; r += step) {
        for (let x = -r; x <= r; x += step) {
            for (let z = -r; z <= r; z += step) {
                // Only consider the ring border to reduce candidates
                if (Math.abs(x) !== r && Math.abs(z) !== r)
                    continue;
                candidates.push([x, 2, z]);
            }
        }
        // A tiny randomization between rings to avoid patterns
        if (r === 0)
            candidates.unshift([0, 2, 0]);
    }
    for (const pos of candidates) {
        let ok = true;
        for (const b of buildings) {
            if (overlapsXZ(pos, size, b.position, b.size)) {
                ok = false;
                break;
            }
        }
        if (ok)
            return pos;
    }
    // Fallback: place far away if somehow all are taken
    return [bounds + size[0], 2, bounds + size[2]];
}
