// controllers/consultationController.js
// Comptes-rendus de consultation.
// Les contrôles d'accès (authentification, rôle, droits sur le dossier), la validation
// des données et la traçabilité sont faits par les middlewares déclarés dans
// routes/consultationRoutes.js, avant l'appel de ces fonctions.
const { paginatedFindAll } = require('../utils/pagination');
const Consultation = require('../models/Consultation');
const User    = require('../models/User');
const Medecin = require('../models/Medecin');
const Patient = require('../models/Patient');

// POST /api/consultations
const creer = async (req, res) => {
  try {
    const { patient_id, rdv_id, date, hopital, motif, diagnostic, traitement, notes } = req.body;
    if (!patient_id) return res.status(400).json({ message: 'patient_id requis.' });

    const consult = await Consultation.create({
      patient_id,
      medecin_id: req.user.id,
      rdv_id:     rdv_id     || null,
      date:       date       || new Date().toISOString().split('T')[0],
      hopital:    hopital    || null,
      motif:      motif      || null,
      diagnostic: diagnostic || null,
      traitement: traitement || null,
      notes:      notes      || null,
    });

    res.status(201).json(consult);
  } catch (err) {
    console.error('Erreur création consultation:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/consultations/patient/:id
const listerParPatient = async (req, res) => {
  try {
    const patientId = req.params.id;

    // Un patient ne peut voir que son propre carnet
    if (req.user.role === 'patient' && String(req.user.id) !== String(patientId)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const consultations = await paginatedFindAll(req, res, Consultation, {
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

    res.json(consultations);
  } catch (err) {
    console.error('Erreur récupération carnet:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/consultations/medecin/:id
const listerParMedecin = async (req, res) => {
  try {
    const consultations = await paginatedFindAll(req, res, Consultation, {
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

    res.json(consultations);
  } catch (err) {
    console.error('Erreur récupération consultations médecin:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// DELETE /api/consultations/:id
const supprimer = async (req, res) => {
  try {
    const consult = await Consultation.findByPk(req.params.id);
    if (!consult) return res.status(404).json({ message: 'Consultation non trouvée.' });
    res.locals.journal = { patientId: consult.patient_id, ressourceId: consult.id };
    if (String(consult.medecin_id) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    await consult.destroy();
    res.json({ message: 'Consultation supprimée.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  creer,
  listerParPatient,
  listerParMedecin,
  supprimer,
};
