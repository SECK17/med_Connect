# MedConnect

Plateforme web de santé qui relie patients, médecins, hôpitaux et donneurs de sang :
prise de rendez-vous, dossier médical partagé, messagerie en temps réel et alertes de don
de sang géolocalisées.

## Fonctionnalités

| Rôle | Ce qu'il peut faire |
|---|---|
| **Patient** | Trouver un médecin ou un hôpital, prendre et annuler des rendez-vous, consulter son dossier (ordonnances, analyses, consultations), le partager avec un médecin, voir **qui a accédé à son dossier**, échanger avec ses médecins, noter un médecin après un rendez-vous |
| **Médecin** | Gérer ses rendez-vous et ses disponibilités, consulter le dossier des patients qu'il suit, rédiger ordonnances et comptes-rendus, envoyer des résultats d'analyse, échanger avec ses patients, demander un changement d'hôpital |
| **Donneur de sang** | Indiquer son groupe sanguin et sa position, recevoir les alertes des hôpitaux proches et y répondre |
| **Admin d'hôpital** | Valider les médecins de son établissement, répartir les rendez-vous, voir les patients et donneurs, lancer des alertes de don de sang (rayon, durée, urgence) |
| **Administrateur** | Gérer les utilisateurs et les hôpitaux, valider les médecins et les demandes de changement d'hôpital, consulter le journal d'accès aux dossiers (par l'API pour l'instant) |

Parcours d'un rendez-vous : le patient le demande, l'admin de l'hôpital le transfère au
médecin, puis le médecin le confirme ou l'annule. Le patient est prévenu par email de la
confirmation ou de l'annulation.

## Technologies

- **Frontend** : React 18, Vite, Tailwind CSS, React Router, Leaflet (cartes), Recharts, Socket.io client
- **Backend** : Node.js, Express 5, Sequelize 6, Socket.io, JWT, Zod (validation), Umzug (migrations), Nodemailer, Web Push
- **Base de données** : PostgreSQL
- **Déploiement** : Docker Compose (PostgreSQL + API + nginx)

## Démarrage rapide avec Docker

```bash
cp .env.docker.example .env      # remplir DB_PASSWORD, JWT_SECRET, ADMIN_CODE
docker compose up -d --build
```

Le site est ensuite sur **http://localhost:8080**. Créez le premier administrateur sur
`/create-admin` avec votre `ADMIN_CODE`. Sauvegardes, HTTPS et reprise d'une base
existante : voir [DOCKER.md](DOCKER.md).

## Installation pour le développement

Prérequis : Node.js 20.19 ou plus récent, et PostgreSQL 14 ou plus récent.

**1. Base de données**

```sql
CREATE DATABASE medconnect;
```

