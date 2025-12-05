import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useStore } from '../state/store';
export function DialogueModal() {
    const selectedPersonId = useStore(s => s.selectedPersonId);
    const people = useStore(s => s.people);
    const [dialogue, setDialogue] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const person = people.find(p => p.id === selectedPersonId);
    const otherPerson = person?.state.talkingWith !== undefined
        ? people.find(p => p.id === person.state.talkingWith)
        : null;
    useEffect(() => {
        setDialogue(null);
        setError('');
    }, [selectedPersonId]);
    if (!person || !otherPerson || person.state.currentActivity !== 'talking')
        return null;
    const fetchDialogue = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8787/api/chat/dialogue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent1: { name: person.name, role: person.role, traits: person.traits, mood: person.state.mood },
                    agent2: { name: otherPerson.name, role: otherPerson.role, traits: otherPerson.traits, mood: otherPerson.state.mood }
                })
            });
            const data = await res.json();
            if (data.dialogue) {
                setDialogue(data.dialogue);
            }
            else {
                setError('Failed to generate dialogue');
            }
        }
        catch (e) {
            setError('Error connecting to server');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { style: {
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            maxWidth: '500px',
            width: '90%',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            zIndex: 1000
        }, children: [_jsxs("h3", { style: { margin: '0 0 10px 0', borderBottom: '1px solid #444', paddingBottom: '5px' }, children: ["Conversation: ", person.name, " & ", otherPerson.name] }), !dialogue && !loading && (_jsx("button", { onClick: fetchDialogue, style: {
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    width: '100%'
                }, children: "\uD83D\uDC42 Listen In (Generate Dialogue)" })), loading && _jsx("div", { children: "Generating conversation... \uD83E\uDD16" }), error && _jsx("div", { style: { color: '#ef4444' }, children: error }), dialogue && (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }, children: dialogue.map((line, i) => (_jsxs("div", { style: {
                        alignSelf: line.speaker === person.name ? 'flex-start' : 'flex-end',
                        background: line.speaker === person.name ? '#1e293b' : '#0f172a',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        maxWidth: '80%'
                    }, children: [_jsx("strong", { style: { color: '#94a3b8', fontSize: '0.8em' }, children: line.speaker }), _jsx("div", { children: line.text })] }, i))) }))] }));
}
