# Système LLM Dynamique - Twinlife

## 🎯 Fonctionnalités

Le système LLM peut maintenant modifier dynamiquement la simulation avec **persistance complète** :

### ✨ Création de Personnes

- Ajouter des personnes avec **nom spécifique**
- Définir un **rôle** : `student`, `employee`, `professor`, `visitor`, `worker`
- Assigner un **lieu de travail** (workplace)
- Définir un **département**

**Exemples :**

```
"ajoute Lamine comme employé à la banque"
"crée un professeur nommé Marie au département de médecine"
"ajoute 5 étudiants à l'université"
```

### 🏢 Création de Bâtiments

- Créer des bâtiments personnalisés
- Définir la **zone** : `campus`, `downtown`, `residential`, `commercial`
- Spécifier position et taille (optionnel)
- Niveau d'activité initial

**Exemples :**

```
"crée un nouveau café dans la zone commerciale"
"ajoute un laboratoire de recherche sur le campus"
"construis un immeuble résidentiel"
```

### 🗑️ Suppression

- Supprimer des bâtiments par nom ou ID
- Supprimer des personnes par nom ou ID
- Supprimer toutes les personnes

**Exemples :**

```
"supprime le bâtiment café"
"retire la personne Lamine"
"supprime tous les visiteurs"
```

## 💾 Persistance

**TOUTES les modifications sont sauvegardées automatiquement dans le localStorage :**

- Les personnes créées par le LLM restent même après rechargement
- Les bâtiments personnalisés sont persistants
- Les métadonnées (rôles, lieux de travail) sont conservées

### Gestion de la persistance

```typescript
import {
  saveState,
  loadCustomBuildings,
  loadCustomPeople,
  clearPersistedData,
} from "./lib/persistence";

// Charger au démarrage (automatique)
const customBuildings = loadCustomBuildings();
const customPeople = loadCustomPeople();

// Sauvegarder (automatique après chaque directive)
saveState(buildings, people);

// Effacer toutes les données
clearPersistedData();
```

## 🔧 API LLM

### Structure des directives

```typescript
type Directive = {
  peopleAdd?: [
    {
      count: number;
      name?: string; // Nom spécifique
      role?: "student" | "employee" | "professor" | "visitor" | "worker";
      workplace?: string; // Nom du bâtiment
      department?: string;
      to?: string; // Destination initiale
      gender?: "male" | "female";
    }
  ];

  buildingAdd?: [
    {
      name: string;
      zone?: "campus" | "downtown" | "residential" | "commercial";
      activity?: number; // 0-1
      position?: [x, y, z];
      size?: [w, h, d];
    }
  ];

  buildingRemove?: string[]; // IDs ou noms

  peopleRemove?: [
    {
      name?: string;
      id?: number;
      all?: boolean;
    }
  ];

  // ... autres propriétés existantes
};
```

### Exemples de requêtes

1. **Ajouter une personne spécifique :**

```
User: "ajoute Lamine comme employé à la banque"
LLM: {
  "peopleAdd": [{
    "count": 1,
    "name": "Lamine",
    "role": "employee",
    "workplace": "banque"
  }]
}
```

2. **Créer un bâtiment :**

```
User: "crée un nouveau restaurant dans la zone commerciale"
LLM: {
  "buildingAdd": [{
    "name": "Restaurant Le Gourmet",
    "zone": "commercial",
    "activity": 0.7
  }]
}
```

3. **Supprimer :**

```
User: "supprime Lamine"
LLM: {
  "peopleRemove": [{
    "name": "Lamine"
  }]
}
```

## 🎨 Interface Utilisateur

### Panneau LLM

Le composant `LLMPanel` affiche :

- Zone de saisie pour les commandes
- Liste des personnes personnalisées avec leurs métadonnées
- Exemples de commandes
- État de chargement

### Intégration

```tsx
import { LLMPanel } from "./components/LLMPanel";

// Dans App.tsx
<button onClick={() => setShowLLM((v) => !v)}>🤖 Assistant LLM</button>;
{
  showLLM && <LLMPanel />;
}
```

## 🔄 Workflow

1. **L'utilisateur entre une commande** : "ajoute Lamine à la banque"
2. **Le LLM génère une directive** JSON structurée
3. **La directive est appliquée** au store
4. **Les modifications sont sauvegardées** automatiquement dans localStorage
5. **Au rechargement**, les données sont **restaurées automatiquement**

## 🛡️ Validation

Tous les schémas sont validés avec Zod :

- `server/src/schemas.ts` - Validation serveur
- `client/src/lib/api.ts` - Validation client
- Types TypeScript stricts pour la sécurité

## 📝 Notes importantes

- Les bâtiments personnalisés ont la propriété `isCustom: true`
- Les positions non spécifiées sont calculées automatiquement pour éviter les chevauchements
- Les personnes supprimées d'un bâtiment sont réaffectées automatiquement
- La persistance est basée sur localStorage (limite ~5-10MB selon le navigateur)

## 🚀 Prochaines améliorations possibles

- Export/import JSON des configurations
- Interface graphique pour éditer les personnes
- Historique des modifications (undo/redo)
- Recherche et filtrage avancé
- Statistiques sur les personnes par rôle/lieu
