// controllers/partageController.js
// Partage du dossier médical d'un patient avec un médecin.
// Les contrôles d'accès (authentification, rôle, droits sur le dossier), la validation
// des données et la traçabilité sont faits par les middlewares déclarés dans
// routes/partageRoutes.js, avant l'appel de ces fonctions.
const DossierPartage = require('../models/DossierPartage');
const User = require('../models/User');
const Medecin = require('../models/Medecin');

// POST /api/partages
const partager = async (req, res) => {
  try {
    const patient_id = req.user.id;
    const { medecin_id } = req.body;
    if (!medecin_id) return res.status(400).json({ message: 'medecin_id requis.' });

    const medecin = await User.findOne({ where: { id: medecin_id, role: 'medecin' } });
    if (!medecin) return res.status(404).json({ message: 'Médecin introuvable.' });

    const [partage, created] = await DossierPartage.findOrCreate({
      where: { patient_id, medecin_id },
      defaults: { patient_id, medecin_id },
    });
    res.locals.journal = { patientId: patient_id, ressourceId: partage.id, details: medecin.nom };

    res.status(created ? 201 : 200).json({ message: created ? 'Dossier partagé.' : 'Déjà partagé.', partage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/partages/patient/:id
const listerParPatient = async (req, res) => {
  try {
    const patient_id = parseInt(req.params.id);
    if (req.user.role === 'patient' && req.user.id !== patient_id)
      return res.status(403).json({ message: 'Accès refusé.' });

    const partages = await DossierPartage.findAll({
      where: { patient_id },
      include: [{
        model: User,
        as: 'medecin',
        attributes: ['id', 'nom', 'email'],
        include: [{ model: Medecin, as: 'profil_medecin', attributes: ['specialite', 'hopital'] }],
      }],
      order: [['created_at', 'DESC']],
    });

    res.json(partages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/partages/medecin/:id
const listerParMedecin = async (req, res) => {
  try {
    const medecin_id = parseInt(req.params.id);
    if (req.user.role === 'medecin' && req.user.id !== medecin_id)
      return res.status(403).json({ message: 'Accès refusé.' });

    const partages = await DossierPartage.findAll({
      where: { medecin_id },
      include: [{
        model: User,
        as: 'patient',
        attributes: ['id', 'nom', 'email', 'telephone'],
      }],
      order: [['created_at', 'DESC']],
    });

    res.json(partages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// DELETE /api/partages/:id
const retirer = async (req, res) => {
  try {
    const partage = await DossierPartage.findByPk(req.params.id);
    if (!partage) return res.status(404).json({ message: 'Partage introuvable.' });
    const medecin = await User.findByPk(partage.medecin_id, { attributes: ['nom'] });
    res.locals.journal = { patientId: partage.patient_id, ressourceId: partage.id, details: medecin?.nom || `médecin #${partage.medecin_id}` };
    if (partage.patient_id !== req.user.id)
      return res.status(403).json({ message: 'Accès refusé.' });

    await partage.destroy();
    res.json({ message: 'Partage révoqué.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  partager,
  listerParPatient,
  listerParMedecin,
  retirer,
};
