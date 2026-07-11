// server.js
require('dotenv').config();
const http    = require('http');
const express = require('express');
const cors    = require('cors');
const { Server } = require('socket.io');

// ──────────────────────────
// Base de données
// ──────────────────────────
const { connectDB } = require('./src/config/db');
const { syncDatabase } = require('./src/models/index');
const Hopital = require('./src/models/Hopital');

const HOPITAUX_SEED = [
  { nom: 'Hôpital Principal de Dakar',        type: 'Hôpital',  ville: 'Dakar'       },
  { nom: 'CHU de Fann',                        type: 'CHU',      ville: 'Dakar'       },
  { nom: 'Hôpital Aristide Le Dantec',         type: 'Hôpital',  ville: 'Dakar'       },
  { nom: 'Hôpital Général de Grand Yoff (HOGGY)', type: 'Hôpital', ville: 'Dakar'    },
  { nom: 'Hôpital de Pikine',                  type: 'Hôpital',  ville: 'Pikine'      },
  { nom: 'Hôpital Abass Ndao',                 type: 'Hôpital',  ville: 'Dakar'       },
  { nom: 'Hôpital Roi Baudouin (Guédiawaye)',  type: 'Hôpital',  ville: 'Guédiawaye'  },
  { nom: 'Hôpital de Ouakam',                  type: 'Hôpital',  ville: 'Dakar'       },
  { nom: 'Polyclinique SUMA',                  type: 'Centre',   ville: 'Dakar'       },
  { nom: 'Clinique Pasteur',                   type: 'Clinique', ville: 'Dakar'       },
];

const seedHopitaux = async () => {
  const count = await Hopital.count();
  if (count === 0) {
    await Hopital.bulkCreate(HOPITAUX_SEED);
    console.log('✅ Hôpitaux seedés (10 établissements)');
  }
};

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

// ──────────────────────────
// Rate limiting in-memory (anti brute-force)
// ──────────────────────────
const _rlStore = new Map();
const rateLimit = (maxReq, windowMs) => (req, res, next) => {
  const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now  = Date.now();
  const hits  = (_rlStore.get(key) || []).filter(t => t > now - windowMs);
  hits.push(now);
  _rlStore.set(key, hits);
  if (hits.length > maxReq) {
    return res.status(429).json({ message: 'Trop de tentatives. Réessayez dans quelques minutes.' });
  }
  next();
};
// Nettoyage périodique pour éviter les fuites mémoire
setInterval(() => {
  const cutoff = Date.now() - 15 * 60 * 1000;
  for (const [k, v] of _rlStore) {
    const kept = v.filter(t => t > cutoff);
    if (kept.length === 0) _rlStore.delete(k);
    else _rlStore.set(k, kept);
  }
}, 5 * 60 * 1000);

// ──────────────────────────
// Initialisation Express + HTTP + Socket.io
// ──────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// ──────────────────────────
// Routes
// ──────────────────────────
// Max 10 tentatives de login par 15 min par IP
app.use('/api/auth', rateLimit(10, 15 * 60 * 1000), authRoutes);
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

// ──────────────────────────
// Socket.io — chat temps réel
// ──────────────────────────
const Message          = require('./src/models/Message');
const { sendPush }     = require('./src/services/pushService');

const roomId = (a, b) => `chat_${Math.min(a, b)}_${Math.max(a, b)}`;

io.on('connection', (socket) => {
  socket.on('join_user', ({ userId }) => {
    socket.join(`user_${userId}`);
  });

  socket.on('join_chat', ({ userId, interlocuteurId }) => {
    socket.join(roomId(userId, interlocuteurId));
  });

  socket.on('send_message', async ({ expediteur_id, destinataire_id, contenu }) => {
    try {
      const msg = await Message.create({ expediteur_id, destinataire_id, contenu });
      const room = roomId(expediteur_id, destinataire_id);
      io.to(room).emit('message_received', msg);
      io.to(`user_${destinataire_id}`).emit('new_message_notif', {
        from_id: expediteur_id,
        contenu,
        date: msg.created_at,
      });
      // Notification push au destinataire
      sendPush(destinataire_id, {
        title: 'Nouveau message',
        body: contenu.length > 60 ? contenu.slice(0, 60) + '…' : contenu,
        icon: '/favicon.svg',
        url: '/dashboard',
      });
    } catch (err) {
      console.error('Erreur socket send_message:', err);
    }
  });

  socket.on('delete_message', async ({ message_id, expediteur_id }) => {
    try {
      const msg = await Message.findByPk(message_id);
      if (!msg || msg.expediteur_id !== expediteur_id) return;
      await msg.update({ supprime: true });
      const room = roomId(msg.expediteur_id, msg.destinataire_id);
      io.to(room).emit('message_deleted', { id: message_id });
    } catch (err) {
      console.error('Erreur socket delete_message:', err);
    }
  });

  socket.on('edit_message', async ({ message_id, expediteur_id, nouveau_contenu }) => {
    try {
      const msg = await Message.findByPk(message_id);
      if (!msg || msg.expediteur_id !== expediteur_id || msg.supprime) return;
      await msg.update({ contenu: nouveau_contenu, modifie: true, modifie_at: new Date() });
      const room = roomId(msg.expediteur_id, msg.destinataire_id);
      io.to(room).emit('message_edited', { id: message_id, contenu: nouveau_contenu });
    } catch (err) {
      console.error('Erreur socket edit_message:', err);
    }
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Serveur MedConnect opérationnel ✓' });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée.' });
});

// ──────────────────────────
// Démarrage du serveur
// ──────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // 1. Connexion à la base de données
    await connectDB();
    console.log('✅ Base de données connectée');

    // 2. Synchronisation des modèles
    await syncDatabase();
    console.log('✅ Modèles synchronisés');

    // 3. Seed données initiales
    await seedHopitaux();

    // 4. Démarrage du serveur
    server.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur au démarrage:', error.message);
    process.exit(1);
  }
};

start();