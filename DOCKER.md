# Lancer MedConnect avec Docker

Une seule commande démarre toute l'application : la base PostgreSQL, l'API et le site.

```
 navigateur ──► :8080  frontend (nginx)
                         ├─ /            → application React
                         └─ /api, /uploads, /socket.io → backend :5000 (non exposé)
                                                          └─► db PostgreSQL :5432 (non exposé)
```

Le site et l'API sont servis à la **même adresse**. Il n'y a donc ni CORS ni cookie
inter-domaines à configurer. Seul le port 8080 est ouvert sur votre machine.

## Prérequis

[Docker Desktop](https://www.docker.com/products/docker-desktop/), ou Docker Engine avec le
plugin Compose (`docker compose version` doit répondre).

## Premier lancement

```bash
cp .env.docker.example .env
# Ouvrez .env et remplissez au minimum DB_PASSWORD, JWT_SECRET et ADMIN_CODE.
# Pour JWT_SECRET, générez une chaîne aléatoire : openssl rand -hex 32

docker compose up -d --build
```

Ouvrez ensuite **http://localhost:8080**.

Au premier démarrage, le backend crée le schéma de la base (migrations), puis ajoute les
hôpitaux de départ. Pour créer le premier compte administrateur, allez sur
http://localhost:8080/create-admin avec votre `ADMIN_CODE`.

**Sans serveur SMTP**, aucun email n'est envoyé. Avec `EMAIL_LIENS_DANS_LOGS=true`
(valeur du fichier d'exemple), les liens de vérification et de mot de passe oublié
s'affichent dans les logs :

```bash
docker compose logs backend | grep "lien de"
```

## Commandes utiles

| Commande | Effet |
|---|---|
| `docker compose ps` | État des services (« healthy » quand tout est prêt) |
| `docker compose logs -f backend` | Suivre les logs de l'API |
| `docker compose down` | Arrêter (les données sont conservées) |
| `docker compose up -d --build` | Mettre à jour après un changement de code (applique aussi les nouvelles migrations) |
| `docker compose exec backend npm run migrate:statut` | État des migrations |
| `docker compose exec db psql -U medconnect medconnect` | Console SQL |

## Données et sauvegardes

Les données sont conservées dans deux volumes Docker, qui survivent à `docker compose down` :

- `medconnect_db-data` : la base PostgreSQL ;
- `medconnect_uploads` : les ordonnances, analyses et justificatifs envoyés.

```bash
# Sauvegarde de la base
docker compose exec -T db pg_dump -U medconnect -Fc medconnect > medconnect-$(date +%F).dump
# Restauration (base vide)
docker compose exec -T db pg_restore -U medconnect -d medconnect --clean --if-exists < medconnect-AAAA-MM-JJ.dump
# Sauvegarde des fichiers médicaux
docker run --rm -v medconnect_uploads:/data -v "$PWD":/sauvegarde alpine tar czf /sauvegarde/uploads-$(date +%F).tar.gz -C /data .
```

⚠️ `docker compose down -v` **supprime les volumes**, donc toutes les données.

## Reprendre une base existante

Pour utiliser votre base actuelle dans Docker :

1. faites une sauvegarde avec `pg_dump -Fc` sur votre machine ;
2. lancez une fois `docker compose up -d db` ;
3. restaurez la sauvegarde avec la commande `pg_restore` ci-dessus ;
4. lancez `docker compose up -d --build`.

Au démarrage, le backend complète le schéma par les migrations, sans toucher aux données
(voir `backend/migrations/README.md`).

## Mise en ligne (HTTPS)

Le conteneur `frontend` sert le site en HTTP. En production, placez devant lui un proxy
HTTPS : Caddy, Traefik, nginx avec Let's Encrypt, ou le proxy de votre hébergeur. Puis,
dans `.env` :

```
CLIENT_URL=https://medconnect.exemple.sn
TRUST_PROXY=2          # votre proxy HTTPS + le nginx du conteneur
HTTP_PORT=127.0.0.1:8080   # n'écouter que localement, derrière le proxy HTTPS
```

Le cookie de session devient automatiquement `Secure` dès que le site est servi en HTTPS
(`COOKIE_SECURE=auto`). Configurez aussi le SMTP (`EMAIL_USER`, `EMAIL_PASS`).

Ne mettez pas `TRUST_PROXY` à une valeur plus haute que le nombre réel de proxys. Sinon un
visiteur pourrait se faire passer pour une autre IP et contourner la limite anti brute-force.

## Ce que font les images

- **backend** (`backend/Dockerfile`) : Node 22 Alpine, dépendances de production seulement,
  exécution sans droits root. Un contrôle de santé interroge `/api/health` (l'API et la base
  répondent).
- **frontend** (`frontend/Dockerfile`) : construction Vite, puis nginx Alpine. Les fichiers de
  build sont mis en cache un an ; `index.html` et le service worker ne sont jamais mis en
  cache, pour que les mises à jour arrivent tout de suite.
