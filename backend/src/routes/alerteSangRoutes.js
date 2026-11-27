const express = require('express');
const router  = express.Router();
// Identifiants d'URL numériques : 400 clair au lieu d'une erreur SQL
const { verifierParamId } = require('../validation');
['id'].forEach(p => router.param(p, verifierParamId));
const { authenticate, authorize } = require('../middleware/authenticate');
const { valider } = require('../validation');
const S = require('../validation/schemas');
const { exigerAlerteDeMonHopital } = require('../middleware/access');
const {
  creer,
  listerPourPatient,
  listerMesAlertes,
  listerPourDonneur,
  repondre,
  mesReponses,
  listerReponses,
  listerToutes,
  modifierStatut,
  supprimer,
} = require('../controllers/alerteSangController');


// ── Admin hôpital : créer une alerte ─────────────────────────
router.post('/', authenticate, authorize('admin_hopital'), valider({ body: S.alerte.creer }), creer);

// ── Patient : toutes les alertes actives (avec distance) ─────
router.get('/patient', authenticate, listerPourPatient);

// ── Admin hôpital : ses alertes avec compteur réponses ────────
router.get('/moi', authenticate, authorize('admin_hopital'), listerMesAlertes);

// ── Donneur : alertes compatibles + filtre zone + distance ───
router.get('/donneur', authenticate, authorize('donneur'), listerPourDonneur);

// ── Donneur/Patient : enregistrer une réponse ────────────────
router.post('/:id/repondre', authenticate, authorize('donneur', 'patient'), repondre);

// ── Mes réponses avec détails de l'alerte ────────────────────
router.get('/mes-reponses', authenticate, mesReponses);

// ── Admin : liste des répondants pour une alerte ──────────────
router.get('/:id/reponses', authenticate, authorize('admin_hopital', 'admin'), exigerAlerteDeMonHopital, listerReponses);

// ── Super admin : toutes les alertes ─────────────────────────
router.get('/toutes', authenticate, authorize('admin'), listerToutes);

// ── Admin hôpital : changer statut ───────────────────────────
router.put('/:id', authenticate, authorize('admin_hopital', 'admin'), valider({ body: S.alerte.statut }), exigerAlerteDeMonHopital, modifierStatut);

// ── Admin hôpital : supprimer ─────────────────────────────────
router.delete('/:id', authenticate, authorize('admin_hopital', 'admin'), exigerAlerteDeMonHopital, supprimer);

module.exports = router;
