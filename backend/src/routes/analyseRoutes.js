const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authenticate');
const { uploadAnalyse } = require('../middleware/upload');
const Analyse = require('../models/Analyse');
const User = require('../models/User');
const Medecin = require('../models/Medecin');
const Patient = require('../models/Patient');

// POST /api/analyses/upload — médecin upload un résultat d'analyse
router.post('/upload', authenticate, authorize('medecin'), uploadAnalyse.single('fichier'), async (req, res) => {
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
});

// GET /api/analyses/patient/:id — analyses d'un patient
router.get('/patient/:id', authenticate, async (req, res) => {
  try {
    const patientId = req.params.id;
    if (req.user.role === 'patient' && String(req.user.id) !== String(patientId)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    const analyses = await Analyse.findAll({
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
});

// GET /api/analyses/medecin/:id — analyses envoyées par un médecin
router.get('/medecin/:id', authenticate, authorize('medecin', 'admin'), async (req, res) => {
  try {
    const analyses = await Analyse.findAll({
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
});

module.exports = router;
