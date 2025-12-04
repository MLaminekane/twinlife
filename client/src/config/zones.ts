// Polygones de zones pour Saguenay (approximatifs). Vous pouvez affiner les coordonnées.
// Coordonnées sont [lon, lat] WGS84.

export type ZoneKey = 'campus' | 'downtown' | 'residential' | 'commercial'

export type ZonePolygon = {
  id: ZoneKey
  name: string
  color: string
  coordinates: [number, number][] // polygone fermé (le dernier point répète le premier)
}

// Base city center
const CITY = { lon: -71.065, lat: 48.428 }
const DEG_LAT_PER_M = 1 / 111320
const DEG_LON_PER_M = 1 / (111320 * Math.cos((CITY.lat * Math.PI) / 180))

function metersToLngLat(dx: number, dz: number): [number, number] {
  const dLon = dx * DEG_LON_PER_M
  const dLat = -dz * DEG_LAT_PER_M
  return [CITY.lon + dLon, CITY.lat + dLat]
}

// Créer un polygone rectangulaire autour d'un centre en mètres
function rectPoly(cx: number, cz: number, w: number, h: number): [number, number][] {
  const hw = w / 2, hh = h / 2
  const corners: Array<[number, number]> = [
    metersToLngLat(cx - hw, cz - hh),
    metersToLngLat(cx + hw, cz - hh),
    metersToLngLat(cx + hw, cz + hh),
    metersToLngLat(cx - hw, cz + hh),
    metersToLngLat(cx - hw, cz - hh)
  ]
  return corners
}

// Organisation spatiale : 4 quadrants distincts (comme dans Zones.tsx)
// NW (HAUT-GAUCHE) | NE (HAUT-DROITE)
// SW (BAS-GAUCHE)  | SE (BAS-DROITE)
const gapM = 200 // Espace entre les quadrants
const zoneW = 2000  // Largeur de chaque zone
const zoneH = 1800  // Hauteur de chaque zone

const centers = {
  campus: [-zoneW/2 - gapM/2, zoneH/2 + gapM/2],      // NW - Haut gauche (vert)
  downtown: [zoneW/2 + gapM/2, zoneH/2 + gapM/2],     // NE - Haut droite (bleu)
  residential: [-zoneW/2 - gapM/2, -zoneH/2 - gapM/2], // SW - Bas gauche (marron)
  commercial: [zoneW/2 + gapM/2, -zoneH/2 - gapM/2]    // SE - Bas droite (violet)
} as const

export const zonePolygons: ZonePolygon[] = [
  {
    id: 'campus',
    name: "Campus Universitaire UQAC",
    color: '#16a34a', // Vert - correspond à Zones.tsx NW
    coordinates: rectPoly(centers.campus[0], centers.campus[1], zoneW, zoneH)
  },
  {
    id: 'downtown',
    name: 'Centre-ville & Entreprises',
    color: '#2563eb', // Bleu - correspond à Zones.tsx NE
    coordinates: rectPoly(centers.downtown[0], centers.downtown[1], zoneW, zoneH)
  },
  {
    id: 'residential',
    name: 'Quartier Résidentiel',
    color: '#b45309', // Marron/Orange - correspond à Zones.tsx SW
    coordinates: rectPoly(centers.residential[0], centers.residential[1], zoneW, zoneH)
  },
  {
    id: 'commercial',
    name: 'Zone Commerciale',
    color: '#a21caf', // Violet/Magenta - correspond à Zones.tsx SE
    coordinates: rectPoly(centers.commercial[0], centers.commercial[1], zoneW, zoneH)
  }
]
