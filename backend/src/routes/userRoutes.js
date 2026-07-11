const express = require("express");
const { User, Patient, Medecin } = require("../models");
const { authenticate, authorize } = require("../middleware/authenticate");
const { sendMedecinValide, sendMedecinRejete } = require("../services/emailService");

const router = express.Router();

// ==========================================
// GET /api/users - Récupérer tous les utilisateurs (admin uniquement)
// ==========================================
router.get("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const users = await User.findAll({
      include: [
        {
          model: Patient,
          as: "profil_patient",
          attributes: ["dateNaissance", "adresse", "groupeSanguin"],
        },
        {
          model: Medecin,
          as: "profil_medecin",
          attributes: ["specialite", "numLicence", "valide", "disponible", "experience", "tarif", "hopital"],
        },
      ],
      attributes: { exclude: ["password"] },
    });

    // Formater la réponse
    const formattedUsers = users.map((user) => ({
      id: user.id,
      nom: user.nom,
      email: user.email,
      telephone: user.telephone,
      role: user.role,
      createdAt: user.createdAt,
      // Pour médecins
      isVerified: user.profil_medecin ? user.profil_medecin.valide : null,
      specialite: user.profil_medecin ? user.profil_medecin.specialite : null,
      numLicence: user.profil_medecin ? user.profil_medecin.numLicence : null,
      disponible: user.profil_medecin ? user.profil_medecin.disponible : null,
      hopital:    user.profil_medecin ? user.profil_medecin.hopital    : null,
      // Pour patients
      groupeSanguin: user.profil_patient ? user.profil_patient.groupeSanguin : null,
      dateNaissance: user.profil_patient ? user.profil_patient.dateNaissance : null,
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.error("Erreur GET /users :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ==========================================
// PUT /api/users/:id/validate - Valider un médecin (admin)
// ==========================================
router.put("/:id/validate", authenticate, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    if (user.role !== "medecin") {
      return res.status(400).json({ message: "Seuls les médecins peuvent être validés" });
    }

    // Mettre à jour le profil médecin (id = user.id)
    await Medecin.update(
      { valide: true },
      { where: { id: user.id } }
    );

    sendMedecinValide(user.email, user.nom).catch(() => {});
    res.json({ message: "Médecin validé avec succès", user });
  } catch (err) {
    console.error("Erreur PUT /users/:id/validate :", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ==========================================
// PUT /api/users/:id/reject - Rejeter un médecin (admin)
// ==========================================
router.put("/:id/reject", authenticate, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    if (user.role !== "medecin") {
      return res.status(400).json({ message: "Seuls les médecins peuvent être rejetés" });
    }

    // Mettre à jour le profil médecin (id = user.id)
    await Medecin.update(
      { valide: false },
      { where: { id: user.id } }
    );

    sendMedecinRejete(user.email, user.nom).catch(() => {});
    res.json({ message: "Médecin rejeté avec succès", user });
  } catch (err) {
    console.error("Erreur PUT /users/:id/reject :", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ==========================================
// DELETE /api/users/:id - Supprimer un utilisateur (admin)
// ==========================================
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Empêcher de supprimer l'admin lui-même
    if (user.role === "admin") {
      return res.status(403).json({ message: "Impossible de supprimer un compte administrateur" });
    }

    await user.destroy();
    res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (err) {
    console.error("Erreur DELETE /users/:id :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
