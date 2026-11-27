// middleware/authenticate.js
const { verifierJetonAcces } = require('../services/tokenService');

const MESSAGES = {
  TOKEN_MANQUANT: 'Token manquant.',
  TOKEN_EXPIRE:   'Session expirée.',
  TOKEN_REVOQUE:  'Session révoquée. Veuillez vous reconnecter.',
  TOKEN_INVALIDE: 'Token invalide.',
};

/**
 * Middleware d'authentification
 * Vérifie le jeton d'accès (signature, expiration, révocation) et place { id, role } dans req.user.
 * En cas d'échec : 401 avec un `code` (TOKEN_EXPIRE → le frontend tente un rafraîchissement).
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // "Bearer TOKEN"
    const { user, erreur } = await verifierJetonAcces(token);
    if (erreur) return res.status(401).json({ code: erreur, message: MESSAGES[erreur] });
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware pour vérifier le rôle
 * Utilisation: authorize('admin', 'medecin')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé. Rôle insuffisant.' });
    }

    next();
  };
};

/**
 * Variante pour les fichiers (/uploads/...) : le jeton peut aussi venir de ?token=,
 * car <img src> et window.open ne peuvent pas envoyer d'en-tête Authorization.
 */
const authenticateFichier = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;
    const { user, erreur } = await verifierJetonAcces(token);
    if (erreur) return res.status(401).json({ code: erreur, message: 'Accès non autorisé.' });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, authenticateFichier, authorize };
