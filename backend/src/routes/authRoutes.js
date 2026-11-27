// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
  register, login, createAdmin, createFirstAdmin,
  forgotPassword, resetPassword, verifyEmail, resendVerification,
  refresh, logout, logoutAll,
} = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/authenticate');

const { valider } = require('../validation');
const S = require('../validation/schemas');
/**
 * POST /api/auth/register
 * Crée un nouveau compte utilisateur (patient, donneur, médecin)
 */
router.post('/register', valider({ body: S.auth.register }), register);

/**
 * POST /api/auth/login
 * Authentifie un utilisateur et retourne un token JWT
 */
router.post('/login', valider({ body: S.auth.login }), login);

/**
 * POST /api/auth/refresh
 * Renouvelle la session à partir du cookie httpOnly (rotation du jeton)
 */
router.post('/refresh', refresh);

/**
 * POST /api/auth/logout
 * Déconnecte cet appareil (révoque le cookie de session)
 */
router.post('/logout', logout);

/**
 * POST /api/auth/logout-all
 * Déconnecte tous les appareils de l'utilisateur connecté
 */
router.post('/logout-all', authenticate, logoutAll);

/**
 * POST /api/auth/forgot-password
 * Envoie un lien de réinitialisation (valable 1 h) à l'email indiqué
 */
router.post('/forgot-password', valider({ body: S.auth.email }), forgotPassword);

/**
 * POST /api/auth/reset-password
 * Définit un nouveau mot de passe à partir du token reçu par email
 */
router.post('/reset-password', valider({ body: S.auth.reset }), resetPassword);

/**
 * POST /api/auth/verify-email
 * Confirme l'adresse email à partir du token reçu par email
 */
router.post('/verify-email', valider({ body: S.auth.jeton }), verifyEmail);

/**
 * POST /api/auth/resend-verification
 * Renvoie un lien de vérification (si le compte n'est pas encore vérifié)
 */
router.post('/resend-verification', valider({ body: S.auth.email }), resendVerification);

/**
 * POST /api/auth/create-first-admin
 * Crée le premier compte admin (sans authentification, avec code admin)
 */
router.post('/create-first-admin', valider({ body: S.auth.premierAdmin }), createFirstAdmin);

/**
 * POST /api/auth/create-admin
 * Crée un nouveau compte admin (authentification requise, admin seulement)
 */
router.post('/create-admin', authenticate, authorize('admin'), valider({ body: S.auth.admin }), createAdmin);

module.exports = router;
