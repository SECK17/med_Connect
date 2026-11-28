// server.js
require('dotenv').config();
const http    = require('http');
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

// Origines autorisées (CLIENT_URL peut contenir plusieurs URLs séparées par des virgules)
const ALLOWED_ORIGINS = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);
const corsOptions = {
  origin: ALLOWED_ORIGINS,
  credentials: true,
  // Rend les en-têtes de pagination lisibles par le frontend
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit', 'X-Total-Pages', 'X-Has-More'],
};

// ──────────────────────────
// Base de données
// ──────────────────────────
const { connectDB } = require('./src/config/db');
const { verifierSecrets } = require('./src/config/verifierSecrets');
require('./src/models/index'); // enregistre les modèles et leurs relations
const { migrer, etat: etatMigrations } = require('./src/db/migrations');
const { verifierSchema } = require('./src/db/verifierSchema');
const { seedHopitaux } = require('./src/db/seed');

// ──────────────────────────
// Routes
// ──────────────────────────
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const rendezvousRoutes = require('./src/routes/rendezvousRoutes');
const medecinRoutes = require('./src/routes/medecinRoutes');
const patientRoutes = require('./src/routes/patientRoutes');
const donneurRoutes = require('./src/routes/donneurRoutes');
const hopitalRoutes = require('./src/routes/hopitalRoutes');
const ordonnanceRoutes    = require('./src/routes/ordonnanceRoutes');
const analyseRoutes       = require('./src/routes/analyseRoutes');
const consultationRoutes  = require('./src/routes/consultationRoutes');
const partageRoutes       = require('./src/routes/partageRoutes');
const adminHopitalRoutes    = require('./src/routes/adminHopitalRoutes');
const alerteSangRoutes      = require('./src/routes/alerteSangRoutes');
const demandeHopitalRoutes  = require('./src/routes/demandeHopitalRoutes');
const messageRoutes         = require('./src/routes/messageRoutes');
const pushRoutes            = require('./src/routes/pushRoutes');
const evaluationRoutes      = require('./src/routes/evaluationRoutes');
const journalRoutes    = require('./src/routes/journalRoutes');
const fileRoutes            = require('./src/routes/fileRoutes');

// ──────────────────────────
// Rate limiting in-memory (anti brute-force)
// ──────────────────────────
// Chaque limiteur a son propre compteur (sinon deux limites différentes se mélangent).
const rateLimit = (maxReq, windowMs) => {
  const store = new Map();
  // Nettoyage périodique pour éviter les fuites mémoire
  // (unref : ce minuteur n'empêche pas le processus de s'arrêter, utile pour les tests)
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [k, v] of store) {
      const kept = v.filter(t => t > cutoff);
      if (kept.length === 0) store.delete(k);
      else store.set(k, kept);
    }
  }, Math.min(windowMs, 5 * 60 * 1000)).unref();

  return (req, res, next) => {
    const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now  = Date.now();
    const hits  = (store.get(key) || []).filter(t => t > now - windowMs);
    hits.push(now);
    store.set(key, hits);
    if (hits.length > maxReq) {
      return res.status(429).json({ message: 'Trop de tentatives. Réessayez dans quelques minutes.' });
    }
    next();
  };
};

// Nombre max de requêtes /api/auth par IP et par 15 min (configurable, 10 par défaut)
const AUTH_RATE_LIMIT = parseInt(process.env.AUTH_RATE_LIMIT, 10) || 10;

// ──────────────────────────
// Initialisation Express + HTTP + Socket.io
// ──────────────────────────
const app    = express();

// Derrière un proxy (nginx dans Docker) : sans cela, req.ip serait l'IP du proxy pour tout
// le monde, et la limite anti brute-force bloquerait tous les utilisateurs à la fois.
// TRUST_PROXY = nombre de proxys de confiance (ex. 1), true/false, ou liste d'IP / sous-réseaux.
// À ne définir QUE si l'API n'est joignable qu'à travers ce proxy.
const lireTrustProxy = (v) => {
  if (v === undefined || v === '') return false;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return /^\d+$/.test(v) ? parseInt(v, 10) : v;
};
app.set('trust proxy', lireTrustProxy(process.env.TRUST_PROXY));
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { ...corsOptions, methods: ['GET', 'POST'] },
});

// Middleware
// crossOriginResourcePolicy: le frontend (autre origine) doit pouvoir afficher les images servies.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
// Santé du service (Docker, supervision) : répond 200 si l'API et la base répondent
app.get('/api/health', async (req, res) => {
  try {
    await require('./src/config/db').sequelize.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'erreur', message: 'Base de données injoignable.' });
  }
});

