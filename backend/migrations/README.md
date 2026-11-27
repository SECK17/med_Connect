# Migrations de la base de données

Le schéma de la base n'est plus créé par `sequelize.sync({ alter: true })`, qui pouvait
modifier ou perdre des données à chaque démarrage. Il évolue maintenant par **migrations** :
des fichiers versionnés, appliqués une seule fois chacun et dans l'ordre. La table
`schema_migrations` garde la liste de ceux qui sont déjà appliqués.

## Commandes

| Commande | Effet |
|---|---|
| `npm run migrate` | Applique les migrations en attente, puis vérifie que les modèles correspondent à la base |
| `npm run migrate:statut` | Liste les migrations appliquées et en attente |
| `npm run migrate:annuler` | Annule la dernière migration appliquée (appelle son `down`) |
| `npm run migration:creer -- <nom>` | Crée un fichier vide `AAAAMMJJHHMMSS-<nom>.js` |

Au démarrage, le serveur applique lui-même les migrations en attente. Avec
`MIGRATIONS_AUTO=false` (dans `.env`), il refuse de démarrer tant qu'il en reste : vous
lancez alors `npm run migrate` vous-même, par exemple après une sauvegarde.
Un verrou PostgreSQL empêche deux serveurs de migrer en même temps.

## Modifier le schéma (ajouter une colonne, une table, un index…)

1. Créez la migration : `npm run migration:creer -- ajouter-ville-patient`
2. Écrivez `up` (le changement) et `down` (son annulation) :
   ```js
   module.exports = {
     async up({ context: { queryInterface, Sequelize } }) {
       await queryInterface.addColumn('patients', 'ville', { type: Sequelize.STRING(100), allowNull: true });
     },
     async down({ context: { queryInterface } }) {
       await queryInterface.removeColumn('patients', 'ville');
     },
   };
   ```
3. Mettez à jour le modèle (`src/models/Patient.js`) **dans le même commit**.
4. `npm run migrate`, puis `npm test`.

Si vous modifiez un modèle sans écrire de migration, le serveur affiche un avertissement au
démarrage, et `npm run migrate` ainsi que les tests échouent, en indiquant la colonne ou la
table concernée.

**Règles :**
- Ne modifiez jamais une migration déjà appliquée quelque part : écrivez-en une nouvelle.
- Pour une colonne obligatoire sur une table qui contient déjà des données, donnez une
  valeur par défaut (`defaultValue`), ou ajoutez la colonne en facultatif, remplissez-la,
  puis rendez-la obligatoire.

## La migration de référence `0001-schema-initial`

Elle contient le schéma complet de l'application au moment où les migrations ont été
adoptées (novembre 2026). Elle a été générée avec `pg_dump`, puis rendue *idempotente* :

- **base vide** : elle crée tout ;
- **base existante créée par l'ancien `sync`** : elle ajoute seulement ce qui manque
  (tables, colonnes, contraintes, index, valeurs d'ENUM). Elle ne supprime ni ne modifie
  aucune donnée, sauf deux conversions qui conservent les valeurs : `users.role` et
  `rendez_vous.statut` passent d'ENUM à VARCHAR. Si une contrainte ne peut pas être posée
  parce que d'anciennes données ne la respectent pas (par exemple des doublons), un
  avertissement PostgreSQL le signale et le reste de la migration s'applique.

Elle ne peut pas être annulée.

### Première mise en route sur une base existante

```bash
pg_dump -U postgres -Fc medconnect > sauvegarde-avant-migrations.dump   # sauvegarde
npm run migrate                                                         # ou simplement : npm start
```
