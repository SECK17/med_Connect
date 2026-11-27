# Tests du backend MedConnect

Tests d'intégration : ils lancent la vraie application Express et Socket.io contre une vraie
base PostgreSQL **dédiée aux tests**.

## Lancer les tests

```bash
cd backend
npm test
```

Par défaut, les tests utilisent la base `medconnect_test` (créée automatiquement si elle n'existe pas)
avec les identifiants `DB_USER`, `DB_PASSWORD`, `DB_HOST` et `DB_PORT` de votre `.env`.

> ⚠️ La base de test est **entièrement vidée** au début de chaque fichier de test.
> Par sécurité, les tests refusent de s'exécuter si le nom de la base ne contient pas « test ».
> Votre base de développement (`medconnect`) n'est donc jamais touchée.

Pour utiliser un autre serveur PostgreSQL, définissez ces variables :

```bash
TEST_DB_NAME=medconnect_test TEST_DB_USER=postgres TEST_DB_PASSWORD=... TEST_DB_HOST=localhost TEST_DB_PORT=5432 npm test
```

Pour lancer un seul fichier :

```bash
node --test tests/auth.test.js
```

## Ce qui est couvert

| Fichier | Sujet |
|---|---|
| `auth.test.js` | Inscription (rôles autorisés, mot de passe), vérification d'email, connexion, mot de passe oublié, limite anti brute-force |
| `acces-patient.test.js` | Qui peut lire et modifier le dossier d'un patient, création d'ordonnances, consultations et analyses |
| `fichiers.test.js` | Accès aux fichiers médicaux (`/uploads`), traversée de répertoire |
| `admin-hopital.test.js` | Un admin hôpital n'agit que sur son hôpital (rendez-vous, alertes, validation des médecins) |
| `messages.test.js` | Authentification Socket.io, usurpation d'identité, conversations, historique paginé |
| `sessions.test.js` | Jeton d'accès court, cookie de rafraîchissement (rotation, réutilisation), déconnexion, révocation |
| `validation.test.js` | Validation des données (formats, longueurs, champs inconnus), règles métier (RDV, avis, hôpital du médecin), compatibilité avec les formulaires du frontend |
| `routes-fumee.test.js` | Chaque route appelée au moins une fois avec un utilisateur autorisé (hôpitaux, admin d'hôpital, demandes de changement, don de sang, comptes, push…) |
| `deploiement.test.js` | Fonctionnement derrière nginx (Docker) : /api/health, IP réelle des visiteurs pour la limite anti brute-force, cookie Secure automatique en HTTPS |
| `migrations.test.js` | Migrations : base neuve, base existante créée par l'ancien sync (données conservées, schéma identique), verrou entre serveurs, nouvelle migration et annulation, détection d'un modèle modifié sans migration |
| `journal.test.js` | Journal d'accès aux dossiers : traçage des lectures, créations, suppressions, téléchargements et refus ; consultation par le patient et l'admin ; journal non modifiable ; purge |
| `pagination-securite.test.js` | Pagination optionnelle, notes des médecins, CORS, helmet, erreurs JSON |

## Écrire un nouveau test

Importez toujours `./helpers` **en premier** : ce fichier configure l'environnement de test.

```js
const h = require('./helpers');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

let app, patient;
before(async () => {
  await h.reinitialiserBase();
  app = h.charger().app;
  patient = await h.creerUtilisateur('patient');   // { user, token }
});
after(h.fermer);

test('exemple', async () => {
  const res = await request(app).get('/api/messages').set('Authorization', `Bearer ${patient.token}`);
  assert.equal(res.status, 200);
});
```

En mode test, aucun email n'est envoyé : `h.dernierEmail(email, 'verify-email' | 'reset-password')`
renvoie le dernier lien « envoyé ».
