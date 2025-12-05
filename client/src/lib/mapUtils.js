export function pointInPoly(pt, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], yi = poly[i][1];
        const xj = poly[j][0], yj = poly[j][1];
        const intersect = ((yi > pt[1]) !== (yj > pt[1])) && (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi + 1e-12) + xi);
        if (intersect)
            inside = !inside;
    }
    return inside;
}
export function centroid(poly) {
    let x = 0, y = 0;
    for (const p of poly) {
        x += p[0];
        y += p[1];
    }
    return [x / poly.length, y / poly.length];
}
export function deterministicRand(id) {
    let h = 2166136261;
    for (let i = 0; i < id.length; i++)
        h = Math.imul(h ^ id.charCodeAt(i), 16777619);
    return (h >>> 0) / 4294967296;
}
