const express = require("express");
const router  = express.Router();
// Identifiants d'URL numériques : 400 clair au lieu d'une erreur SQL
const { verifierParamId } = require("../validation");
["id"].forEach(p => router.param(p, verifierParamId));
const { authenticate, authorize } = require("../middleware/authenticate");

const { valider } = require("../validation");
const S = require("../validation/schemas");
const {
  creer,
  listerParMedecin,
  mesEvaluations,
} = require('../controllers/evaluationController');
// POST /api/evaluations — patient évalue un médecin (une seule par médecin)
router.post("/", authenticate, authorize("patient", "donneur"), valider({ body: S.evaluation.creer }), creer);

// GET /api/evaluations/medecin/:id — note moyenne d'un médecin
router.get("/medecin/:id", listerParMedecin);

// GET /api/evaluations/patient/moi — évaluations déjà soumises par ce patient
router.get("/patient/moi", authenticate, mesEvaluations);

module.exports = router;
