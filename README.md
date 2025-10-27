# Twinlife — Digital Twin Universitaire

Un jumeau numérique de campus universitaire avec visualisation 3D temps réel, tableau de bord analytique, et intégration LLM pour piloter des scénarios.

## Caractéristiques

- 3D réaliste (Three.js via React Three Fiber)
- 8 bâtiments nommés avec ombres, fenêtres animées, glow
- 200 personnes animées se déplaçant entre les bâtiments
- Barres d’activité sous chaque bâtiment
- Grille de campus avec rues: Avenue Principale, Allée Ouest
- Dashboard (coin supérieur gauche) avec métriques: total personnes, bâtiments actifs, occupation totale
- Panneau de contrôles: pause, vitesse, filtres, options glow/shadows/labels
- Boîte LLM pour influencer la simulation (ex: « Augmente l’activité en Sciences »)

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
