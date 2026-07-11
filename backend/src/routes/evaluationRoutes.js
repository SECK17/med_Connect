const express = require("express");
const router  = express.Router();
const { Evaluation } = require("../models");
const { authenticate } = require("../middleware/authenticate");

// POST /api/evaluations — patient évalue un médecin (une seule par médecin)
router.post("/", authenticate, async (req, res) => {
  try {
    const { medecin_id, rdv_id, note, commentaire } = req.body;
    if (!medecin_id || !note || note < 1 || note > 5)
      return res.status(400).json({ message: "Données invalides." });

    await Evaluation.upsert({
      patient_id:  req.user.id,
      medecin_id,
      rdv_id:      rdv_id || null,
      note,
      commentaire: commentaire || null,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// GET /api/evaluations/medecin/:id — note moyenne d'un médecin
router.get("/medecin/:id", async (req, res) => {
  try {
    const evals = await Evaluation.findAll({ where: { medecin_id: req.params.id } });
    const total = evals.length;
    const moyenne = total
      ? Math.round((evals.reduce((s, e) => s + e.note, 0) / total) * 10) / 10
      : null;
    res.json({ moyenne, total });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// GET /api/evaluations/patient/moi — évaluations déjà soumises par ce patient
router.get("/patient/moi", authenticate, async (req, res) => {
  try {
    const evals = await Evaluation.findAll({ where: { patient_id: req.user.id } });
    res.json(evals);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});

module.exports = router;
