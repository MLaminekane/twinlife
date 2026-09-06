# Twinlife Studio — La ville, vivante.

Twinlife est une simulation urbaine interactive située dans un territoire fictif de Saguenay. Explorez quatre quartiers en 3D, suivez les habitants et expérimentez les conséquences d’un festival, d’une tempête ou d’une heure de pointe.

L’application simule une ville : elle n’est pas synchronisée avec des capteurs municipaux. L’énergie, le confort et la pression des déplacements sont des estimations du modèle. L’import manuel de météo utilise Open-Meteo.

## Démarrer

Prérequis : Node.js 22.12+ (branche 22) ou 24+, et npm 10.9+.

```sh
npm ci
npm run dev
```

- Application : http://localhost:5173
- API : http://localhost:8787
- Le client et le serveur se rechargent automatiquement pendant le développement.

L’installation se fait uniquement à la racine. Le `package-lock.json` racine verrouille les deux workspaces `client` et `server`. Après une modification des dépendances, utilisez `npm install` à la racine.

Le copilote fonctionne en mode local sans clé. Pour activer un modèle, créez un fichier `server/.env` à partir de `server/.env.example`, puis renseignez `DEEPSEEK_API_KEY` ou `OPENAI_API_KEY`. Ne versionnez jamais ce fichier. Si les deux clés existent, DeepSeek est prioritaire.

## Explorer la ville

- **Vue d’ensemble** : population présente, occupation, énergie estimée, historique et événements.
- **Bâtiments** : sélection depuis la 3D, le plan interactif ou la recherche ; capacité, activité, horaires et occupants.
- **Habitants** : recherche nominative, suivi de caméra, destination, activité, humeur et énergie.
- **Scénarios** : heure de pointe, festival, tempête hivernale et nuit tranquille. Ils modifient les conditions et les déplacements ; le panneau compare occupation, piétons et énergie avec l’instant de lancement.
- **Copilote** : commandes en français, statut du service et résumé des changements réellement appliqués.
- **Réglages** : météo, saisons, import manuel des conditions de Saguenay, ombres, éclairage, qualité graphique et dynamiques de recherche.

Les points de vue Général, Campus, Centre-ville et Vue du ciel sont accessibles au-dessus de la scène. Les couches **Réaliste**, **Activité** et **Mobilité** montrent respectivement la ville, l’intensité des bâtiments et les trajets piétons. L’orbite cinématique, la capture PNG et le plein écran complètent l’exploration.

La frise permet de régler l’heure, de mettre en pause et d’accélérer à 1×, 3× ou 10×. À 1×, une journée simulée dure environ 15 minutes. L’export de rapport produit un JSON contenant l’environnement, les indicateurs, les bâtiments et l’historique disponible.

| Raccourci | Action                                      |
| --------- | ------------------------------------------- |
| `Espace`  | Pause / reprise                             |
| `1` à `4` | Points de vue                               |
| `K`       | Rechercher un lieu ou un habitant           |
| `Échap`   | Fermer une fenêtre ou quitter une sélection |

## Rendu et moteur

Le rendu comprend des façades et fenêtres instanciées, balcons, équipements de toiture, panneaux solaires, arbres, mobilier urbain, passages piétons, véhicules et piétons animés. L’éclairage, le brouillard et les précipitations suivent les conditions de la simulation.

Les habitants disposent d’un domicile, d’un rôle, d’horaires, de traits et d’un niveau d’énergie. La présence intérieure est distinguée des déplacements. Le moteur avance à une fréquence cible de 20 mises à jour par seconde ; une pause gèle l’horloge, l’activité, la population et la recherche. Les décisions autonomes via l’API sont désactivées par défaut et s’arrêtent aussi pendant la pause.

Les bâtiments et personnages personnalisés, ainsi que certaines préférences, sont conservés dans le stockage local du navigateur. Il ne s’agit pas d’une sauvegarde complète de la session ni d’une synchronisation entre appareils.

## Commandes utiles

```sh
npm test                    # Tests client et serveur
npm run build               # Compilation client et serveur
npm run test --workspace client
npm run test --workspace server
npm run start --workspace server
```

Le build client vérifie TypeScript sans émettre de JavaScript à côté des sources, puis produit `client/dist`. Le serveur compile vers `server/dist`. Les anciens fichiers `.js` présents dans `client/src` sont des artefacts historiques ; Vite donne priorité aux `.ts` et `.tsx`.

## Architecture

```text
client/src/
  components/ExperienceShell.tsx  Interface, panneaux et raccourcis
  components/City*.tsx           Caméra, atmosphère, piétons, circulation
  components/CommandCenter.tsx   Centre de commandes
  state/store.ts                État et boucle de simulation
  state/environmentLogic.ts     Horaires, rythme et population cible
  lib/world.ts                  Présence et navigation des habitants
  lib/urbanInsights.ts           Scénarios et indicateurs estimés
  lib/persistence.ts            Personnages et bâtiments personnalisés
server/src/
  index.ts                      Routes HTTP
  schemas.ts                    Validation des directives
  fallbackDirectives.ts         Commandes locales
  llmClient.ts                  Configuration du fournisseur de modèle
```

Stack : React 19, TypeScript, Vite 8, Three.js / React Three Fiber, Zustand, Express 5 et Zod. Les modules historiques Mapbox, finance et dialogue restent dans le dépôt ; ils ne font pas partie de l’écran Studio principal. Si le composant Mapbox est réactivé, son jeton public doit être fourni via `VITE_MAPBOX_TOKEN` dans `client/.env`, jamais inscrit directement dans les sources. N’utilisez aucune clé secrète dans une variable `VITE_*`, qui est exposée au navigateur.

## Limites actuelles

La géométrie urbaine est procédurale, les trajets utilisent un réseau simplifié et la circulation des véhicules est illustrative. Le modèle ne constitue ni une prévision de mobilité validée, ni un bilan énergétique réglementaire. La qualité graphique dépend du GPU ; le mode Équilibrée réduit la résolution et les effets. La météo et les fournisseurs LLM exigent une connexion réseau ; les fonctions de simulation locales restent utilisables sans eux.

Voir [les exemples](EXAMPLES.md), [le système de commandes](LLM_SYSTEM.md), [le guide des fichiers](ASSISTANT_GUIDE.txt) et [le rapport du projet](RAPPORT_PROJET.md).
