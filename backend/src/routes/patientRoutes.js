// routes/patientRoutes.js
const express = require('express');
const router = express.Router();
// Identifiants d'URL numériques : 400 clair au lieu d'une erreur SQL
const { verifierParamId } = require('../validation');
['id'].forEach(p => router.param(p, verifierParamId));
const { authenticate, authorize } = require('../middleware/authenticate');
const { journaliser } = require('../middleware/journal');
const { valider } = require('../validation');
const S = require('../validation/schemas');
const { exigerAccesPatient, exigerSoiMemeOuAdmin } = require('../middleware/access');
const {
  detail,
  modifier,
} = require('../controllers/patientController');

/**
 * GET /api/patients/:id
 * Récupère le profil complet d'un patient
 */
router.get('/:id', authenticate, journaliser('profil', 'lecture'), exigerAccesPatient('id'), detail);

/**
 * PUT /api/patients/:id
 * Modifie le profil du patient
 */
router.put('/:id', authenticate, journaliser('profil', 'modification'), authorize('patient', 'donneur', 'admin'), exigerSoiMemeOuAdmin('id'), valider({ body: S.patient.modifier }), modifier);

module.exports = router;
