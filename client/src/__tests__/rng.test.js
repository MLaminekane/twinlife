import { describe, it, expect } from 'vitest';
function seededRandom(seed) {
    let t = seed >>> 0;
    return () => (t = (t * 1664525 + 1013904223) >>> 0) / 4294967296;
}
describe('seededRandom', () => {
    it('produces deterministic sequence', () => {
        const a = seededRandom(42)();
        const b = seededRandom(42)();
        expect(a).toBe(b);
    });
    it('stays within [0,1)', () => {
        const r = seededRandom(1);
        for (let i = 0; i < 1000; i++) {
            const x = r();
            expect(x).toBeGreaterThanOrEqual(0);
            expect(x).toBeLessThan(1);
        }
    });
});
