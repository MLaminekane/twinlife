/**
 * Système de persistance pour sauvegarder l'état de la simulation
 * Permet de garder les modifications du LLM même après rechargement
 */
const STORAGE_KEYS = {
    CUSTOM_BUILDINGS: 'twinlife_v2_custom_buildings',
    CUSTOM_PEOPLE: 'twinlife_v2_custom_people',
    MODIFIED_BUILDINGS: 'twinlife_v2_modified_buildings',
    LAST_SAVE: 'twinlife_v2_last_save'
};
/**
 * Sauvegarder les bâtiments personnalisés
 */
export function saveCustomBuildings(buildings) {
    const customBuildings = buildings.filter(b => b.isCustom);
    const data = {
        buildings: customBuildings.map(b => ({
            ...b,
            modifiedAt: Date.now()
        })),
        timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.CUSTOM_BUILDINGS, JSON.stringify(data));
}
/**
 * Charger les bâtiments personnalisés
 */
export function loadCustomBuildings() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_BUILDINGS);
        if (!stored)
            return [];
        const data = JSON.parse(stored);
        const buildings = data.buildings || [];
        // Filter out unwanted buildings (temporary cleanup)
        return buildings.filter((b) => {
            const name = b.name.toLowerCase();
            return !name.includes('apple campus') &&
                !name.includes('hopital central') &&
                !name.includes('apple park') &&
                !name.includes('Résidence Familiale Nord');
        });
    }
    catch (e) {
        console.error('Failed to load custom buildings:', e);
        return [];
    }
}
/**
 * Sauvegarder les personnes personnalisées
 */
export function saveCustomPeople(people) {
    const customPeople = people.filter(p => p.role || p.workplace || p.department);
    const data = {
        people: customPeople.map(p => ({
            ...p,
            modifiedAt: Date.now()
        })),
        timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PEOPLE, JSON.stringify(data));
}
/**
 * Charger les personnes personnalisées
 */
export function loadCustomPeople() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_PEOPLE);
        if (!stored)
            return [];
        const data = JSON.parse(stored);
        const people = data.people || [];
        // Migration: Ensure state exists
        return people.map((p) => ({
            ...p,
            state: p.state || { currentActivity: 'idle', mood: 'neutral', history: [] }
        }));
    }
    catch (e) {
        console.error('Failed to load custom people:', e);
        return [];
    }
}
/**
 * Sauvegarder les modifications de bâtiments existants
 */
export function saveModifiedBuildings(modifications) {
    const data = {
        modifications,
        timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.MODIFIED_BUILDINGS, JSON.stringify(data));
}
/**
 * Charger les modifications de bâtiments
 */
export function loadModifiedBuildings() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.MODIFIED_BUILDINGS);
        if (!stored)
            return {};
        const data = JSON.parse(stored);
        return data.modifications || {};
    }
    catch (e) {
        console.error('Failed to load modified buildings:', e);
        return {};
    }
}
/**
 * Sauvegarder l'état complet
 */
export function saveState(buildings, people) {
    saveCustomBuildings(buildings);
    saveCustomPeople(people);
    localStorage.setItem(STORAGE_KEYS.LAST_SAVE, Date.now().toString());
}
/**
 * Effacer toutes les données persistées
 */
export function clearPersistedData() {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
}
/**
 * Obtenir la date de la dernière sauvegarde
 */
export function getLastSaveTime() {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_SAVE);
    return stored ? parseInt(stored, 10) : null;
}
