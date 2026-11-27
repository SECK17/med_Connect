// controllers/pushController.js
// Abonnements aux notifications push.
// Les contrôles d'accès (authentification, rôle, droits sur le dossier), la validation
// des données et la traçabilité sont faits par les middlewares déclarés dans
// routes/pushRoutes.js, avant l'appel de ces fonctions.
const PushSubscription = require('../models/PushSubscription');

// GET /api/push/vapid-public-key
const clePublique = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

// POST /api/push/subscribe
const abonner = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    const userId = req.user.id;
    if (!endpoint || !keys?.p256dh || !keys?.auth)
      return res.status(400).json({ message: 'Données manquantes.' });

    await PushSubscription.upsert({
      user_id:  userId,
      endpoint,
      p256dh:   keys.p256dh,
      auth:     keys.auth,
    }, { conflictFields: ['user_id', 'endpoint'] });

    res.json({ message: 'Abonnement enregistré.' });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// DELETE /api/push/unsubscribe
const desabonner = async (req, res) => {
  try {
    await PushSubscription.destroy({ where: { user_id: req.user.id } });
    res.json({ message: 'Désabonné.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  clePublique,
  abonner,
  desabonner,
};