// Fichiers médicaux : accès authentifié et contrôlé (plus de dossier public)
app.use('/uploads', fileRoutes);

// ──────────────────────────
// Routes
// ──────────────────────────
// Max AUTH_RATE_LIMIT tentatives par 15 min par IP (anti brute-force)
// Le renouvellement de session (/refresh, /logout) a sa propre limite, plus large :
// chaque onglet ouvert se rafraîchit toutes les ~14 min et ne doit pas consommer
// le quota des tentatives de connexion.
const authLimiter    = rateLimit(AUTH_RATE_LIMIT, 15 * 60 * 1000);
const sessionLimiter = rateLimit(AUTH_RATE_LIMIT * 6, 15 * 60 * 1000);
const SESSION_PATHS  = new Set(['/refresh', '/logout']);
app.use('/api/auth', (req, res, next) =>
  (SESSION_PATHS.has(req.path) ? sessionLimiter : authLimiter)(req, res, next), authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rendezvous', rendezvousRoutes);
app.use('/api/medecins', medecinRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/donneur', donneurRoutes);
app.use('/api/hopitaux', hopitalRoutes);
app.use('/api/ordonnances', ordonnanceRoutes);
app.use('/api/analyses', analyseRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/partages',       partageRoutes);
app.use('/api/admin-hopital',    adminHopitalRoutes);
app.use('/api/alertes-sang',     alerteSangRoutes);
app.use('/api/demandes-hopital', demandeHopitalRoutes);
app.use('/api/messages',         messageRoutes);
app.use('/api/push',             pushRoutes);
app.use('/api/evaluations',      evaluationRoutes);
app.use('/api/journal',          journalRoutes);

// ──────────────────────────
// Socket.io — chat temps réel (src/sockets/chat.js)
// ──────────────────────────
const { nettoyer: nettoyerSessions } = require('./src/services/tokenService');
const { purgerJournal } = require('./src/middleware/journal');
require('./src/sockets/chat')(io);

app.get('/', (req, res) => {
  res.json({ message: 'Serveur MedConnect opérationnel ✓' });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée.' });
});

// Gestionnaire d'erreurs global (Multer, JSON invalide, erreurs non gérées)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Fichier trop volumineux (10 Mo maximum).'
      : `Erreur d'upload : ${err.message}`;
    return res.status(400).json({ message });
  }
  if (err.message && err.message.startsWith('Format non supporté')) {
    return res.status(400).json({ message: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON invalide.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Requête trop volumineuse.' });
  }
  console.error('Erreur non gérée:', err);
  res.status(err.status || 500).json({ message: 'Erreur serveur.' });
});

// ──────────────────────────
// Démarrage du serveur
// ──────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // 0. Secrets (JWT_SECRET, ADMIN_CODE) : refus de démarrer s'ils sont absents ou faibles en production
    verifierSecrets();

    // 1. Connexion à la base de données
    await connectDB();
    console.log('✅ Base de données connectée');

    // 2. Schéma de la base : migrations versionnées (dossier migrations/).
    //    MIGRATIONS_AUTO=false → le serveur refuse de démarrer s'il en reste à appliquer
    //    (à lancer alors à la main : npm run migrate).
    if (process.env.MIGRATIONS_AUTO === 'false') {
      const { enAttente } = await etatMigrations();
      if (enAttente.length) {
        throw new Error(`${enAttente.length} migration(s) en attente (${enAttente.join(', ')}). Lancez : npm run migrate`);
      }
    } else {
      const faites = await migrer();
      console.log(faites.length ? `✅ ${faites.length} migration(s) appliquée(s)` : '✅ Base à jour');
    }
    const ecarts = await verifierSchema();
    if (ecarts.length) {
      console.warn("⚠️  Les modèles ne correspondent pas à la base (migration manquante ?) :\n  - " + ecarts.join('\n  - '));
    }

    // 3. Seed données initiales + nettoyage des sessions expirées
    await seedHopitaux();
    nettoyerSessions().catch(() => {});
    purgerJournal()
      .then((n) => { if (n) console.log(`🧹 Journal d'accès : ${n} entrée(s) ancienne(s) supprimée(s)`); })
      .catch((e) => console.warn('[journal] purge :', e.message));

    // 4. Démarrage du serveur
    server.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur au démarrage:', error.message);
    process.exit(1);
  }
};

// Démarre seulement si le fichier est lancé directement (node server.js / nodemon).
// Quand il est importé (tests), on expose l'application sans ouvrir de port.
if (require.main === module) {
  start();
}

module.exports = { app, server, io, rateLimit, seedHopitaux };