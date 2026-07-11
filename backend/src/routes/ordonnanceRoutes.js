const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authenticate');
const { uploadOrdonnance } = require('../middleware/upload');
const Ordonnance = require('../models/Ordonnance');
const User = require('../models/User');
const Medecin = require('../models/Medecin');
const Patient = require('../models/Patient');

// POST /api/ordonnances/upload — médecin upload une photo d'ordonnance
router.post('/upload', authenticate, authorize('medecin'), uploadOrdonnance.single('fichier'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier envoyé.' });
    const { patient_id, notes } = req.body;
    if (!patient_id) return res.status(400).json({ message: 'patient_id requis.' });

    const ord = await Ordonnance.create({
      patient_id,
      medecin_id: req.user.id,
      fichier: `uploads/ordonnances/${req.file.filename}`,
      notes: notes || null,
      date: new Date().toISOString().split('T')[0],
    });
    res.status(201).json(ord);
  } catch (err) {
    console.error('Erreur upload ordonnance:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/ordonnances — médecin crée une ordonnance (texte)
router.post('/', authenticate, authorize('medecin'), async (req, res) => {
  try {
    const { patient_id, medicaments, notes, date } = req.body;
    if (!patient_id || !medicaments || !medicaments.length) {
      return res.status(400).json({ message: 'patient_id et medicaments requis.' });
    }
    const ord = await Ordonnance.create({
      patient_id,
      medecin_id: req.user.id,
      medicaments,
      notes: notes || null,
      date: date || new Date().toISOString().split('T')[0],
    });
    res.status(201).json(ord);
  } catch (err) {
    console.error('Erreur création ordonnance:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/ordonnances/patient/:id — ordonnances d'un patient
router.get('/patient/:id', authenticate, async (req, res) => {
  try {
    const patientId = req.params.id;
    if (req.user.role === 'patient' && String(req.user.id) !== String(patientId)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    const ords = await Ordonnance.findAll({
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
    res.json(ords);
  } catch (err) {
    console.error('Erreur récupération ordonnances:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/ordonnances/medecin/:id — ordonnances créées par un médecin
router.get('/medecin/:id', authenticate, authorize('medecin', 'admin'), async (req, res) => {
  try {
    const ords = await Ordonnance.findAll({
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
    res.json(ords);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
