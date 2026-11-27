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
  partager,
  listerParPatient,
  listerParMedecin,
  retirer,
} = require('../controllers/partageController');

// POST /api/partages — patient partage son dossier avec un médecin
router.post('/', authenticate, journaliser('partages', 'creation', { param: null }), authorize('patient'), valider({ body: S.partage.creer }), partager);

// GET /api/partages/patient/:id — liste des médecins avec qui le patient a partagé
router.get('/patient/:id', authenticate, journaliser('partages', 'lecture'), exigerAccesPatient('id'), listerParPatient);

// GET /api/partages/medecin/:id — liste des patients qui ont partagé avec ce médecin
router.get('/medecin/:id', authenticate, authorize('medecin', 'admin'), exigerSoiMemeOuAdmin('id'), listerParMedecin);

// DELETE /api/partages/:id — révoquer un partage
router.delete('/:id', authenticate, journaliser('partages', 'suppression', { param: null }), authorize('patient'), retirer);

module.exports = router;
