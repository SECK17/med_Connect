// controllers/alerteSangController.js
// Alertes de don de sang : création par les hôpitaux, diffusion aux donneurs proches, réponses.
// Les contrôles d'accès (authentification, rôle, droits sur le dossier), la validation
// des données et la traçabilité sont faits par les middlewares déclarés dans
// routes/alerteSangRoutes.js, avant l'appel de ces fonctions.
const { Op }  = require('sequelize');
const { paginatedFindAll } = require('../utils/pagination');
const { AlerteSang, AdminHopital, Hopital, User, Patient, DonneurReponse } = require('../models');
const { sendPush } = require('../services/pushService');

// Distance en kilomètres entre deux points GPS (formule de haversine)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST /api/alertes-sang
const creer = async (req, res) => {
  try {
    const { groupe_sang, quantite, message, urgence, latitude, longitude, rayon_km, duree_heures } = req.body;
    if (!groupe_sang) return res.status(400).json({ message: 'Groupe sanguin requis.' });

    const profil = await AdminHopital.findOne({ where: { user_id: req.user.id } });
    if (!profil) return res.status(403).json({ message: 'Profil admin hôpital introuvable.' });

    const groupes_donneurs = AlerteSang.COMPAT[groupe_sang] || [];

    const expire_at = duree_heures
      ? new Date(Date.now() + duree_heures * 3_600_000)
      : null;

    const alerte = await AlerteSang.create({
      hopital_id:      profil.hopital_id,
      hopital_nom:     profil.hopital_nom,
      admin_id:        req.user.id,
      groupe_sang,
      groupes_donneurs,
      quantite:      quantite      || null,
      message:       message       || null,
      urgence:       urgence       || 'Urgent',
      statut:        'active',
      latitude:      latitude      || null,
      longitude:     longitude     || null,
      rayon_km:      rayon_km      || null,
      duree_heures:  duree_heures  || null,
      expire_at,
    });

    res.status(201).json(alerte);

    // Notifications push aux donneurs disponibles et compatibles (async)
    try {
      const patientsCompatibles = await Patient.findAll({
        where: { groupeSanguin: { [Op.in]: groupes_donneurs }, donneurDisponible: true },
        attributes: ['id', 'latitude', 'longitude'],
      });
      for (const p of patientsCompatibles) {
        // Filtre zone si l'alerte a un rayon et que le donneur a une position
        if (rayon_km && latitude && longitude && p.latitude && p.longitude) {
          const dist = haversine(p.latitude, p.longitude, latitude, longitude);
          if (dist > rayon_km) continue;
        }
        sendPush(p.id, {
          title: `🩸 Besoin urgent — Groupe ${groupe_sang}`,
          body: `${profil.hopital_nom} recherche des donneurs compatibles.${rayon_km ? ` Zone : ${rayon_km} km.` : ''}`,
          icon: '/favicon.svg',
          url: '/dashboard/donneur/don-sang',
        });
      }
    } catch (_) {}
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/alertes-sang/patient
const listerPourPatient = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.user.id, {
      attributes: ['latitude', 'longitude'],
    });
    const patLat = patient?.latitude;
    const patLon = patient?.longitude;

    const now = new Date();
    const alertes = await AlerteSang.findAll({
      where: {
        statut: 'active',
        [Op.or]: [{ expire_at: null }, { expire_at: { [Op.gt]: now } }],
      },
      include: [{ model: Hopital, as: 'hopital', attributes: ['telephone', 'adresse', 'ville'] }],
      order: [['created_at', 'DESC']],
    });

    const result = alertes.map(a => ({
      ...a.toJSON(),
      distance_km: (patLat && patLon && a.latitude && a.longitude)
        ? Math.round(haversine(patLat, patLon, a.latitude, a.longitude) * 10) / 10
        : null,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/alertes-sang/moi
const listerMesAlertes = async (req, res) => {
  try {
    const profil = await AdminHopital.findOne({ where: { user_id: req.user.id } });
    if (!profil) return res.status(403).json({ message: 'Profil introuvable.' });

    const alertes = await AlerteSang.findAll({
      where: { hopital_id: profil.hopital_id },
      include: [{ model: DonneurReponse, as: 'reponses', attributes: ['id'] }],
      order: [['created_at', 'DESC']],
    });

    const result = alertes.map(a => ({
      ...a.toJSON(),
      nb_reponses: a.reponses?.length || 0,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/alertes-sang/donneur
const listerPourDonneur = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Patient, as: 'profil_patient', attributes: ['groupeSanguin', 'donneurDisponible', 'latitude', 'longitude'] }],
    });
    const groupe = user?.profil_patient?.groupeSanguin;
    const donLat = user?.profil_patient?.latitude;
    const donLon = user?.profil_patient?.longitude;

    if (!groupe) return res.json([]);

    const now2 = new Date();
    let alertes = await AlerteSang.findAll({
      where: {
        statut: 'active',
        [Op.or]: [{ expire_at: null }, { expire_at: { [Op.gt]: now2 } }],
      },
      include: [{ model: Hopital, as: 'hopital', attributes: ['telephone', 'adresse', 'ville'] }],
      order: [['created_at', 'DESC']],
    });

    alertes = alertes.filter(a => {
      if (!Array.isArray(a.groupes_donneurs) || !a.groupes_donneurs.includes(groupe)) return false;
      if (a.rayon_km && donLat && donLon && a.latitude && a.longitude) {
        return haversine(donLat, donLon, a.latitude, a.longitude) <= a.rayon_km;
      }
      return true;
    });

    const result = alertes.map(a => ({
      ...a.toJSON(),
      distance_km: (donLat && donLon && a.latitude && a.longitude)
        ? Math.round(haversine(donLat, donLon, a.latitude, a.longitude) * 10) / 10
        : null,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /api/alertes-sang/:id/repondre
const repondre = async (req, res) => {
  try {
    const alerte = await AlerteSang.findByPk(req.params.id, { attributes: ['id', 'statut'] });
    if (!alerte) return res.status(404).json({ message: 'Alerte introuvable.' });
    if (alerte.statut !== 'active') return res.status(400).json({ message: "Cette alerte n'est plus active." });
    await DonneurReponse.findOrCreate({
      where: { alerte_id: req.params.id, donneur_id: req.user.id },
    });
    res.json({ repondu: true });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/alertes-sang/mes-reponses
const mesReponses = async (req, res) => {
  try {
    const reponses = await DonneurReponse.findAll({
      where: { donneur_id: req.user.id },
      include: [{
        model: AlerteSang,
        as: 'alerte',
        attributes: ['id', 'hopital_nom', 'groupe_sang', 'urgence', 'statut', 'created_at'],
      }],
      order: [['created_at', 'DESC']],
    });
    res.json(reponses.map(r => ({
      alerte_id:  r.alerte_id,
      date:       r.created_at,
      hopital_nom: r.alerte?.hopital_nom,
      groupe_sang: r.alerte?.groupe_sang,
      urgence:     r.alerte?.urgence,
      statut:      r.alerte?.statut,
    })));
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/alertes-sang/:id/reponses
const listerReponses = async (req, res) => {
  try {
    const reponses = await DonneurReponse.findAll({
      where: { alerte_id: req.params.id },
      include: [{
        model: User,
        as: 'donneur',
        attributes: ['id', 'nom', 'telephone', 'email'],
        include: [{ model: Patient, as: 'profil_patient', attributes: ['groupeSanguin'] }],
      }],
      order: [['created_at', 'ASC']],
    });
    res.json(reponses.map(r => ({
      id:            r.id,
      date:          r.created_at,
      nom:           r.donneur?.nom,
      telephone:     r.donneur?.telephone,
      email:         r.donneur?.email,
      groupe_sanguin: r.donneur?.profil_patient?.groupeSanguin,
    })));
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/alertes-sang/toutes
const listerToutes = async (req, res) => {
  try {
    const alertes = await paginatedFindAll(req, res, AlerteSang, { order: [['created_at', 'DESC']] });
    res.json(alertes);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// PUT /api/alertes-sang/:id
const modifierStatut = async (req, res) => {
  try {
    const alerte = req.alerte;
    await alerte.update({ statut: req.body.statut || alerte.statut });
    res.json(alerte);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// DELETE /api/alertes-sang/:id
const supprimer = async (req, res) => {
  try {
    const alerte = req.alerte;
    await alerte.destroy();
    res.json({ message: 'Alerte supprimée.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  creer,
  listerPourPatient,
  listerMesAlertes,
  listerPourDonneur,
  repondre,
  mesReponses,
  listerReponses,
  listerToutes,
  modifierStatut,
  supprimer,
};
