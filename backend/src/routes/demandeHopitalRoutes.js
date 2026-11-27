// routes/demandeHopitalRoutes.js — demandes de changement d'hôpital des médecins
const express = require('express');
const { authenticate, authorize } = require('../middleware/authenticate');
const { uploadJustificatif } = require('../middleware/upload');
const { valider, verifierParamId } = require('../validation');
const S = require('../validation/schemas');
const {
  creer,
  maDemande,
  annulerMaDemande,
  lister,
  validerDemande,
  rejeterDemande,
} = require('../controllers/demandeHopitalController');

const router = express.Router();
// Identifiants d'URL numériques : 400 clair au lieu d'une erreur SQL
router.param('id', verifierParamId);

// POST / — médecin soumet une demande
router.post('/', authenticate, authorize('medecin'), uploadJustificatif.single('justificatif'), valider({ body: S.demandeHopital.creer }), creer);

// GET /moi — médecin voit sa demande en cours
router.get('/moi', authenticate, authorize('medecin'), maDemande);

// DELETE /moi — médecin annule sa demande
router.delete('/moi', authenticate, authorize('medecin'), annulerMaDemande);

// GET / — admin voit toutes les demandes (filtrables par statut)
router.get('/', authenticate, authorize('admin'), lister);

// PUT /:id/valider — admin valide la demande et met à jour l'hôpital du médecin
router.put('/:id/valider', authenticate, authorize('admin'), validerDemande);

// PUT /:id/rejeter — admin rejette la demande
router.put('/:id/rejeter', authenticate, authorize('admin'), valider({ body: S.demandeHopital.rejeter }), rejeterDemande);

module.exports = router;
