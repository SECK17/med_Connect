// routes/rendezvousRoutes.js
const express = require('express');
const router = express.Router();
// Identifiants d'URL numériques : 400 clair au lieu d'une erreur SQL
const { verifierParamId } = require('../validation');
['id', 'medecinId', 'patientId'].forEach(p => router.param(p, verifierParamId));
const { authenticate, authorize } = require('../middleware/authenticate');
const { journaliser } = require('../middleware/journal');
const { valider } = require('../validation');
const S = require('../validation/schemas');
const { exigerAccesPatient, exigerSoiMemeOuAdmin } = require('../middleware/access');
const {
  listerParPatient,
  listerParMedecin,
  statistiques,
  creer,
  modifier,
  supprimer,
} = require('../controllers/rendezvousController');

/**
 * GET /api/rendezvous/patient/:patientId
 * Récupère tous les rendez-vous d'un patient
 */
router.get('/patient/:patientId', authenticate, journaliser('rendezvous', 'lecture', { param: 'patientId' }), exigerAccesPatient('patientId'), listerParPatient);

/**
 * GET /api/rendezvous/medecin/:medecinId
 * Récupère tous les rendez-vous d'un médecin
 */
router.get('/medecin/:medecinId', authenticate, exigerSoiMemeOuAdmin('medecinId'), listerParMedecin);

/**
 * GET /api/rendezvous/stats
 * Statistiques globales des RDV (super admin)
 */
router.get('/stats', authenticate, authorize('admin'), statistiques);

/**
 * POST /api/rendezvous
 * Crée un nouveau rendez-vous (patient)
 */
router.post('/', authenticate, authorize('patient', 'donneur'), valider({ body: S.rendezvous.creer }), creer);

/**
 * PUT /api/rendezvous/:id
 * Modifie le statut et les détails d'un rendez-vous
 * - medecin : confirme ou annule ses propres RDV (date_rdv, heure, statut)
 * - admin_hopital : transfère un RDV vers un médecin (statut = transfere)
 * - patient : annule uniquement son propre RDV (statut = annule)
 * - admin : accès complet
 */
router.put('/:id', authenticate, authorize('medecin', 'admin', 'admin_hopital', 'patient'), valider({ body: S.rendezvous.modifier }), modifier);

/**
 * DELETE /api/rendezvous/:id
 * Annule un rendez-vous
 */
router.delete('/:id', authenticate, supprimer);

module.exports = router;
