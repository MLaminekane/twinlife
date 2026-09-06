# Centre de commandes — Twinlife Studio

Le copilote traduit une instruction en directive structurée, validée côté serveur et côté client, puis l’applique au moteur de simulation. La création d’un lieu ou d’un habitant fonctionne aussi avec les règles locales.

## Modes de fonctionnement

`GET /api/status` indique le mode configuré :

```json
{ "mode": "local", "provider": null }
```

Avec une clé, `mode` vaut `llm` et `provider` indique `DeepSeek` ou `OpenAI`. Aucune clé n’est renvoyée. Le statut décrit la configuration : il ne constitue pas un test de disponibilité du fournisseur.

`server/src/llmClient.ts` choisit DeepSeek en priorité, sinon OpenAI. Sans clé, les fonctions de génération utilisent les règles locales. Si une requête au modèle échoue ou produit une directive invalide, elles peuvent aussi utiliser ces règles.

## Routes

| Route                     | Rôle                                                         |
| ------------------------- | ------------------------------------------------------------ |
| `GET /api/status`         | Mode et fournisseur configuré                                |
| `POST /api/llm`           | Transformer `{ "prompt": "…" }` en directive                 |
| `POST /api/agent`         | Décisions structurées d’un lot d’agents                      |
| `POST /api/chat/dialogue` | Route historique de dialogue ; non intégrée à l’écran Studio |

Les payloads invalides reçoivent une réponse HTTP 400. Le serveur applique une limitation de fréquence aux routes `/api/`. Les requêtes client disposent d’une durée maximale et peuvent être annulées.

## Directives

Les schémas de référence se trouvent dans `server/src/schemas.ts` et `client/src/lib/api.ts`. Ils couvrent notamment :

- Ajout de personnes : nom, quantité, rôle, destination, lieu de travail et métadonnées.
- Ajout de bâtiments : nom, quartier, type, capacité, position et dimensions.
- Suppression de personnes ou de bâtiments, selon la directive reçue.
- Niveau ou variation d’activité et événements des bâtiments.
- Déplacements de groupes entre une source et une destination.
- Heure, saison, météo, température et rythme de semaine.
- Vitesse, visibilité, éclairage, ombres et effets temporaires.

La suppression conserve au moins un bâtiment et réassigne les références devenues invalides. Les ordres de déplacement persistent suffisamment longtemps pour ne pas être immédiatement écrasés par l’emploi du temps de l’habitant.

Le centre de commandes compare l’état avant et après l’application. Il distingue une modification effective d’une demande sans effet et garde jusqu’à huit échanges tant que le panneau reste monté.

## Décisions autonomes

L’option des Réglages active `AgentLoop.tsx`. Une boucle stable examine l’état courant toutes les trois secondes. Elle sérialise les appels : une seule requête peut être en cours. Environ toutes les quinze secondes, elle peut réorienter un groupe vers un lieu actif ; sinon elle sollicite des décisions de recherche et collaboration.

La pause ou la désactivation annule la requête en cours. Une réponse reçue après une pause ne modifie pas la ville. Les scénarios lancés par l’utilisateur sont respectés par les décisions urbaines automatiques.

## Persistance

Les bâtiments `isCustom` et les personnes `isCustom` sont sauvegardés localement après les directives. Le chargeur migre les anciennes sauvegardes qui contenaient toute la population de base, afin d’éviter les duplications.

Les positions de tous les habitants, le journal complet, les effets temporaires et l’ensemble des suppressions de bâtiments prédéfinis ne constituent pas une sauvegarde intégrale. Les données restent propres au navigateur utilisé. Le rapport JSON exportable est un document d’observation, pas un format de restauration.

## Validation

```sh
npm run test --workspace server
npm run test --workspace client
```

Les tests vérifient les suggestions du copilote, les noms, quantités, lieux, horaires et conditions, les faux positifs, la préservation des champs par les schémas, les erreurs réseau et l’arrêt des décisions pendant une pause.
