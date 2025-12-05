export function updateAgentBehavior(person, time, // 0-24 float
buildings, env) {
    // Safety check: if person has no traits (e.g. old data), initialize them
    if (!person.traits) {
        person.traits = { introversion: 0.5, punctuality: 0.5, energy: 1.0 };
    }
    if (!person.schedule) {
        person.schedule = [{ time: 0, activity: 'sleep', targetId: buildings[0]?.id }];
    }
    if (!person.state) {
        person.state = { currentActivity: 'idle', mood: 'neutral', history: [] };
    }
    // 1. Decay Energy
    person.traits.energy = Math.max(0, person.traits.energy - 0.0001);
    // 2. Check Schedule
    const currentHour = time;
    const scheduledTask = person.schedule.find(s => currentHour >= s.time && currentHour < s.time + 4)
        || person.schedule[person.schedule.length - 1]; // Fallback to last task (usually sleep)
    if (!scheduledTask)
        return {};
    // 3. Decision Logic (LangGraph Node: "Scheduler")
    if (person.state.currentActivity !== scheduledTask.activity) {
        // Punctuality Check
        const isLate = currentHour > scheduledTask.time + (1 - person.traits.punctuality);
        if (isLate || Math.random() < 0.01) {
            // Transition State
            person.state.currentActivity = scheduledTask.activity;
            // 4. Target Selection (LangGraph Node: "Router")
            let targetId = scheduledTask.targetId;
            // If no specific target, choose based on traits/context
            if (!targetId) {
                if (scheduledTask.activity === 'leisure') {
                    targetId = chooseLeisureLocation(person, buildings, env);
                }
                else if (scheduledTask.activity === 'eat') {
                    targetId = chooseFoodLocation(person, buildings);
                }
            }
            // Update History
            if (targetId) {
                person.state.history.push(targetId);
                if (person.state.history.length > 5)
                    person.state.history.shift();
                return { targetId };
            }
        }
    }
    // 5. Mood Update (LangGraph Node: "Reaction")
    // If introvert is in crowded place -> Stressed
    const currentBuilding = buildings.find(b => b.id === person.targetBuildingId);
    if (currentBuilding && currentBuilding.occupancy > 20 && person.traits.introversion > 0.7) {
        return { mood: 'stressed' };
    }
    return {};
}
function chooseLeisureLocation(p, buildings, env) {
    // Filter candidates
    const parks = buildings.filter(b => b.id.includes('park'));
    const commercial = buildings.filter(b => b.zone === 'commercial');
    const library = buildings.filter(b => b.id === 'lib');
    // Logic
    if (p.traits.energy < 0.3)
        return p.schedule.find(s => s.activity === 'sleep')?.targetId || buildings[0].id; // Go home if tired
    if (p.traits.introversion > 0.6) {
        // Introvert preference
        return Math.random() > 0.5 ? library[0]?.id : parks[0]?.id;
    }
    else {
        // Extrovert preference
        return commercial[Math.floor(Math.random() * commercial.length)]?.id;
    }
}
function chooseFoodLocation(p, buildings) {
    const food = buildings.filter(b => b.id === 'cafe' || b.id === 'restaurant' || b.id === 'mall');
    return food[Math.floor(Math.random() * food.length)]?.id || buildings[0].id;
}
