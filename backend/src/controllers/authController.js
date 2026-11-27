// controllers/authController.js
const bcrypt  = require("bcryptjs");
// Hash d'un mot de passe quelconque : comparé quand l'email est inconnu (temps de réponse identique)
const HASH_FACTICE = bcrypt.hashSync("medconnect-compte-inexistant", 10);
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const Patient = require("../models/Patient");
const Medecin = require("../models/Medecin");
const { sequelize } = require("../config/db");
const tokens = require("../services/tokenService");
const { ouvrirSession, revoquerTout } = tokens;
const { sendBienvenue, sendResetPassword, sendVerificationEmail } = require("../services/emailService");

const ROLES_INSCRIPTION = ["patient", "donneur", "medecin"];

// Clé distincte de JWT_SECRET : un lien de vérification ne peut pas servir de jeton de connexion.
const VERIFY_SECRET = () => `${process.env.JWT_SECRET}:verify-email`;

const envoyerLienVerification = (user) => {
  const token = jwt.sign(
    { id: user.id, purpose: "verify-email" },
    VERIFY_SECRET(),
    { expiresIn: "24h" }
  );
  return sendVerificationEmail(user.email, user.nom, token).catch(() => {});
};

const trouverParEmail = (email) =>
  User.findOne({
    where: sequelize.where(sequelize.fn("lower", sequelize.col("email")), email),
  });

