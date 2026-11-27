const express = require('express');
const router  = express.Router();
// Identifiants d'URL numériques : 400 clair au lieu d'une erreur SQL
const { verifierParamId } = require('../validation');
['id'].forEach(p => router.param(p, verifierParamId));
const { authenticate, authorize } = require('../middleware/authenticate');
const { journaliser } = require('../middleware/journal');
const { valider } = require('../validation');
const S = require('../validation/schemas');
const { exigerAccesPatient, exigerSoiMemeOuAdmin, exigerMedecinSuitPatientBody } = require('../middleware/access');
const {
  creer,
  listerParPatient,
  listerParMedecin,
  supprimer,
} = require('../controllers/consultationController');

// POST /api/consultations — médecin crée un compte-rendu
router.post('/', authenticate, journaliser('consultations', 'creation', { param: null }), authorize('medecin'), valider({ body: S.consultation.creer }), exigerMedecinSuitPatientBody, creer);

// GET /api/consultations/patient/:id — carnet de santé d'un patient
router.get('/patient/:id', authenticate, journaliser('consultations', 'lecture'), exigerAccesPatient('id'), listerParPatient);

// GET /api/consultations/medecin/:id — toutes les consultations d'un médecin
router.get('/medecin/:id', authenticate, authorize('medecin', 'admin'), exigerSoiMemeOuAdmin('id'), listerParMedecin);

// DELETE /api/consultations/:id — médecin supprime un compte-rendu
router.delete('/:id', authenticate, journaliser('consultations', 'suppression', { param: null }), authorize('medecin'), supprimer);

module.exports = router;
