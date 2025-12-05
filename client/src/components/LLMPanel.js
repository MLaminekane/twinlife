import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useStore } from '../state/store';
import { sendLLM } from '../lib/api';
export function LLMPanel() {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const applyDirective = useStore(s => s.applyDirective);
    const people = useStore(s => s.people);
    // Personnes avec rôles
    const customPeople = people.filter(p => p.role || p.workplace || p.department);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim())
            return;
        setLoading(true);
        setError('');
        try {
            console.log('[LLMPanel] Envoi requête:', prompt);
            const directive = await sendLLM(prompt);
            console.log('[LLMPanel] Directive reçue:', directive);
            applyDirective(directive);
            console.log('[LLMPanel] Directive appliquée');
            setPrompt('');
        }
        catch (err) {
            console.error('[LLMPanel] Erreur:', err);
            setError(err.message || 'Erreur LLM');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "panel", style: { width: 400, maxHeight: '80vh', overflow: 'auto', top: 70 }, children: [_jsx("h3", { children: "\uD83E\uDD16 Assistant LLM" }), _jsx("div", { className: "small", style: { marginBottom: 12 }, children: "Commandes persistantes : ajouter/supprimer personnes & b\u00E2timents" }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsx("textarea", { value: prompt, onChange: e => setPrompt(e.target.value), placeholder: "Ex: ajoute Lamine comme employ\u00E9 \u00E0 la banque", style: { minHeight: 80, marginBottom: 8 }, disabled: loading }), _jsx("button", { type: "submit", className: "btn", disabled: loading, style: { width: '100%' }, children: loading ? 'Traitement...' : 'Envoyer' })] }), error && (_jsxs("div", { style: { color: '#ef4444', marginTop: 8, fontSize: 13 }, children: ["\u26A0\uFE0F ", error] })), customPeople.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "separator" }), _jsxs("h4", { style: { fontSize: 14, margin: '8px 0' }, children: ["\uD83D\uDC65 Personnes personnalis\u00E9es (", customPeople.length, ")"] }), _jsx("div", { style: { maxHeight: 200, overflow: 'auto', fontSize: 12 }, children: customPeople.map(p => (_jsxs("div", { style: {
                                padding: '4px 8px',
                                marginBottom: 4,
                                background: 'rgba(59, 130, 246, 0.1)',
                                borderRadius: 6,
                                border: '1px solid rgba(59, 130, 246, 0.2)'
                            }, children: [_jsx("div", { style: { fontWeight: 600 }, children: p.name }), p.role && _jsx("div", { style: { color: '#94a3af', fontSize: 11 }, children: p.role === 'student' ? '🎓 Étudiant' :
                                        p.role === 'employee' ? '💼 Employé' :
                                            p.role === 'professor' ? '👨‍🏫 Professeur' :
                                                p.role === 'worker' ? '👷 Travailleur' : '👤 Visiteur' }), p.workplace && _jsxs("div", { style: { color: '#94a3af', fontSize: 11 }, children: ["\uD83C\uDFE2 Lieu: ", useStore.getState().buildings.find(b => b.id === p.workplace)?.name || p.workplace] }), p.department && _jsxs("div", { style: { color: '#94a3af', fontSize: 11 }, children: ["\uD83C\uDFDB\uFE0F D\u00E9partement: ", p.department] })] }, p.id))) })] })), _jsx("div", { className: "separator" }), _jsxs("div", { className: "small", children: [_jsx("strong", { children: "Exemples de commandes :" }), _jsx("br", {}), "\u2022 \"ajoute Lamine comme employ\u00E9 \u00E0 la banque\"", _jsx("br", {}), "\u2022 \"cr\u00E9e un nouveau caf\u00E9 dans la zone commerciale\"", _jsx("br", {}), "\u2022 \"ajoute 5 \u00E9tudiants \u00E0 l'universit\u00E9\"", _jsx("br", {}), "\u2022 \"supprime le b\u00E2timent X\"", _jsx("br", {}), "\u2022 \"supprime la personne Lamine\"", _jsx("br", {}), _jsx("br", {}), "\uD83D\uDCBE Toutes les modifications sont sauvegard\u00E9es automatiquement"] })] }));
}
