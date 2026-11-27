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
const { uploadOrdonnance } = require('../middleware/upload');
const {
  envoyerFichier,
  creer,
  listerParPatient,
  listerParMedecin,
} = require('../controllers/ordonnanceController');

// POST /api/ordonnances/upload — médecin upload une photo d'ordonnance
router.post('/upload', authenticate, journaliser('ordonnances', 'creation', { param: null }), authorize('medecin'), uploadOrdonnance.single('fichier'), valider({ body: S.ordonnance.upload }), exigerMedecinSuitPatientBody, envoyerFichier);

// POST /api/ordonnances — médecin crée une ordonnance (texte)
router.post('/', authenticate, journaliser('ordonnances', 'creation', { param: null }), authorize('medecin'), valider({ body: S.ordonnance.creer }), exigerMedecinSuitPatientBody, creer);

// GET /api/ordonnances/patient/:id — ordonnances d'un patient
router.get('/patient/:id', authenticate, journaliser('ordonnances', 'lecture'), exigerAccesPatient('id'), listerParPatient);

// GET /api/ordonnances/medecin/:id — ordonnances créées par un médecin
router.get('/medecin/:id', authenticate, authorize('medecin', 'admin'), exigerSoiMemeOuAdmin('id'), listerParMedecin);

module.exports = router;
