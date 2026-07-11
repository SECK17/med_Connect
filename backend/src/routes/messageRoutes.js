const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticate } = require('../middleware/authenticate');
const Message = require('../models/Message');
const User    = require('../models/User');

// GET /api/messages — liste des conversations (avec dernier message + non lus)
router.get('/', authenticate, async (req, res) => {
  try {
    const meId = req.user.id;

    const msgs = await Message.findAll({
      where: { [Op.or]: [{ expediteur_id: meId }, { destinataire_id: meId }] },
      order: [['created_at', 'DESC']],
    });

    const convMap = {};
    msgs.forEach(m => {
      const otherId = m.expediteur_id === meId ? m.destinataire_id : m.expediteur_id;
      if (!convMap[otherId]) {
        convMap[otherId] = { interlocuteur_id: otherId, dernier_message: m.contenu, date: m.created_at, non_lus: 0 };
      }
      if (m.destinataire_id === meId && !m.lu) convMap[otherId].non_lus++;
    });

    const ids = Object.keys(convMap).map(Number);
    if (ids.length > 0) {
      const users = await User.findAll({ where: { id: { [Op.in]: ids } }, attributes: ['id', 'nom', 'role'] });
      users.forEach(u => {
        if (convMap[u.id]) { convMap[u.id].nom = u.nom; convMap[u.id].role = u.role; }
      });
    }

    res.json(Object.values(convMap).sort((a, b) => new Date(b.date) - new Date(a.date)));
  } catch (err) {
    console.error('Erreur conversations:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/messages/unread/count — DOIT être avant /:interlocuteurId
router.get('/unread/count', authenticate, async (req, res) => {
  try {
    const count = await Message.count({ where: { destinataire_id: req.user.id, lu: false } });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/messages/:interlocuteurId — historique + marque comme lus
router.get('/:interlocuteurId', authenticate, async (req, res) => {
  try {
    const meId    = req.user.id;
    const otherId = parseInt(req.params.interlocuteurId);

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { expediteur_id: meId,    destinataire_id: otherId },
          { expediteur_id: otherId, destinataire_id: meId    },
        ],
      },
      order: [['created_at', 'ASC']],
    });

    await Message.update(
      { lu: true },
      { where: { expediteur_id: otherId, destinataire_id: meId, lu: false } }
    );

    res.json(messages);
  } catch (err) {
    console.error('Erreur historique:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
