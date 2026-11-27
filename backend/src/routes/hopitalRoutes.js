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
  statistiquesRdvTous,
  detail,
  listerMedecins,
  listerPatients,
  statistiquesRdv,
  creer,
  modifier,
  supprimer,
} = require('../controllers/hopitalController');

// GET /api/hopitaux — liste de tous les hôpitaux
router.get('/', lister);

// GET /api/hopitaux/rdv-stats-all — stats RDV pour tous les hôpitaux (admin)
router.get('/rdv-stats-all', authenticate, authorize('admin'), statistiquesRdvTous);

// GET /api/hopitaux/:id — détail d'un hôpital
router.get('/:id', detail);

// GET /api/hopitaux/:id/medecins — médecins inscrits dans cet hôpital (admin)
router.get('/:id/medecins', authenticate, authorize('admin'), listerMedecins);

// GET /api/hopitaux/:id/patients — patients ayant eu un RDV dans cet hôpital (admin)
router.get('/:id/patients', authenticate, authorize('admin'), listerPatients);

// GET /api/hopitaux/:id/rdv-stats — stats RDV pour un hôpital (admin)
router.get('/:id/rdv-stats', authenticate, authorize('admin'), statistiquesRdv);

// POST /api/hopitaux — créer un hôpital (admin)
router.post('/', authenticate, authorize('admin'), valider({ body: S.hopital.enregistrer }), creer);

// PUT /api/hopitaux/:id — modifier un hôpital (admin)
router.put('/:id', authenticate, authorize('admin'), valider({ body: S.hopital.enregistrer }), modifier);

// DELETE /api/hopitaux/:id — supprimer un hôpital (admin)
router.delete('/:id', authenticate, authorize('admin'), supprimer);

module.exports = router;
