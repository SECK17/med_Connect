// routes/medecinRoutes.js
const express = require('express');
const router = express.Router();
// Identifiants d'URL numériques : 400 clair au lieu d'une erreur SQL
const { verifierParamId } = require('../validation');
['id'].forEach(p => router.param(p, verifierParamId));
const { authenticate, authorize } = require('../middleware/authenticate');
const { valider } = require('../validation');
const S = require('../validation/schemas');
const {
  lister,
  detail,
  modifier,
  validerMedecin,
} = require('../controllers/medecinController');

/**
 * GET /api/medecins
 * Récupère la liste de tous les médecins
 */
router.get('/', lister);

/**
 * GET /api/medecins/:id
 * Récupère le profil complet d'un médecin
 */
router.get('/:id', detail);

/**
 * PUT /api/medecins/:id
 * Modifie le profil du médecin (médecin seulement)
 */
router.put('/:id', authenticate, authorize('medecin', 'admin'), valider({ body: S.medecin.modifier }), modifier);

/**
 * PUT /api/medecins/:id/validate
 * Valide un compte médecin (admin seulement)
 */
router.put('/:id/validate', authenticate, authorize('admin'), validerMedecin);

module.exports = router;
