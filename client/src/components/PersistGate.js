import { useEffect } from 'react';
import { useStore } from '../state/store';
const S_KEY = 'twinlife_scenario_v1';
const SET_KEY = 'twinlife_settings_v1';
export function PersistGate() {
    const setScenario = useStore(s => s.setScenario);
    const settings = useStore(s => s.settings);
    useEffect(() => {
        try {
            const s = localStorage.getItem(S_KEY);
            if (s)
                setScenario(JSON.parse(s));
            const st = localStorage.getItem(SET_KEY);
            if (st) {
                const parsed = JSON.parse(st);
                useStore.setState(prev => ({ settings: { ...prev.settings, ...parsed } }));
            }
        }
        catch { }
        const unsub1 = useStore.subscribe((s) => {
            try {
                localStorage.setItem(S_KEY, JSON.stringify(s.scenario));
            }
            catch { }
        });
        const unsub2 = useStore.subscribe((s) => {
            try {
                localStorage.setItem(SET_KEY, JSON.stringify({ running: s.settings.running, speed: s.settings.speed, glow: s.settings.glow, shadows: s.settings.shadows, labels: s.settings.labels }));
            }
            catch { }
        });
        return () => { unsub1(); unsub2(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return null;
}