// ══════════════════════════
// VÉRIFIER L'EMAIL
// ══════════════════════════
const verifyEmail = async (req, res) => {
  const invalide = { message: "Lien de vérification invalide ou expiré." };
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json(invalide);

    let decoded;
    try {
      decoded = jwt.verify(token, VERIFY_SECRET());
    } catch {
      return res.status(400).json(invalide);
    }
    if (decoded.purpose !== "verify-email") return res.status(400).json(invalide);

    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(400).json(invalide);

    if (!user.email_verifie) {
      user.email_verifie = true;
      await user.save();
      sendBienvenue(user.email, user.nom, user.role).catch(() => {});
    }

    return res.status(200).json({
      message: user.role === "medecin"
        ? "Email confirmé. Votre compte médecin doit encore être validé par l'administrateur."
        : "Email confirmé. Vous pouvez maintenant vous connecter.",
    });
  } catch (error) {
    console.error("❌ ERREUR VERIFY EMAIL :", error.message);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ══════════════════════════
// RENVOYER L'EMAIL DE VÉRIFICATION
// ══════════════════════════
const resendVerification = async (req, res) => {
  const reponse = { message: "Si un compte non vérifié existe pour cet email, un nouveau lien a été envoyé." };
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email) return res.status(400).json({ message: "Email requis." });

    const user = await trouverParEmail(email);
    if (user && !user.email_verifie) envoyerLienVerification(user);
    return res.status(200).json(reponse);
  } catch (error) {
    console.error("❌ ERREUR RESEND VERIFICATION :", error.message);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// La clé de signature inclut le hash actuel du mot de passe :
// dès que le mot de passe change, le lien devient invalide (usage unique).
const resetSecret = (user) => `${process.env.JWT_SECRET}:${user.password}`;

// ══════════════════════════
// MOT DE PASSE OUBLIÉ
// ══════════════════════════
const forgotPassword = async (req, res) => {
  // Réponse identique que l'email existe ou non (évite de révéler les comptes)
  const reponse = { message: "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé." };
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email) return res.status(400).json({ message: "Email requis." });

    // Comparaison insensible à la casse (les emails sont stockés tels que saisis)
    const user = await trouverParEmail(email);
    if (user) {
      const token = jwt.sign(
        { id: user.id, purpose: "reset" },
        resetSecret(user),
        { expiresIn: "1h" }
      );
      sendResetPassword(user.email, user.nom, token).catch(() => {});
    }
    return res.status(200).json(reponse);
  } catch (error) {
    console.error("❌ ERREUR FORGOT PASSWORD :", error.message);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ══════════════════════════
// RÉINITIALISER LE MOT DE PASSE
// ══════════════════════════
const resetPassword = async (req, res) => {
  const invalide = { message: "Lien invalide ou expiré. Refaites une demande." };
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token et nouveau mot de passe requis." });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères." });
    }

    const decoded = jwt.decode(token);
    if (!decoded?.id || decoded.purpose !== "reset") return res.status(400).json(invalide);

    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(400).json(invalide);

    try {
      jwt.verify(token, resetSecret(user));
    } catch {
      return res.status(400).json(invalide);
    }

    user.password = password; // haché par le hook beforeUpdate
    await user.save();
    // Déconnecte tous les appareils (si le compte avait été compromis)
    await revoquerTout(user.id, "mot_de_passe");

    return res.status(200).json({ message: "Mot de passe modifié. Vous pouvez vous connecter." });
  } catch (error) {
    console.error("❌ ERREUR RESET PASSWORD :", error.message);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ══════════════════════════
// REGISTER
// ══════════════════════════
const register = async (req, res) => {
  try {
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

    // Seuls patient / donneur / médecin peuvent s'inscrire publiquement.
    // Les comptes admin et admin_hopital sont créés par un administrateur.
    if (!ROLES_INSCRIPTION.includes(role)) {
      return res.status(403).json({ message: "Rôle non autorisé pour l'inscription." });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères." });
    }

    const userExists = await trouverParEmail(email);
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
      email_verifie: false,
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

    // Email de vérification (l'email de bienvenue part après confirmation)
    envoyerLienVerification(user);

    // Pas de token : l'utilisateur doit d'abord confirmer son email
    return res.status(201).json({
      message: role === "medecin"
        ? "Compte médecin créé. Confirmez votre email, puis attendez la validation par l'administrateur."
        : "Compte créé. Confirmez votre email pour pouvoir vous connecter.",
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

    // Même réponse, et même durée, que le compte existe ou non :
    // impossible de deviner quels emails sont inscrits.
    const user = await trouverParEmail(email);
    const isMatch = await bcrypt.compare(password, user ? user.password : HASH_FACTICE);
    if (!user || !isMatch) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect." });
    }

    if (user.email_verifie === false) {
      return res.status(403).json({
        code: "EMAIL_NON_VERIFIE",
        message: "Veuillez confirmer votre adresse email avant de vous connecter.",
      });
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

    // Jeton d'accès court + cookie de rafraîchissement httpOnly
    const token = await ouvrirSession(user, req, res);

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

    const userExists = await trouverParEmail(email);
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

    // Ouvrir la session du nouvel admin
    const token = await ouvrirSession(user, req, res);

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

    const userExists = await trouverParEmail(email);
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

// ══════════════════════════
// RAFRAÎCHIR LA SESSION
// ══════════════════════════
// Lit le cookie httpOnly, le remplace par un nouveau (rotation) et renvoie un jeton d'accès neuf.
const refresh = async (req, res) => {
  try {
    const { user, raw, erreur } = await tokens.rafraichir(tokens.lireCookie(req), req);
    if (erreur) {
      tokens.effacerCookie(res);
      return res.status(401).json({ code: erreur, message: "Session expirée. Veuillez vous reconnecter." });
    }
    tokens.poserCookie(res, raw);
    return res.status(200).json({
      token: tokens.signerJetonAcces(user),
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("❌ ERREUR REFRESH :", error.message);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ══════════════════════════
// DÉCONNEXION
// ══════════════════════════
// Révoque la session de cet appareil. Fonctionne même si le jeton d'accès a expiré.
const logout = async (req, res) => {
  try {
    await tokens.revoquer(tokens.lireCookie(req), "logout");
    tokens.effacerCookie(res);
    return res.status(200).json({ message: "Déconnecté." });
  } catch (error) {
    console.error("❌ ERREUR LOGOUT :", error.message);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// Déconnecte TOUS les appareils de l'utilisateur (jetons d'accès invalidés immédiatement).
const logoutAll = async (req, res) => {
  try {
    await revoquerTout(req.user.id, "logout_all");
    tokens.effacerCookie(res);
    return res.status(200).json({ message: "Tous vos appareils ont été déconnectés." });
  } catch (error) {
    console.error("❌ ERREUR LOGOUT ALL :", error.message);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

module.exports = {
  register, login, createAdmin, createFirstAdmin,
  forgotPassword, resetPassword, verifyEmail, resendVerification,
  refresh, logout, logoutAll,
};