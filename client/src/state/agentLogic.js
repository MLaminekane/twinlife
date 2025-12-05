export function initializeAgents() {
    const arr = [];
    arr.push({
        id: 'rector-1',
        role: 'rector',
        dept: 'adm',
        buildingId: 'adm',
        biases: { research: 0.4, collab: 0.7, rivalry: 0.2, ai: 0.5, humanities: 0.5 },
        memory: []
    });
    const profDepts = ['eng', 'bio', 'eco', 'art', 'law'];
    let pid = 0;
    for (let i = 0; i < 24; i++) {
        const d = profDepts[i % profDepts.length];
        const b = d === 'eng' ? 'eng' : d === 'bio' ? 'sci' : d === 'eco' ? 'bus' : d === 'art' ? 'art' : 'law';
        arr.push({
            id: `prof-${++pid}`,
            role: 'prof',
            dept: d,
            buildingId: b,
            biases: {
                research: 0.6,
                collab: 0.5,
                rivalry: 0.25,
                ai: d === 'eng' || d === 'bio' ? 0.8 : 0.3,
                humanities: d === 'eng' || d === 'bio' ? 0.2 : 0.7
            },
            memory: [],
            h: 0
        });
    }
    for (let i = 0; i < 120; i++) {
        const d = profDepts[i % profDepts.length];
        const b = d === 'eng' ? 'eng' : d === 'bio' ? 'sci' : d === 'eco' ? 'bus' : d === 'art' ? 'art' : 'law';
        arr.push({
            id: `stu-${i + 1}`,
            role: 'student',
            dept: d,
            buildingId: b,
            biases: {
                research: 0.35,
                collab: 0.6,
                rivalry: 0.15,
                ai: d === 'eng' || d === 'bio' ? 0.7 : 0.4,
                humanities: d === 'eng' || d === 'bio' ? 0.3 : 0.6
            },
            memory: []
        });
    }
    return arr;
}
export function applyAgentActionsLogic(acts, agents, departments, buildings, deptFlashes, deptInteractions, news, scenario, people) {
    const pushNews = (text, kind = 'system') => {
        const id = news.length ? news[news.length - 1].id + 1 : 1;
        news.push({ id, ts: Date.now(), kind, text });
    };
    for (const a of acts) {
        const ag = agents.find(x => x.id === a.id);
        if (!ag)
            continue;
        const remember = (m) => {
            ag.memory = [...(ag.memory ?? []), m].slice(-10);
        };
        if (a.publish) {
            const d = ag.dept && departments.find(x => x.id === ag.dept);
            if (d) {
                d.publications += 1;
                const b = buildings.find(x => x.id === d.buildingId);
                if (b) {
                    b.activity = Math.min(1, b.activity + 0.05);
                    deptFlashes.push({ buildingId: b.id, remaining: 2.0 });
                }
                pushNews(`📄 ${d.name}: publication (agents)`, 'pub');
                if (ag.role === 'prof')
                    ag.h = (ag.h ?? 0) + (0.5 + Math.random() * 0.8);
                remember('publication');
            }
        }
        if (a.seekCollabWith) {
            const from = ag.dept, to = a.seekCollabWith;
            if (from && to && from !== to) {
                deptInteractions.push({ from, to, type: 'collab', remaining: 3.0 });
                pushNews(`🤝 ${from.toUpperCase()} × ${to.toUpperCase()} (agents)`, 'collab');
                remember(`collab:${from}->${to}`);
            }
        }
        if (a.challenge) {
            const from = ag.dept, to = a.challenge;
            if (from && to && from !== to) {
                deptInteractions.push({ from, to, type: 'rivalry', remaining: 3.0 });
                const bFrom = departments.find(x => x.id === from);
                const bTo = departments.find(x => x.id === to);
                if (bFrom) {
                    const bb = buildings.find(x => x.id === bFrom.buildingId);
                    if (bb)
                        bb.activity = Math.min(1, bb.activity + 0.02);
                }
                if (bTo) {
                    const bb = buildings.find(x => x.id === bTo.buildingId);
                    if (bb)
                        bb.activity = Math.max(0, bb.activity - 0.03);
                }
                pushNews(`⚔️ ${from.toUpperCase()} défie ${to.toUpperCase()} (agents)`, 'rivalry');
                remember(`rivalry:${from}->${to}`);
            }
        }
        if (a.moveTo) {
            const b = buildings.find(x => x.id === a.moveTo);
            if (b) {
                const n = Math.min(10, Math.floor(5 + Math.random() * 6));
                for (let i = 0; i < n && i < people.length; i++) {
                    people[i].targetBuildingId = b.id;
                }
                pushNews(`➡️ Mouvement vers ${b.name} (agents)`, 'people');
                remember(`move:${b.id}`);
            }
        }
        if (a.setInvestments) {
            const ai = Math.max(0, Math.min(1, a.setInvestments.ai));
            const humanities = Math.max(0, Math.min(1, a.setInvestments.humanities));
            scenario.investmentAI = ai;
            scenario.investmentHumanities = humanities;
            pushNews(`💰 Politique: IA ${Math.round(ai * 100)}% / Humanités ${Math.round(humanities * 100)}%`, 'system');
            remember(`budget:${Math.round(ai * 100)}/${Math.round(humanities * 100)}`);
        }
        if (a.message)
            pushNews(a.message, 'system');
    }
}
