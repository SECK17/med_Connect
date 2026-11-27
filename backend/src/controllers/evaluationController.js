// controllers/evaluationController.js
// Avis des patients sur les médecins.
// Les contrôles d'accès (authentification, rôle, droits sur le dossier), la validation
// des données et la traçabilité sont faits par les middlewares déclarés dans
// routes/evaluationRoutes.js, avant l'appel de ces fonctions.
const { Op } = require("sequelize");
const { Evaluation, RendezVous } = require("../models");

// POST /api/evaluations
const creer = async (req, res) => {
  try {
    const { medecin_id, rdv_id, note, commentaire } = req.body;

    // Seul un patient ayant eu un rendez-vous confirmé et passé avec ce médecin peut le noter
    const aujourdhui = new Date().toISOString().split("T")[0];
    const rdv = await RendezVous.findOne({
      where: {
        patient_id: req.user.id,
        medecin_id,
        statut: "confirme",
        date_rdv: { [Op.lte]: aujourdhui },
        ...(rdv_id ? { id: rdv_id } : {}),
      },
      attributes: ["id"],
    });
    if (!rdv) {
      return res.status(403).json({ message: "Vous pouvez noter un médecin seulement après un rendez-vous avec lui." });
    }

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
};

// GET /api/evaluations/medecin/:id
const listerParMedecin = async (req, res) => {
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
};

// GET /api/evaluations/patient/moi
const mesEvaluations = async (req, res) => {
  try {
    const evals = await Evaluation.findAll({ where: { patient_id: req.user.id } });
    res.json(evals);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

module.exports = {
  creer,
  listerParMedecin,
  mesEvaluations,
};
