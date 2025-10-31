import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useStore } from '../state/store';
import { sendLLM } from '../lib/api';
export function ControlsPanel() {
    const running = useStore(s => s.settings.running);
    const speed = useStore(s => s.settings.speed);
    const glow = useStore(s => s.settings.glow);
    const shadows = useStore(s => s.settings.shadows);
    const labels = useStore(s => s.settings.labels);
    const buildings = useStore(s => s.buildings);
    const people = useStore(s => s.people);
    const environment = useStore(s => s.environment);
    const scenario = useStore(s => s.scenario);
    const applyDirective = useStore(s => s.applyDirective);
    const reset = useStore(s => s.reset);
    const setSelectedPerson = useStore(s => s.setSelectedPerson);
    const setScenario = useStore(s => s.setScenario);
    const [prompt, setPrompt] = useState('Augmente l\'activité en Sciences et en Bibliothèque, ralentis un peu la simulation.');
    const [busy, setBusy] = useState(false);
    const [query, setQuery] = useState('');
    const [searchMsg, setSearchMsg] = useState(null);
    return (_jsxs("div", { className: "panel", children: [_jsx("h3", { children: "Contr\u00F4les" }), _jsxs("div", { className: "row", children: [_jsx("button", { className: "btn", onClick: () => useStore.setState(s => ({ settings: { ...s.settings, running: !s.settings.running } })), children: running ? '⏸️ Pause' : '▶️ Lecture' }), _jsx("button", { className: "btn", onClick: reset, children: "\u267B\uFE0F R\u00E9initialiser" })] }), _jsx("div", { className: "row", children: _jsxs("label", { children: ["Vitesse: ", speed.toFixed(2)] }) }), _jsx("input", { className: "input", type: "range", min: 0.2, max: 3, step: 0.1, value: speed, onChange: (e) => useStore.setState(s => ({ settings: { ...s.settings, speed: Number(e.target.value) } })) }), _jsxs("div", { className: "row", children: [_jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: glow, onChange: (e) => useStore.setState(s => ({ settings: { ...s.settings, glow: e.target.checked } })) }), " Glow"] }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: shadows, onChange: (e) => useStore.setState(s => ({ settings: { ...s.settings, shadows: e.target.checked } })) }), " Ombres"] }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: labels, onChange: (e) => useStore.setState(s => ({ settings: { ...s.settings, labels: e.target.checked } })) }), " Labels"] })] }), _jsx("div", { className: "separator" }), _jsx("div", { className: "row", children: _jsx("label", { children: "Recherche citoyen" }) }), _jsxs("div", { className: "row", style: { gap: 8 }, children: [_jsx("input", { className: "input", type: "text", placeholder: "Nom ou pr\u00E9nom (ex: Camille, Dubois)", value: query, onChange: (e) => setQuery(e.target.value) }), _jsx("button", { className: "btn", onClick: () => {
                            const q = query.trim().toLowerCase();
                            if (!q) {
                                setSearchMsg('Entrez un nom.');
                                return;
                            }
                            const p = people.find(p => p.name.toLowerCase().includes(q));
                            if (p) {
                                setSelectedPerson(p.id);
                                setSearchMsg(`Focalisation sur ${p.name}`);
                            }
                            else {
                                setSearchMsg('Aucun résultat');
                            }
                        }, children: "\uD83D\uDD0E Trouver" }), _jsx("button", { className: "btn", onClick: () => { setSelectedPerson(null); setSearchMsg(null); setQuery(''); }, children: "Effacer" })] }), searchMsg && _jsx("div", { className: "small", children: searchMsg }), _jsx("div", { className: "separator" }), _jsx("div", { className: "row", children: _jsx("label", { children: "Sc\u00E9narios d'investissement" }) }), _jsx("div", { className: "row", style: { gap: 8 }, children: _jsxs("label", { children: ["IA: ", Math.round(scenario.investmentAI * 100), "%"] }) }), _jsx("input", { className: "input", type: "range", min: 0, max: 1, step: 0.05, value: scenario.investmentAI, onChange: (e) => {
                    const ai = Number(e.target.value);
                    const hum = Math.max(0, Math.min(1, 1 - ai));
                    setScenario({ investmentAI: ai, investmentHumanities: hum });
                } }), _jsx("div", { className: "row", style: { gap: 8 }, children: _jsxs("label", { children: ["Humanit\u00E9s: ", Math.round(scenario.investmentHumanities * 100), "%"] }) }), _jsx("div", { className: "row", style: { gap: 8 }, children: _jsxs("label", { style: { display: 'inline-flex', alignItems: 'center', gap: 6 }, children: [_jsx("input", { type: "checkbox", checked: scenario.llmAgents, onChange: (e) => setScenario({ llmAgents: e.target.checked }) }), "Activer agents LLM"] }) }), _jsx("div", { className: "small", children: "Testez: \u201Cplus d\u2019IA que d\u2019humanit\u00E9s\u201D en poussant IA vers 70\u201390%. Les dynamiques de publications/collabs/rivalit\u00E9s s\u2019ajusteront." }), _jsx("div", { className: "separator" }), _jsx("div", { className: "row", children: _jsx("label", { children: "Environnement" }) }), _jsxs("div", { className: "row", style: { gap: 8, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsxs("label", { children: ["Saison", _jsxs("select", { value: environment.season, onChange: (e) => applyDirective({ environment: { season: e.target.value } }), children: [_jsx("option", { value: "hiver", children: "Hiver" }), _jsx("option", { value: "printemps", children: "Printemps" }), _jsx("option", { value: "ete", children: "\u00C9t\u00E9" }), _jsx("option", { value: "automne", children: "Automne" })] })] }), _jsxs("label", { children: ["Moment de la journ\u00E9e", _jsxs("select", { value: environment.dayPeriod, onChange: (e) => applyDirective({ environment: { dayPeriod: e.target.value } }), children: [_jsx("option", { value: "matin", children: "Matin" }), _jsx("option", { value: "midi", children: "Midi" }), _jsx("option", { value: "apresmidi", children: "Apr\u00E8s-midi" }), _jsx("option", { value: "soir", children: "Soir" }), _jsx("option", { value: "nuit", children: "Nuit" })] })] }), _jsxs("label", { style: { display: 'inline-flex', alignItems: 'center', gap: 6 }, children: [_jsx("input", { type: "checkbox", checked: environment.weekend, onChange: (e) => applyDirective({ environment: { weekend: e.target.checked } }) }), "Week-end"] })] }), _jsxs("div", { className: "row", style: { gap: 8, marginTop: 6 }, children: [_jsx("button", { className: "btn", title: "Pause la simulation temporairement", onClick: () => applyDirective({ effects: [{ type: 'pause', durationSec: 5 }] }), children: "\u23F1\uFE0F Pause 5s" }), _jsx("button", { className: "btn", title: "D\u00E9clenche un pic d'activit\u00E9 court sur tout le campus", onClick: () => {
                            const names = buildings.map(b => b.name);
                            applyDirective({ effects: names.map(n => ({ type: 'activitySpike', buildingName: n, delta: 0.3, durationSec: 8 })) });
                        }, children: "\u26A1 Pic d'activit\u00E9 (8s)" })] }), _jsx("div", { className: "separator" }), _jsx("div", { className: "row", children: _jsx("label", { children: "B\u00E2timents visibles" }) }), _jsx("div", { className: "row", style: { flexWrap: 'wrap' }, children: buildings.filter(b => !b.id.startsWith('res')).map(b => (_jsxs("label", { style: { width: '48%' }, children: [_jsx("input", { type: "checkbox", checked: useStore.getState().settings.visibleBuildings.has(b.id), onChange: (e) => {
                                useStore.setState(s => {
                                    const set = new Set(s.settings.visibleBuildings);
                                    if (e.target.checked)
                                        set.add(b.id);
                                    else
                                        set.delete(b.id);
                                    return { settings: { ...s.settings, visibleBuildings: set } };
                                });
                            } }), " ", b.name] }, b.id))) }), _jsx("div", { className: "row", children: _jsx("label", { children: "R\u00E9sidences \u00E9tudiantes" }) }), _jsx("div", { className: "row", style: { flexWrap: 'wrap' }, children: buildings.filter(b => b.id.startsWith('res') || b.name.toLowerCase().includes('résidence')).map(b => (_jsxs("label", { style: { width: '48%' }, children: [_jsx("input", { type: "checkbox", checked: useStore.getState().settings.visibleBuildings.has(b.id), onChange: (e) => {
                                useStore.setState(s => {
                                    const set = new Set(s.settings.visibleBuildings);
                                    if (e.target.checked)
                                        set.add(b.id);
                                    else
                                        set.delete(b.id);
                                    return { settings: { ...s.settings, visibleBuildings: set } };
                                });
                            } }), " ", b.name] }, b.id))) }), _jsx("div", { className: "separator" }), _jsx("div", { className: "row", children: _jsx("label", { children: "Commande LLM" }) }), _jsx("textarea", { rows: 4, value: prompt, onChange: (e) => setPrompt(e.target.value), placeholder: "D\u00E9crivez un changement: ex: Augmente l'activit\u00E9 en Sciences" }), _jsx("div", { className: "row", children: _jsx("button", { className: "btn", disabled: busy, onClick: async () => {
                        setBusy(true);
                        try {
                            const dir = await sendLLM(prompt);
                            applyDirective(dir);
                        }
                        finally {
                            setBusy(false);
                        }
                    }, children: busy ? '…' : '🎯 Appliquer via LLM' }) }), _jsx("div", { className: "small", children: "Sans cl\u00E9 API, un g\u00E9n\u00E9rateur local approximatif est utilis\u00E9." })] }));
}
