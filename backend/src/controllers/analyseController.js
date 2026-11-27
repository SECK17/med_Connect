// controllers/analyseController.js
// Résultats d'analyses (fichiers envoyés par les médecins).
// Les contrôles d'accès (authentification, rôle, droits sur le dossier), la validation
// des données et la traçabilité sont faits par les middlewares déclarés dans
// routes/analyseRoutes.js, avant l'appel de ces fonctions.
const { paginatedFindAll } = require('../utils/pagination');
const Analyse = require('../models/Analyse');
const User = require('../models/User');
const Medecin = require('../models/Medecin');
const Patient = require('../models/Patient');

// POST /api/analyses/upload
const envoyerFichier = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier envoyé.' });
    const { patient_id, notes } = req.body;
    if (!patient_id) return res.status(400).json({ message: 'patient_id requis.' });

    const analyse = await Analyse.create({
      patient_id,
      medecin_id: req.user.id,
      fichier: `uploads/analyses/${req.file.filename}`,
      notes: notes || null,
      date: new Date().toISOString().split('T')[0],
    });
    res.status(201).json(analyse);
  } catch (err) {
    console.error('Erreur upload analyse:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/analyses/patient/:id
const listerParPatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    if (req.user.role === 'patient' && String(req.user.id) !== String(patientId)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    const analyses = await paginatedFindAll(req, res, Analyse, {
      where: { patient_id: patientId },
      include: [
        {
          model: Medecin,
          as: 'medecin',
          include: [{ model: User, as: 'user', attributes: ['nom'] }],
        },
      ],
      order: [['date', 'DESC']],
    });
    res.json(analyses);
  } catch (err) {
    console.error('Erreur récupération analyses:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/analyses/medecin/:id
const listerParMedecin = async (req, res) => {
  try {
    const analyses = await paginatedFindAll(req, res, Analyse, {
      where: { medecin_id: req.params.id },
      include: [
        {
          model: Patient,
          as: 'patient',
          include: [{ model: User, as: 'user', attributes: ['nom'] }],
        },
      ],
      order: [['date', 'DESC']],
    });
    res.json(analyses);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  envoyerFichier,
  listerParPatient,
  listerParMedecin,
};
