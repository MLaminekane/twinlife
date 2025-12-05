# Twinlife — Digital Twin Universitaire

Un jumeau numérique de campus universitaire avec visualisation 3D temps réel, tableau de bord analytique, carte Mapbox de Saguenay et intégration LLM pour piloter des scénarios en langage naturel.

## Présentation de la Problématique / Contexte d'Utilisation

Les directions d'université, DSI et équipes pédagogiques ont besoin d'une vue dynamique et compréhensible des activités du campus: affluence par bâtiment, flux de personnes, occupation, et influence du contexte (heure, saison, week‑end). Les outils classiques fragmentent ces informations et rendent difficile l'exploration de scénarios (ex. journée d'examens, midi, événement spécial) en temps réel. Twinlife propose un jumeau numérique interactif permettant d'observer, simuler et expliquer ces phénomènes, avec une interface accessible et des commandes en langage naturel.

## ✨ Nouvelles Fonctionnalités LLM (Décembre 2025)

### 🤖 Assistant LLM Dynamique avec Persistance Complète

Le système LLM peut maintenant **modifier dynamiquement** la simulation avec **sauvegarde automatique** :

- **Créer des personnes** avec nom, rôle, lieu de travail et département
- **Ajouter des bâtiments** dans les 4 zones (campus, downtown, residential, commercial)
- **Supprimer** personnes et bâtiments
- **Persistance localStorage** : toutes les modifications survivent au rechargement

### Exemples de Commandes :

```
"ajoute Lamine comme employé à la banque"
"crée un nouveau café dans la zone commerciale"
"ajoute 5 étudiants à l'université"
"construis un laboratoire de recherche sur le campus"
"supprime le bâtiment X"
```

📖 **Documentation détaillée** : [LLM_SYSTEM.md](./LLM_SYSTEM.md)

## Brève Description du Projet

Twinlife est une application temps réel composée d’un front 3D (React + React Three Fiber) et d’une API Express. Elle affiche le campus, ~200 personnes en mouvement, des indicateurs d’activité et une carte Mapbox centrée sur Saguenay qui visualise la population (heatmap et points). Le public cible inclut: décideurs académiques, responsables de services (logistique, sécurité, DSI), urbanistes/architectes, chercheurs en mobilité et étudiants.

## Diagramme d’Architecture (Haut Niveau)

```mermaid
flowchart TB
	subgraph Client[Client (React + R3F + Mapbox)]
		U[Utilisateur]
		UI[UI & Panneau de Contrôles]
		ST[Zustand Store]
		SCN[Scène 3D\n(Bâtiments, Personnes, HUD)]
	MAP[Mapbox Saguenay\n(Heatmap + Points)]
		U -->|Saisie, clics| UI
		UI -->|applyDirective| ST
		ST -->|tick| SCN
		ST -->|people → GeoJSON| MAP
	end

	subgraph Server[Serveur (Express + Zod)]
		API[/POST /api/llm/]
		PARSER[Validation Zod\nDirective]
		DS{Clé LLM ?}
		LLM[(DeepSeek / OpenAI)]
		F[Fallback Rules FR]
	end

	UI -- prompt FR --> API
	API --> PARSER
	PARSER --> DS
	DS -- Oui --> LLM
	DS -- Non --> F
	LLM -->|Directive JSON| PARSER
	F -->|Directive JSON| PARSER
	PARSER -->|Directive JSON| UI
```

Explications rapides:

- Le client envoie le prompt en français à l’API (`/api/llm`).
- Le serveur choisit DeepSeek/OpenAI si une clé est disponible, sinon applique des règles de secours (fallback) robustes en FR.
- Le serveur renvoie une Directive JSON validée par Zod (activité, ajout de personnes/bâtiments, visibilité, environnement…).
- Le store côté client applique la directive et la boucle de simulation (tick) met à jour la scène 3D et la carte Mapbox (population en direct).

## Rôle du LLM et Valeur Ajoutée

Rôle:

- Traduire des demandes en langage naturel (ex. « augmente l’activité en Sciences et Ingénierie », « journée d’examens », « midi », « cache Droit ») en une Directive JSON structurée.
- Permettre la manipulation rapide des paramètres (activité, flux, population, visibilité, environnement) sans menus complexes.

Valeur ajoutée vs méthodes traditionnelles:

- Expressivité: pas besoin d’UI compliquée ni de scripts — le texte suffit.
- Rapidité d’itération: enchaînez des scénarios (examens, événements, midi/soir, week‑end) instantanément.
- Personnalisation: les prompts s’adaptent au contexte (saisons, période de la journée, week‑end) et au vocabulaire local.
- Résilience: si aucune clé LLM n’est disponible, un fallback FR couvre les cas courants (activités, visibilité, population, scénarios types).

## Caractéristiques

- 3D réaliste (Three.js via React Three Fiber)
- 8 bâtiments nommés avec ombres, fenêtres animées, glow
- ~200 personnes animées se déplaçant entre les bâtiments (population dynamique)
- Barres d’activité sous chaque bâtiment
- Grille de campus avec rues: Avenue Principale, Allée Ouest
- Dashboard (coin supérieur gauche) avec métriques: total personnes, bâtiments actifs, occupation totale
- Panneau de contrôles: pause, vitesse, filtres, options glow/shadows/labels
- Boîte LLM pour influencer la simulation (ex: « Augmente l’activité en Sciences »)
- Carte Mapbox Saguenay: heatmap + points de la population simulée, mode plein écran

## Démarrage rapide

1. Installer les dépendances

```sh
npm install
npm --prefix client install
npm --prefix server install
```

2. Configurer la clé LLM (optionnel mais recommandé)

- Copier `server/.env.example` vers `server/.env` et renseigner `OPENAI_API_KEY`

3. Lancer en développement

```sh
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:8787

## Scripts utiles

- `npm run dev` lance client + serveur en parallèle
- `npm run build` construit client et serveur
- `npm run test` exécute les tests côté client (Vitest)

## Structure

- `client/` application React + R3F
- `server/` API Express + LLM

## Notes

- Sans `OPENAI_API_KEY`, le serveur utilise un générateur de règles simple.
- Le client proxifie `/api` vers le serveur (port 8787).
