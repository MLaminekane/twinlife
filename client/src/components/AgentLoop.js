import { useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import { sendAgentsDecision, sendLLM } from '../lib/api';
export function AgentLoop() {
    const llmAgents = useStore(s => s.scenario.llmAgents);
    const agents = useStore(s => s.agents);
    const departments = useStore(s => s.departments);
    const scenario = useStore(s => s.scenario);
    const applyAgentActions = useStore(s => s.applyAgentActions);
    const applyDirective = useStore(s => s.applyDirective);
    const news = useStore(s => s.news);
    const buildings = useStore(s => s.buildings);
    const people = useStore(s => s.people);
    const environment = useStore(s => s.environment);
    const timer = useRef(null);
    const godTimer = useRef(null);
    // Individual Agents Loop
    useEffect(() => {
        if (!llmAgents) {
            if (timer.current) {
                window.clearInterval(timer.current);
                timer.current = null;
            }
            return;
        }
        timer.current = window.setInterval(async () => {
            try {
                const sampleSize = 6;
                const sample = agents.sort(() => 0.5 - Math.random()).slice(0, sampleSize);
                if (!sample.length)
                    return;
                const world = {
                    investments: { ai: scenario.investmentAI, humanities: scenario.investmentHumanities },
                    departments: departments.map(d => ({ id: d.id, name: d.name, publications: d.publications, activity: (useStore.getState().buildings.find(b => b.id === d.buildingId)?.activity ?? 0.5) })),
                    recentNews: news.slice(-10).map(n => n.text)
                };
                const payload = { agents: sample.map(a => ({ id: a.id, role: a.role, dept: a.dept, buildingId: a.buildingId, biases: a.biases, goals: [], memory: a.memory?.slice(-6) ?? [] })), world };
                const res = await sendAgentsDecision(payload);
                applyAgentActions(res.actions);
            }
            catch (e) {
                // ignore errors
            }
        }, 3000);
        return () => { if (timer.current) {
            window.clearInterval(timer.current);
            timer.current = null;
        } };
    }, [llmAgents, agents, departments, scenario.investmentAI, scenario.investmentHumanities]);
    // God Mode / Mayor Loop
    useEffect(() => {
        if (!llmAgents) {
            if (godTimer.current) {
                window.clearInterval(godTimer.current);
                godTimer.current = null;
            }
            return;
        }
        // Run every 15 seconds to allow for major changes
        godTimer.current = window.setInterval(async () => {
            try {
                const state = {
                    population: people.length,
                    buildingCount: buildings.length,
                    season: environment.season,
                    time: environment.dayPeriod,
                    recentNews: news.slice(-5).map(n => n.text),
                    buildings: buildings.map(b => b.name).join(', ')
                };
                const prompt = `
          You are the autonomous AI GOD and MAYOR of this city simulation.
          Current State:
          - Population: ${state.population}
          - Buildings: ${state.buildingCount} (${state.buildings})
          - Environment: ${state.season}, ${state.time}
          - Recent News: ${state.recentNews.join(' | ')}

          YOUR GOAL: Make the simulation alive, dynamic, and interesting.
          You have FULL CONTROL. You can:
          - Add new people (students, workers, visitors) with specific roles.
          - Add new buildings (startups, shops, services).
          - Create conflicts or alliances (via news or events).
          - Manage the economy (add businesses).
          - Change the environment/weather.
          
          Do NOT just observe. ACT. Create chaos or order. Add a startup? Add a protest? Add a festival?
          If the population is low (< 550), add more people.
          If there are few buildings, add a new one (e.g. "Tech Startup", "Coffee Shop").
          
          Output a JSON directive to execute your will.
        `;
                const directive = await sendLLM(prompt);
                applyDirective(directive);
            }
            catch (e) {
                console.error("God Mode Error:", e);
            }
        }, 15000);
        return () => { if (godTimer.current) {
            window.clearInterval(godTimer.current);
            godTimer.current = null;
        } };
    }, [llmAgents, people.length, buildings.length, environment.season, environment.dayPeriod]);
    return null;
}
