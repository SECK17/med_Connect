const express = require('express');
const router = express.Router();
// Identifiants d'URL numériques : 400 clair au lieu d'une erreur SQL
const { verifierParamId } = require('../validation');
['interlocuteurId'].forEach(p => router.param(p, verifierParamId));
const { authenticate } = require('../middleware/authenticate');
const {
  listerConversations,
  compterNonLus,
  historique,
} = require('../controllers/messageController');

// GET /api/messages — liste des conversations (avec dernier message + non lus)
// Calculé en SQL : on ne charge plus tous les messages de l'utilisateur en mémoire.
router.get('/', authenticate, listerConversations);

// GET /api/messages/unread/count — DOIT être avant /:interlocuteurId
router.get('/unread/count', authenticate, compterNonLus);

// GET /api/messages/:interlocuteurId — historique paginé + marque comme lus
//   ?limit=50 (max 100)  → les N messages les plus récents
//   ?before=<id>         → les N messages plus anciens que ce message
// Réponse : tableau trié du plus ancien au plus récent ; en-tête X-Has-More: true|false
router.get('/:interlocuteurId', authenticate, historique);

module.exports = router;
