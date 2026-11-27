const express = require('express');
const router = express.Router();
// Identifiants d'URL numériques : 400 clair au lieu d'une erreur SQL
const { verifierParamId } = require('../validation');
['id'].forEach(p => router.param(p, verifierParamId));
const { authenticate, authorize } = require('../middleware/authenticate');
const { journaliser } = require('../middleware/journal');
const { valider } = require('../validation');
const S = require('../validation/schemas');
const { exigerAccesPatient, exigerSoiMemeOuAdmin, exigerMedecinSuitPatientBody } = require('../middleware/access');
const { uploadAnalyse } = require('../middleware/upload');
const {
  envoyerFichier,
  listerParPatient,
  listerParMedecin,
} = require('../controllers/analyseController');

// POST /api/analyses/upload — médecin upload un résultat d'analyse
router.post('/upload', authenticate, journaliser('analyses', 'creation', { param: null }), authorize('medecin'), uploadAnalyse.single('fichier'), valider({ body: S.ordonnance.upload }), exigerMedecinSuitPatientBody, envoyerFichier);

// GET /api/analyses/patient/:id — analyses d'un patient
router.get('/patient/:id', authenticate, journaliser('analyses', 'lecture'), exigerAccesPatient('id'), listerParPatient);

// GET /api/analyses/medecin/:id — analyses envoyées par un médecin
router.get('/medecin/:id', authenticate, authorize('medecin', 'admin'), exigerSoiMemeOuAdmin('id'), listerParMedecin);

module.exports = router;
