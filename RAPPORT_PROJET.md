# Rapport de projet — Twinlife Studio

Mise à jour : 5 septembre 2026.

## 1. Contexte et objectif

Twinlife explore la manière de rendre une simulation de campus et de ville compréhensible à travers une interface 3D et des commandes en français. Le périmètre réunit un campus, un centre-ville, des résidences et des commerces dans un territoire fictif de Saguenay.

Le projet est un prototype de simulation urbaine. Contrairement à un jumeau numérique opérationnel alimenté par des capteurs, sa population et ses événements sont générés localement. Il sert à explorer des comportements et des scénarios ; il ne produit pas de prévisions validées pour une collectivité.

## 2. Fonctionnalités livrées

### Exploration

L’interface Studio organise l’expérience autour d’une grande scène 3D, de panneaux contextuels, d’un plan interactif et d’une frise horaire. La recherche permet de sélectionner un lieu ou de suivre un habitant. Quatre points de vue, trois couches de visualisation, une orbite cinématique, le plein écran et l’export PNG facilitent la présentation.

### Réalisme visuel

Les bâtiments possèdent des façades différenciées, des fenêtres instanciées, des corniches et des équipements de toiture. Des balcons, panneaux solaires, arbres, bancs, éclairages de rue et passages piétons donnent une échelle à la ville. Le soleil, les ombres, le brouillard et les précipitations répondent à l’heure et aux conditions. Les véhicules illustrent la circulation ; les piétons correspondent aux habitants simulés en déplacement.

### Simulation

Les habitants disposent de rôles, domiciles, destinations, traits, emplois du temps et niveaux d’énergie. Le moteur distingue présence intérieure et déplacement. La météo, les heures d’ouverture et les préférences influencent l’activité. Une journée dure environ quinze minutes à vitesse normale.

Quatre scénarios modifient réellement le contexte : heure de pointe, festival, tempête hivernale et nuit tranquille. Une comparaison avec l’instant de lancement montre les variations d’occupation, de marcheurs et d’énergie estimée. Les rapports JSON exportent les données observées durant la session.

### Commandes

Le copilote utilise des règles locales ou un fournisseur configuré côté serveur. Il peut accueillir une personne nommée, créer un lieu, ajuster une activité ou un horaire et orienter des groupes. Chaque réponse affiche les changements effectivement appliqués. Les décisions automatiques sont optionnelles et respectent la pause.

## 3. Architecture

Le dépôt npm utilise deux workspaces. Le client React 19 / Vite 8 s’appuie sur Three.js, React Three Fiber et Zustand. L’API Express 5 valide les échanges avec Zod et orchestre les commandes locales ou les fournisseurs de modèles.

La simulation s’exécute dans le client à une fréquence cible de vingt mises à jour par seconde. La scène est rendue indépendamment par React Three Fiber. Les objets répétitifs utilisent l’instanciation afin de limiter les appels de dessin. Les réglages graphiques permettent de réduire la résolution et le post-traitement.

Les sources TypeScript sont prioritaires sur les anciens fichiers JavaScript adjacents. Le build client ne génère plus d’artefacts à côté des sources. Un seul verrouillage npm garantit l’installation des deux workspaces.

## 4. Corrections structurantes

- La pause gèle désormais l’horloge, la population, l’activité, la recherche et les déplacements.
- La vitesse agit de manière cohérente sur les mécanismes du moteur.
- Les marcheurs ne sont plus réabsorbés immédiatement par leur bâtiment de départ.
- Un budget de déplacement peut traverser plusieurs points de passage sans perte de distance.
- Les ordres temporaires ne sont plus immédiatement annulés par les horaires individuels.
- Les sauvegardes ne dupliquent plus systématiquement les habitants de base.
- Les créations personnalisées et les références aux bâtiments sont conservées de manière cohérente.
- Les appels d’agents sont sérialisés, annulables et empêchés de modifier un monde mis en pause.
- Les échecs de météo ne sont plus présentés comme de fausses observations réelles.

## 5. Vérification

`npm test` exécute les suites du client et du serveur. Elles couvrent notamment pause, vitesse, horloge, population, présence, trajet, persistance, scénarios, commandes locales, validation des schémas, erreurs météo et annulation des appels d’agents. `npm run build` vérifie la compilation des deux workspaces.

La validation visuelle automatisée dans un navigateur reste à effectuer : le navigateur intégré était indisponible et l’utilisation d’un navigateur alternatif n’a pas été autorisée pendant cette intervention. La compilation et les tests ne garantissent pas, à eux seuls, le rendu sur tous les GPU et formats d’écran.

## 6. Limites et prolongements

Le réseau de navigation reste simplifié. Les mouvements des véhicules ne proviennent pas d’un modèle de trafic calibré. L’énergie et le confort utilisent des formules indicatives, sans données de bâtiments réels. La géométrie n’est pas une reconstruction cadastrale de Saguenay.

La persistance est locale au navigateur et ne couvre pas une restauration complète de session. Une synchronisation multiutilisateur, un import de données géographiques, un moteur de navigation avec évitement intégral des obstacles et une validation par observations terrain constituent des prolongements possibles. Les modules historiques de cartographie et de finance sont conservés dans le dépôt mais ne sont pas intégrés à l’écran Studio principal.

L’import manuel de météo dépend d’Open-Meteo. Les modèles de langage exigent leurs propres clés et une connexion réseau. Le mode local permet de conserver les fonctions essentielles de simulation et de commande.
