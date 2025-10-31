// Zone polygons for Saguenay (approximate). You can refine coordinates.
// Coordinates are [lon, lat] WGS84.
// Base city center
const CITY = { lon: -71.065, lat: 48.428 };
const DEG_LAT_PER_M = 1 / 111320;
const DEG_LON_PER_M = 1 / (111320 * Math.cos((CITY.lat * Math.PI) / 180));
function metersToLngLat(dx, dz) {
    const dLon = dx * DEG_LON_PER_M;
    const dLat = -dz * DEG_LAT_PER_M;
    return [CITY.lon + dLon, CITY.lat + dLat];
}
// Helper to make a rounded-ish rect polygon around a center in meters
function rectPoly(cx, cz, w, h) {
    const hw = w / 2, hh = h / 2;
    const corners = [
        metersToLngLat(cx - hw, cz - hh),
        metersToLngLat(cx + hw, cz - hh),
        metersToLngLat(cx + hw, cz + hh),
        metersToLngLat(cx - hw, cz + hh),
        metersToLngLat(cx - hw, cz - hh)
    ];
    return corners;
}
// Layout (meters offsets from CITY): keep consistent with MapView default scale
const gapM = 250;
const zoneW = 1800;
const zoneH = 1400;
const centers = {
    uni: [-zoneW / 2 - gapM / 2, zoneH / 2 + gapM / 2], // UQAC (NW)
    city: [-zoneW / 2 - gapM / 2, -zoneH / 2 - gapM / 2], // Centre-ville (SW)
    res: [zoneW / 2 + gapM / 2, zoneH / 2 + gapM / 2], // Residences (NE)
    plz: [zoneW / 2 + gapM / 2, -zoneH / 2 - gapM / 2] // Place du Royaume (SE)
};
export const zonePolygons = [
    {
        id: 'uni',
        name: "UQAC",
        color: '#16a34a',
        coordinates: rectPoly(centers.uni[0], centers.uni[1], zoneW, zoneH)
    },
    {
        id: 'plz',
        name: 'Place du Royaume',
        color: '#ef4444',
        coordinates: rectPoly(centers.plz[0], centers.plz[1], zoneW, zoneH)
    },
    {
        id: 'res',
        name: 'Résidences UQAC',
        color: '#8b5e34',
        coordinates: rectPoly(centers.res[0], centers.res[1], zoneW, zoneH)
    },
    {
        id: 'city',
        name: 'Centre-ville',
        color: '#2563eb',
        coordinates: rectPoly(centers.city[0], centers.city[1], zoneW, zoneH)
    }
];
