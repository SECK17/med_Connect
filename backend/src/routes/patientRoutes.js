// routes/patientRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authenticate');
const User    = require('../models/User');
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
      include: [{ model: Patient, as: 'profil_patient' }],
      attributes: ['id', 'nom', 'email', 'telephone', 'role'],
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
    const { dateNaissance, adresse, groupeSanguin, telephone, allergies, antecedents, traitements, vaccinations } = req.body;

    // Vérification: le patient ne peut modifier que son propre profil
    if (req.user.role === 'patient' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const [user, patient] = await Promise.all([
      User.findByPk(id),
      Patient.findByPk(id),
    ]);
    if (!patient || !user) {
      return res.status(404).json({ message: 'Patient introuvable.' });
    }

    // Mise à jour table Patient
    const patientUpdates = {};
    if (dateNaissance !== undefined)  patientUpdates.dateNaissance  = dateNaissance;
    if (adresse       !== undefined)  patientUpdates.adresse        = adresse;
    if (groupeSanguin)                patientUpdates.groupeSanguin  = groupeSanguin;
    if (allergies     !== undefined)  patientUpdates.allergies      = allergies;
    if (antecedents   !== undefined)  patientUpdates.antecedents    = antecedents;
    if (traitements   !== undefined)  patientUpdates.traitements    = traitements;
    if (vaccinations  !== undefined)  patientUpdates.vaccinations   = vaccinations;

    // Mise à jour table User (téléphone)
    const userUpdates = {};
    if (telephone !== undefined) userUpdates.telephone = telephone;

    await Promise.all([
      Object.keys(patientUpdates).length ? patient.update(patientUpdates) : Promise.resolve(),
      Object.keys(userUpdates).length    ? user.update(userUpdates)       : Promise.resolve(),
    ]);

    res.json({ ...patient.toJSON(), telephone: user.telephone });
  } catch (err) {
    console.error('Erreur modification patient:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