**2. Backend** (http://localhost:5000)

```bash
cd backend
cp .env.example .env     # renseigner DB_*, JWT_SECRET, ADMIN_CODE
npm install
npm run dev              # crée le schéma (migrations) puis démarre avec rechargement automatique
```

**3. Frontend** (http://localhost:5173)

```bash
cd frontend
cp .env.example .env     # VITE_API_URL=http://localhost:5000
npm install
npm run dev
```

Sans SMTP configuré (`EMAIL_USER` et `EMAIL_PASS`), les liens de vérification d'email et
de mot de passe oublié s'affichent dans le terminal du backend.

### Principales variables d'environnement (`backend/.env`)

| Variable | Rôle |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Connexion PostgreSQL |
| `JWT_SECRET` | Secret de signature des sessions (**obligatoire**, long et aléatoire) |
| `ADMIN_CODE` | Code exigé pour créer un compte administrateur |
| `CLIENT_URL` | Adresse du frontend (CORS, liens des emails) ; plusieurs adresses séparées par des virgules |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` | Envoi des emails (SMTP) |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` | Notifications push (`npx web-push generate-vapid-keys`) |
| `MIGRATIONS_AUTO` | `false` : ne pas migrer au démarrage (lancer `npm run migrate` soi-même) |

La liste complète, avec les sessions, les cookies, le proxy et la limite de tentatives,
est commentée dans [backend/.env.example](backend/.env.example).

## Commandes

| Dossier | Commande | Effet |
|---|---|---|
| `backend` | `npm run dev` / `npm start` | Démarre l'API (avec ou sans rechargement automatique) |
| `backend` | `npm test` | Tests d'intégration (voir plus bas) |
| `backend` | `npm run migrate` | Applique les migrations en attente |
| `backend` | `npm run migrate:statut` | Migrations appliquées et en attente |
| `backend` | `npm run migrate:annuler` | Annule la dernière migration |
| `backend` | `npm run migration:creer -- <nom>` | Crée un fichier de migration |
| `frontend` | `npm run dev` | Serveur de développement Vite |
| `frontend` | `npm run build` | Construction de production (`dist/`) |
| `frontend` | `npm run lint` | ESLint |
| `frontend` | `npm test` | Tests du frontend (Vitest) |

## Structure du projet

```
med_Connect/
├── docker-compose.yml        Lancement complet (base + API + site)
├── DOCKER.md                 Guide Docker
├── backend/
│   ├── server.js             Assemblage : middlewares globaux, routes, limites anti brute-force, démarrage
│   ├── migrations/           Migrations du schéma (voir migrations/README.md)
│   ├── scripts/migrate.js    Commandes npm run migrate…
│   ├── src/
│   │   ├── config/db.js      Connexion Sequelize
│   │   ├── models/           Modèles Sequelize et relations (index.js)
│   │   ├── routes/           URL + middlewares (authentification, droits, validation, journal) de chaque domaine
│   │   ├── controllers/      Logique de chaque route (un contrôleur par domaine)
│   │   ├── sockets/          Messagerie en temps réel (Socket.io)
│   │   ├── middleware/       Authentification, règles d'accès, journal, upload
│   │   ├── validation/       Schémas Zod de toutes les données reçues
│   │   ├── services/         Sessions (jetons), emails, notifications push
│   │   ├── db/               Migrations (Umzug), contrôle modèles ↔ base, données de départ
│   │   └── utils/            Pagination
│   ├── tests/                Tests d'intégration (node:test + supertest)
│   └── uploads/              Fichiers envoyés (non versionnés, jamais publics)
└── frontend/
    ├── nginx.conf            Configuration du conteneur
    └── src/
        ├── auth.js           Session : renouvellement automatique du jeton, déconnexion
        ├── config.js         Adresse de l'API (VITE_API_URL)
        ├── utils/fichiers.js Fichiers médicaux : adresse protégée, téléchargement, impression
        └── components/       Un espace par rôle (patient, medecin, donneur, adminHopital, admin), auth, chat
```

Les grands écrans sont découpés selon la même logique :
- le composant de page garde la mise en page et la navigation (onglets, sections) ;
- les **hooks** (`useXxx.js`) portent l'état et les appels à l'API d'un sujet ;
- les **onglets, sections et modales** ne font qu'afficher ce qu'ils reçoivent.

Exemple : `components/admin/` contient `AdminDashboard.jsx`, `hooks/` (utilisateurs, hôpitaux,
demandes, alertes), `sections/` (une par entrée du menu) et `modales/`. Les dossiers
`medecin/pages/dossierPatient/`, `medecin/pages/rendezVous/` et `patient/pages/dossierMedical/`
suivent le même principe.

## API

Toutes les routes sont sous `/api` et, sauf l'authentification, exigent l'en-tête
`Authorization: Bearer <jeton>`.

| Préfixe | Contenu |
|---|---|
| `/api/auth` | Inscription, vérification d'email, connexion, renouvellement de session, déconnexion, mot de passe oublié |
| `/api/rendezvous` | Rendez-vous (création, statut, transfert) |
| `/api/patients`, `/api/ordonnances`, `/api/analyses`, `/api/consultations`, `/api/partages` | Dossier médical |
| `/api/journal` | Journal des accès aux dossiers (patient : le sien ; admin : tout) |
| `/api/medecins`, `/api/evaluations`, `/api/demandes-hopital` | Médecins, avis, changements d'hôpital |
| `/api/hopitaux`, `/api/admin-hopital` | Hôpitaux et administration d'un établissement |
| `/api/alertes-sang`, `/api/donneur` | Don de sang |
| `/api/messages`, `/api/push` | Messagerie et notifications |
| `/api/users` | Gestion des comptes (admin) |
| `/api/health` | État du service (sans authentification) |
| `/uploads/<dossier>/<fichier>` | Fichiers médicaux, après vérification des droits |

**Conventions :**
- Les erreurs renvoient `{ message }`. Une donnée invalide renvoie un **400** avec le
  détail de chaque champ (`erreurs: [{ champ, message }]`).
- Les listes acceptent `?page=` et `?limit=` (100 au maximum). Le total est indiqué dans
  les en-têtes `X-Total-Count` et `X-Total-Pages`. L'historique d'une conversation se
  charge par blocs (`?before=<id>`), et l'en-tête `X-Has-More` indique s'il reste des
  messages plus anciens.
- La messagerie temps réel passe par Socket.io : le jeton est envoyé dans `auth.token` à la
  connexion.

### Ajouter une route

1. **Contrôleur** (`src/controllers/<domaine>Controller.js`) : une fonction `async (req, res)`
   qui fait le travail et répond. Elle peut supposer que l'utilisateur est authentifié, qu'il
   a les droits et que `req.body` est valide.
2. **Schéma** (`src/validation/schemas.js`) pour les données reçues, si besoin.
3. **Route** (`src/routes/<domaine>Routes.js`) : l'URL et la chaîne de contrôles, par exemple
   `router.get('/patient/:id', authenticate, journaliser('ordonnances', 'lecture'), exigerAccesPatient('id'), listerParPatient)`.
4. **Test** dans `tests/`. Au minimum, ajoutez l'appel au test de fumée `tests/routes-fumee.test.js`.

## Sécurité

- **Accès aux dossiers** : un patient ne voit que son dossier. Un médecin ne voit que celui
  des patients qu'il suit (rendez-vous ou dossier partagé). Un admin d'hôpital ne voit que
  son établissement. Ces règles sont centralisées dans `backend/src/middleware/access.js`.
- **Traçabilité** : chaque lecture, création, modification, suppression ou téléchargement
  dans un dossier est enregistré, y compris les tentatives refusées. Le journal ne peut être
  ni modifié ni supprimé par l'application.
- **Fichiers médicaux** : ils ne sont jamais publics. Chaque téléchargement est contrôlé et
  tracé.
- **Sessions** : un jeton d'accès de 15 minutes, renouvelé par un cookie `httpOnly`
  tournant. La réutilisation d'un ancien cookie coupe toutes les sessions. On peut se
  déconnecter de tous ses appareils, et changer de mot de passe a le même effet.
- **Comptes** : l'email doit être vérifié. Les mots de passe sont hachés (bcrypt). Une
  connexion ratée ne révèle pas si le compte existe. Les tentatives sont limitées par IP.
- **Données reçues** : toutes sont validées (Zod) et les champs inconnus sont ignorés.
  L'API utilise aussi les en-têtes de sécurité HTTP (helmet) et un CORS restreint à
  `CLIENT_URL`.

## Tests

### Backend

Les tests d'intégration tournent sur une vraie base PostgreSQL, `medconnect_test`. Elle est
créée automatiquement avec les identifiants de `backend/.env`, puis **vidée** à chaque
exécution ; son nom doit contenir « test » (garde-fou).

```bash
cd backend
npm test
```

Ils couvrent notamment l'authentification, les règles d'accès aux dossiers, les fichiers,
la messagerie, les sessions, la validation, le journal d'accès, les migrations et le
fonctionnement derrière un proxy. Le détail est dans [backend/tests/README.md](backend/tests/README.md).

### Frontend

Les tests du frontend (Vitest et Testing Library, dans un navigateur simulé) ne demandent ni
serveur ni base de données : les appels à l'API sont simulés.

```bash
cd frontend
npm test            # une fois
npm run test:watch  # en continu pendant le développement
```

Ils couvrent la session (renouvellement automatique du jeton, déconnexion), le signalement
des erreurs réseau, la prise de rendez-vous (un refus du serveur n'affiche jamais de faux
succès), la déconnexion de tous les appareils, la page « Accès à mon dossier » et le journal
de l'administrateur. Les fichiers de test sont à côté du code (`*.test.js`, `*.test.jsx`).

## Base de données et migrations

Le schéma évolue par migrations versionnées. Il n'y a plus de `sequelize.sync()`. Pour
ajouter une colonne ou une table : `npm run migration:creer -- <nom>`, écrire `up` et
`down`, mettre à jour le modèle, puis `npm run migrate`. Si un modèle est modifié sans
migration, un avertissement s'affiche au démarrage et les tests échouent. Voir
[backend/migrations/README.md](backend/migrations/README.md).
