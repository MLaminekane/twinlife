# Explorer Twinlife Studio

## Une visite en deux minutes

1. Ouvrez l’application, choisissez **Campus**, puis cliquez sur un bâtiment pour découvrir ses occupants.
2. Dans **Habitants**, sélectionnez une personne : la caméra suit sa trajectoire. Revenez à la vue générale pour interrompre le suivi.
3. Passez sur la couche **Mobilité** pour afficher les trajets des marcheurs.
4. Ouvrez **Scénarios** et lancez **La ville en fête**. Observez les destinations, l’occupation et les écarts par rapport au lancement.
5. Lancez **Tempête hivernale** : les conditions, le confort estimé et les déplacements évoluent.
6. Exportez une vue PNG ou un rapport JSON depuis la console.

## Commandes locales du copilote

Ces commandes utilisent le serveur local sans nécessiter de modèle connecté :

```text
Ajoute Léa comme étudiante à la bibliothèque
Ajoute un bâtiment nommé Atelier
Augmente l’activité de la bibliothèque
Passe en soirée
Mets l’heure à 18h30
Mets la météo en neige à -8 degrés
Envoie 8 personnes vers la bibliothèque
```

Les suggestions préremplissent le champ : cliquez sur Envoyer pour appliquer une commande. Le résultat indique les changements réellement effectués. Une demande non reconnue peut produire « Aucun changement appliqué ».

Une demande complexe peut nécessiter un fournisseur LLM configuré. Vérifiez le statut affiché dans le copilote. Une clé configurée ne garantit pas que le fournisseur est joignable ; en cas d’échec, les règles locales peuvent prendre le relais.

## Comparer les rythmes

| Scénario          | Changement principal                  | À observer                                    |
| ----------------- | ------------------------------------- | --------------------------------------------- |
| Heure de pointe   | Trajets vers les bureaux et le campus | Marcheurs et arrivées                         |
| La ville en fête  | Soirée estivale, visiteurs et loisirs | Commerces, parc, occupation                   |
| Tempête hivernale | Neige, froid et mise à l’abri         | Vitesse de marche, confort et énergie estimés |
| Nuit tranquille   | Retour vers les domiciles             | Résidences et services essentiels             |

Les événements durent 180 secondes du moteur, donc moins longtemps lorsque la vitesse augmente. Le réglage du contexte reste visible après la fin des ordres temporaires. Les indicateurs reflètent la simulation, pas une mesure de la ville réelle.

## Sauvegardes et exports

Les créations personnalisées et les préférences sont locales à ce navigateur. L’export JSON est un rapport de session ; il n’existe pas encore d’import de session complète. Une capture PNG enregistre la scène 3D, sans les panneaux de l’interface.
