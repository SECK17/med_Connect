const express = require("express");
const { authenticate, authorize } = require("../middleware/authenticate");

const router = express.Router();

// Identifiants d'URL numériques : 400 clair au lieu d'une erreur SQL
const { verifierParamId } = require("../validation");
const {
  lister,
  validerMedecin,
  rejeterMedecin,
  supprimer,
} = require('../controllers/userController');
["id"].forEach(p => router.param(p, verifierParamId));
// ==========================================
// GET /api/users - Récupérer tous les utilisateurs (admin uniquement)
// ==========================================
router.get("/", authenticate, authorize("admin"), lister);

// ==========================================
// PUT /api/users/:id/validate - Valider un médecin (admin)
// ==========================================
router.put("/:id/validate", authenticate, authorize("admin"), validerMedecin);

// ==========================================
// PUT /api/users/:id/reject - Rejeter un médecin (admin)
// ==========================================
router.put("/:id/reject", authenticate, authorize("admin"), rejeterMedecin);

// ==========================================
// DELETE /api/users/:id - Supprimer un utilisateur (admin)
// ==========================================
router.delete("/:id", authenticate, authorize("admin"), supprimer);

module.exports = router;
