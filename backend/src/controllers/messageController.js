// controllers/messageController.js
// Messagerie : conversations, historique, messages non lus.
// Les contrôles d'accès (authentification, rôle, droits sur le dossier), la validation
// des données et la traçabilité sont faits par les middlewares déclarés dans
// routes/messageRoutes.js, avant l'appel de ces fonctions.
const { Op, QueryTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Message = require('../models/Message');

// GET /api/messages
const listerConversations = async (req, res) => {
  try {
    const conversations = await sequelize.query(
      `WITH conv AS (
         SELECT CASE WHEN expediteur_id = :me THEN destinataire_id ELSE expediteur_id END AS other_id,
                id, contenu, created_at
         FROM messages
         WHERE expediteur_id = :me OR destinataire_id = :me
       ),
       dernier AS (
         SELECT DISTINCT ON (other_id) other_id, contenu, created_at
         FROM conv
         ORDER BY other_id, created_at DESC, id DESC
       ),
       non_lus AS (
         SELECT expediteur_id AS other_id, COUNT(*)::int AS n
         FROM messages
         WHERE destinataire_id = :me AND lu = false
         GROUP BY expediteur_id
       )
       SELECT d.other_id AS interlocuteur_id,
              d.contenu  AS dernier_message,
              d.created_at AS date,
              COALESCE(nl.n, 0) AS non_lus,
              u.nom, u.role
       FROM dernier d
       LEFT JOIN non_lus nl ON nl.other_id = d.other_id
       LEFT JOIN users u    ON u.id = d.other_id
       ORDER BY d.created_at DESC`,
      { replacements: { me: req.user.id }, type: QueryTypes.SELECT }
    );
    res.json(conversations);
  } catch (err) {
    console.error('Erreur conversations:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/messages/unread/count
const compterNonLus = async (req, res) => {
  try {
    const count = await Message.count({ where: { destinataire_id: req.user.id, lu: false } });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/messages/:interlocuteurId
const historique = async (req, res) => {
  try {
    const meId    = req.user.id;
    const otherId = parseInt(req.params.interlocuteurId, 10);
    if (!otherId) return res.status(400).json({ message: 'Interlocuteur invalide.' });

    const limit  = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const before = parseInt(req.query.before, 10);

    const where = {
      [Op.or]: [
        { expediteur_id: meId,    destinataire_id: otherId },
        { expediteur_id: otherId, destinataire_id: meId    },
      ],
    };
    if (before) where.id = { [Op.lt]: before };

    // On en prend un de plus pour savoir s'il reste des messages plus anciens
    const rows = await Message.findAll({
      where,
      order: [['created_at', 'DESC'], ['id', 'DESC']],
      limit: limit + 1,
    });
    const hasMore  = rows.length > limit;
    const messages = rows.slice(0, limit).reverse();

    if (!before) {
      await Message.update(
        { lu: true },
        { where: { expediteur_id: otherId, destinataire_id: meId, lu: false } }
      );
    }

    res.set('X-Has-More', String(hasMore));
    res.json(messages);
  } catch (err) {
    console.error('Erreur historique:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  listerConversations,
  compterNonLus,
  historique,
};
