const express = require("express");
const { authenticate } = require("../middleware/authenticate");


const { valider } = require("../validation");
const S = require("../validation/schemas");
const {
  inscrire,
  changerDisponibilite,
  tableauDeBord,
  profil,
  mettreAJourLocalisation,
} = require('../controllers/donneurController');
const router = express.Router();

// PUT /api/donneur/inscription — patient s'inscrit comme donneur
router.put("/inscription", authenticate, valider({ body: S.donneur.inscription }), inscrire);

// PUT /api/donneur/disponibilite — toggle disponibilité donneur
router.put("/disponibilite", authenticate, changerDisponibilite);

// GET /api/donneur/dashboard
router.get("/dashboard", authenticate, tableauDeBord);

// GET /api/donneur/profil — groupe sanguin du donneur connecté
router.get("/profil", authenticate, profil);

// PUT /api/donneur/localisation — sauvegarder la position GPS
router.put("/localisation", authenticate, valider({ body: S.donneur.localisation }), mettreAJourLocalisation);

module.exports = router;
