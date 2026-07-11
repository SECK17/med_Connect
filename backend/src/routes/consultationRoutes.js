const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/authenticate');
const Consultation = require('../models/Consultation');
const User    = require('../models/User');
const Medecin = require('../models/Medecin');
const Patient = require('../models/Patient');

// POST /api/consultations — médecin crée un compte-rendu
router.post('/', authenticate, authorize('medecin'), async (req, res) => {
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
});

// GET /api/consultations/patient/:id — carnet de santé d'un patient
router.get('/patient/:id', authenticate, async (req, res) => {
  try {
    const patientId = req.params.id;

    // Un patient ne peut voir que son propre carnet
    if (req.user.role === 'patient' && String(req.user.id) !== String(patientId)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const consultations = await Consultation.findAll({
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
});

// GET /api/consultations/medecin/:id — toutes les consultations d'un médecin
router.get('/medecin/:id', authenticate, authorize('medecin', 'admin'), async (req, res) => {
  try {
    const consultations = await Consultation.findAll({
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
});

// DELETE /api/consultations/:id — médecin supprime un compte-rendu
router.delete('/:id', authenticate, authorize('medecin'), async (req, res) => {
  try {
    const consult = await Consultation.findByPk(req.params.id);
    if (!consult) return res.status(404).json({ message: 'Consultation non trouvée.' });
    if (String(consult.medecin_id) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    await consult.destroy();
    res.json({ message: 'Consultation supprimée.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
