// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, createAdmin, createFirstAdmin } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/authenticate');

/**
 * POST /api/auth/register
 * Crée un nouveau compte utilisateur (patient, donneur, médecin)
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Authentifie un utilisateur et retourne un token JWT
 */
router.post('/login', login);

/**
 * POST /api/auth/create-first-admin
 * Crée le premier compte admin (sans authentification, avec code admin)
 */
router.post('/create-first-admin', createFirstAdmin);

/**
 * POST /api/auth/create-admin
 * Crée un nouveau compte admin (authentification requise, admin seulement)
 */
router.post('/create-admin', authenticate, authorize('admin'), createAdmin);

module.exports = router;
