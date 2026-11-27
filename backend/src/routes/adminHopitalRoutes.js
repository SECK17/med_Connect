const express = require('express');
const router  = express.Router();
// Identifiants d'URL numériques : 400 clair au lieu d'une erreur SQL
const { verifierParamId } = require('../validation');
['id'].forEach(p => router.param(p, verifierParamId));
const { authenticate, authorize } = require('../middleware/authenticate');
const { valider } = require('../validation');
const S = require('../validation/schemas');
const {
  creer,
  lister,
  monProfil,
  listerDonneurs,
  listerMedecins,
  validerMedecin,
  rejeterMedecin,
  listerRendezVous,
  transfererRendezVous,
  modifierStatutRendezVous,
  listerPatients,
  supprimer,
} = require('../controllers/adminHopitalController');

// ── Super admin : créer un admin hôpital ──────────────────────
router.post('/', authenticate, authorize('admin'), valider({ body: S.hopital.creerAdmin }), creer);

// ── Super admin : liste des admins hôpitaux ───────────────────
router.get('/', authenticate, authorize('admin'), lister);

// ── Admin hôpital : ses infos ─────────────────────────────────
router.get('/me', authenticate, authorize('admin_hopital'), monProfil);

// ── Admin hôpital : voir les donneurs (filtrables par groupe) ─
router.get('/donneurs', authenticate, authorize('admin_hopital', 'admin'), listerDonneurs);

// ── Admin hôpital : médecins de son hôpital ──────────────────
router.get('/medecins', authenticate, authorize('admin_hopital'), listerMedecins);

// ── Secrétaire : valider un médecin de l'hôpital ─────────────
router.put('/medecins/:id/valider', authenticate, authorize('admin_hopital'), validerMedecin);

// ── Secrétaire : rejeter un médecin de l'hôpital ─────────────
router.put('/medecins/:id/rejeter', authenticate, authorize('admin_hopital'), rejeterMedecin);

// ── Secrétaire : rendez-vous de l'hôpital ────────────────────
router.get('/rendez-vous', authenticate, authorize('admin_hopital'), listerRendezVous);

// ── Secrétaire : transférer un RDV au médecin ────────────────
router.put('/rendez-vous/:id/transferer', authenticate, authorize('admin_hopital'), transfererRendezVous);

// ── Secrétaire : annuler un RDV ──────────────────────────────
router.put('/rendez-vous/:id', authenticate, authorize('admin_hopital'), valider({ body: S.rendezvous.statutAdminHopital }), modifierStatutRendezVous);

// ── Secrétaire : patients ayant des RDV dans l'hôpital ───────
router.get('/patients', authenticate, authorize('admin_hopital'), listerPatients);

// ── Super admin : supprimer un admin hôpital ──────────────────
router.delete('/:id', authenticate, authorize('admin'), supprimer);

module.exports = router;
