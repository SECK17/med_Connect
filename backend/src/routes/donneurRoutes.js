const express = require("express");
const { User, Patient } = require("../models");
const { authenticate } = require("../middleware/authenticate");


const router = express.Router();

// PUT /api/donneur/inscription — patient s'inscrit comme donneur
router.put("/inscription", authenticate, async (req, res) => {
  try {
    const { groupe, ville } = req.body;
    const patient = await Patient.findByPk(req.user.id);
    if (!patient) return res.status(404).json({ message: "Profil patient introuvable." });
    const updates = { donneurDisponible: true };
    if (groupe) updates.groupeSanguin = groupe;
    if (ville)  updates.adresse = ville;
    await patient.update(updates);
    res.json({ message: "Inscription donneur enregistrée.", groupe: patient.groupeSanguin });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// PUT /api/donneur/disponibilite — toggle disponibilité donneur
router.put("/disponibilite", authenticate, async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.user.id);
    if (!patient) return res.status(404).json({ message: "Profil patient introuvable." });
    await patient.update({ donneurDisponible: !patient.donneurDisponible });
    res.json({ disponible: patient.donneurDisponible });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// GET /api/donneur/dashboard
router.get("/dashboard", authenticate, async (req, res) => {
  try {
    const donorCount = await User.count({ where: { role: "donneur" } });
    const urgentRequests = 0;
    const hospitalCount = 0;
    const thisMonthDonations = 0;

    const donneurs = await User.findAll({
      where: { role: "donneur" },
      include: [{ model: Patient, as: "profil_patient", attributes: ["groupeSanguin", "dateNaissance", "adresse"] }],
      attributes: ["id", "nom", "email", "telephone", "role", "photo"],
    });

    const formattedDonors = donneurs.map((user) => ({
      id: user.id,
      name: user.nom,
      email: user.email,
      phone: user.telephone,
      blood: user.profil_patient?.groupeSanguin || null,
      age: user.profil_patient?.dateNaissance ? new Date().getFullYear() - new Date(user.profil_patient.dateNaissance).getFullYear() : null,
      city: user.profil_patient?.adresse || "Non renseignée",
      district: user.profil_patient?.adresse || "Non renseigné",
      distance: "À déterminer",
      lastDonation: "Aucun historique",
      status: "Disponible",
      sexe: "Non renseigné",
      avatar: (user.nom || "D").charAt(0).toUpperCase(),
    }));

    res.json({
      stats: {
        donorCount,
        urgentRequests,
        hospitalCount,
        thisMonthDonations,
      },
      donneurs: formattedDonors,
    });
  } catch (error) {
    console.error("Erreur donneur dashboard :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

// GET /api/donneur/profil — groupe sanguin du donneur connecté
router.get("/profil", authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Patient, as: "profil_patient", attributes: ["groupeSanguin"] }],
      attributes: ["id", "nom", "email"],
    });
    res.json({ groupe_sanguin: user?.profil_patient?.groupeSanguin || null });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// PUT /api/donneur/localisation — sauvegarder la position GPS
router.put("/localisation", authenticate, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude == null || longitude == null)
      return res.status(400).json({ message: "Latitude et longitude requises." });
    const patient = await Patient.findByPk(req.user.id);
    if (!patient) return res.status(404).json({ message: "Profil introuvable." });
    await patient.update({ latitude, longitude });
    res.json({ message: "Position mise à jour." });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});

module.exports = router;
