// routes/journalRoutes.js
// Consultation du journal d'accès aux dossiers médicaux.
//   GET /api/journal/patient/:patientId  → le patient (ou l'admin) : qui a accédé à son dossier
//   GET /api/journal                     → admin : tout le journal, avec filtres
// Pagination : ?page & ?limit (en-têtes X-Total-Count…). Sans ?limit, 50 entrées les plus récentes.
const express = require('express');
const router = express.Router();
const { verifierParamId, valider } = require('../validation');
const S = require('../validation/schemas');
const { authenticate, authorize } = require('../middleware/authenticate');
const { exigerSoiMemeOuAdmin } = require('../middleware/access');
const {
  journalPatient,
  journalGlobal,
} = require('../controllers/journalController');

router.param('patientId', verifierParamId);

router.get('/patient/:patientId', authenticate, exigerSoiMemeOuAdmin('patientId'),
  valider({ query: S.journal.patient }), journalPatient);

router.get('/', authenticate, authorize('admin'), valider({ query: S.journal.filtres }), journalGlobal);

module.exports = router;
