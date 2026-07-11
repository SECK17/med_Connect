// routes/patientRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authenticate');
const User = require('../models/User');
const Patient = require('../models/Patient');

/**
 * GET /api/patients/:id
 * Récupère le profil complet d'un patient
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérification: le patient ne peut voir que son profil
    if (req.user.role === 'patient' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const patient = await User.findByPk(id, {
      include: [
        {
          model: Patient,
          as: 'profil_patient',
        },
      ],
      attributes: ['id', 'nom', 'email', 'telephone'],
    });

    if (!patient || (patient.role !== 'patient' && patient.role !== 'donneur')) {
      return res.status(404).json({ message: 'Patient introuvable.' });
    }

    res.json(patient);
  } catch (err) {
    console.error('Erreur récupération patient:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

/**
 * PUT /api/patients/:id
 * Modifie le profil du patient
 */
router.put('/:id', authenticate, authorize('patient', 'donneur', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { dateNaissance, adresse, groupeSanguin } = req.body;

    // Vérification: le patient ne peut modifier que son propre profil
    if (req.user.role === 'patient' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const patient = await Patient.findByPk(id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient introuvable.' });
    }

    const updates = {};
    if (dateNaissance) updates.dateNaissance = dateNaissance;
    if (adresse) updates.adresse = adresse;
    if (groupeSanguin) updates.groupeSanguin = groupeSanguin;

    await patient.update(updates);
    res.json(patient);
  } catch (err) {
    console.error('Erreur modification patient:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
