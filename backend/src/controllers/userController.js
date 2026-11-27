// controllers/userController.js
// Gestion des comptes (administrateur).
// Les contrôles d'accès (authentification, rôle, droits sur le dossier), la validation
// des données et la traçabilité sont faits par les middlewares déclarés dans
// routes/userRoutes.js, avant l'appel de ces fonctions.
const { User, Patient, Medecin } = require("../models");
const { paginatedFindAll } = require("../utils/pagination");
const { sendMedecinValide, sendMedecinRejete } = require("../services/emailService");

// GET /api/users
const lister = async (req, res) => {
  try {
    const users = await paginatedFindAll(req, res, User, {
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
};

// PUT /api/users/:id/validate
const validerMedecin = async (req, res) => {
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
};

// PUT /api/users/:id/reject
const rejeterMedecin = async (req, res) => {
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
};

// DELETE /api/users/:id
const supprimer = async (req, res) => {
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
};

module.exports = {
  lister,
  validerMedecin,
  rejeterMedecin,
  supprimer,
};
