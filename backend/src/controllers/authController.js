// controllers/authController.js
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const Patient = require("../models/Patient");
const Medecin = require("../models/Medecin");
const { sendBienvenue } = require("../services/emailService");

// ══════════════════════════
// REGISTER
// ══════════════════════════
const register = async (req, res) => {
  try {
    console.log("📥 REGISTER body :", req.body);

    const {
      nom, email, password, telephone, role,
      dateNaissance,
      adresse,
      groupeSanguin,
      specialite,
      numeroOrdre,
      hopital,
    } = req.body;

    if (!nom || !email || !password || !telephone || !role) {
      return res.status(400).json({ message: "Champs obligatoires manquants." });
    }

    // Admin ne peut être créé que via /create-first-admin ou /create-admin
    if (role === "admin") {
      return res.status(403).json({ message: "Admin ne peut pas être créé via register. Utilisez /api/auth/create-first-admin" });
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    // Ne PAS hasher ici - les hooks du modèle vont le faire !
    const user = await User.create({
      nom,
      email,
      password, // Passer le mot de passe en clair, le hook va le hasher
      telephone,
      role,
    });

    console.log("✅ User créé id:", user.id, "role:", user.role);

    // ── Patient / Donneur ──
    if (role === "patient" || role === "donneur") {
      await Patient.create({
        id: user.id,
        dateNaissance: dateNaissance || null,
        adresse: adresse || null,
        groupeSanguin: groupeSanguin || null,
        donneurDisponible: role === "donneur",
      });
      console.log("✅ Profil patient créé");
    }

    // ── Médecin ──
    if (role === "medecin") {
      await Medecin.create({
        id: user.id,
        specialite: specialite || null,
        numLicence: numeroOrdre || null,
        hopital: hopital || null,
        valide: false,
        disponible: true,
      });
      console.log("✅ Profil médecin créé");
    }

    // Email de bienvenue (fire-and-forget)
    sendBienvenue(email, nom, role).catch(() => {});

    // Générer token uniquement pour les non-médecins
    let token = null;
    if (role !== "medecin") {
      token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
    }

    return res.status(201).json({
      message: role === "medecin" 
        ? "Compte médecin créé. En attente de validation." 
        : "Compte créé avec succès.",
      token,
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role },
    });

  } catch (error) {
    console.error("❌ ERREUR REGISTER :", error.message);
    return res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// ══════════════════════════
// LOGIN
// ══════════════════════════
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis." });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Aucun compte associé à cet email." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mot de passe incorrect." });
    }

    if (user.role === "medecin") {
      const medecin = await Medecin.findByPk(user.id);
      if (!medecin) {
        return res.status(500).json({ message: "Profil médecin introuvable." });
      }
      if (!medecin.valide) {
        return res.status(403).json({
          message: "Votre compte médecin est en attente de validation par l'administrateur.",
        });
      }
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET manquant dans .env" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      token,
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role },
    });

  } catch (error) {
    console.error("❌ ERREUR LOGIN :", error.message);
    return res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// ══════════════════════════
// CREATE FIRST ADMIN (sans token)
// ══════════════════════════
const createFirstAdmin = async (req, res) => {
  try {
    const { nom, email, password, telephone, adminCode } = req.body;

    if (!nom || !email || !password || !telephone) {
      return res.status(400).json({ message: "Champs obligatoires manquants." });
    }

    if (!adminCode || adminCode !== process.env.ADMIN_CODE) {
      return res.status(403).json({ message: "Code administrateur invalide." });
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    // Créer le compte admin
    const user = await User.create({
      nom,
      email,
      password,
      telephone,
      role: "admin",
    });

    console.log("✅ Admin créé id:", user.id);

    // Générer token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Compte admin créé avec succès.",
      token,
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role },
    });

  } catch (error) {
    console.error("❌ ERREUR CREATE FIRST ADMIN :", error.message);
    return res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// ══════════════════════════
// CREATE ADMIN (par admin existant)
// ══════════════════════════
const createAdmin = async (req, res) => {
  try {
    const { nom, email, password, telephone } = req.body;

    // Vérifier que l'utilisateur est connecté et est admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Accès refusé. Seul un admin peut créer un autre admin." });
    }

    if (!nom || !email || !password || !telephone) {
      return res.status(400).json({ message: "Champs obligatoires manquants." });
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    // Créer le compte admin
    const user = await User.create({
      nom,
      email,
      password,
      telephone,
      role: "admin",
    });

    console.log("✅ Admin créé id:", user.id, "par admin id:", req.user.id);

    return res.status(201).json({
      message: "Compte admin créé avec succès.",
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role },
    });

  } catch (error) {
    console.error("❌ ERREUR CREATE ADMIN :", error.message);
    return res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

module.exports = { register, login, createAdmin, createFirstAdmin };