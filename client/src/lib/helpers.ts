import type { Building } from '../state/store'

export function seededRandom(seed: number) {
    let t = seed >>> 0
    return () => (t = (t * 1664525 + 1013904223) >>> 0) / 4294967296
}

// Liste de prénoms et noms francophones pour générer des identités
const FIRST_NAMES = ['Alex', 'Camille', 'Nadia', 'Hugo', 'Lina', 'Sofiane', 'Emma', 'Lucas', 'Zoé', 'Théo', 'Inès', 'Yanis', 'Maya', 'Noé', 'Léa', 'Nolan', 'Chloé', 'Enzo', 'Sarah', 'Adam']
const LAST_NAMES = ['Dubois', 'Moreau', 'Lefevre', 'Fontaine', 'Lambert', 'Mercier', 'Blanc', 'Rousseau', 'Legrand', 'Martel', 'Boucher', 'Renard', 'Garnier', 'Collet', 'Moulin', 'Lemoine', 'Francois', 'Noel', 'Chevalier', 'Perrin']

export function randomName(randFn: () => number): string {
    const f = FIRST_NAMES[Math.floor(randFn() * FIRST_NAMES.length)]
    const l = LAST_NAMES[Math.floor(randFn() * LAST_NAMES.length)]
    return `${f} ${l}`
}

// Vérifie si deux boîtes se chevauchent sur le plan XZ (avec une marge)
export function overlapsXZ(aPos: [number, number, number], aSize: [number, number, number], bPos: [number, number, number], bSize: [number, number, number], margin = 1): boolean {
    const dx = Math.abs(aPos[0] - bPos[0])
    const dz = Math.abs(aPos[2] - bPos[2])
    const allowX = (aSize[0] + bSize[0]) / 2 + margin
    const allowZ = (aSize[2] + bSize[2]) / 2 + margin
    return dx < allowX && dz < allowZ
}

// Trouve une position libre sur une grille, sans chevaucher les bâtiments existants
export function findNonOverlappingPosition(size: [number, number, number], buildings: Building[], bounds = 40, step = 3): [number, number, number] {
    // On essaie d'abord l'origine, puis on s'éloigne en spirale
    const candidates: Array<[number, number, number]> = []
    for (let r = 0; r <= bounds; r += step) {
        for (let x = -r; x <= r; x += step) {
            for (let z = -r; z <= r; z += step) {
                // On ne garde que le bord de l'anneau pour limiter les candidats
                if (Math.abs(x) !== r && Math.abs(z) !== r) continue
                candidates.push([x, 2, z])
            }
        }
        // Petite variation entre les anneaux pour éviter les patterns répétitifs
        if (r === 0) candidates.unshift([0, 2, 0])
    }
    for (const pos of candidates) {
        let ok = true
        for (const b of buildings) {
            if (overlapsXZ(pos, size, b.position, b.size)) { ok = false; break }
        }
        if (ok) return pos
    }
    return [bounds + size[0], 2, bounds + size[2]]
}
