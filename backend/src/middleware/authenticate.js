// middleware/authenticate.js
const jwt = require('jsonwebtoken');

/**
 * Middleware d'authentification
 * Vérifie que le token JWT est valide et ajoute les données utilisateur à req.user
 */
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({ message: 'Token manquant.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
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

module.exports = { authenticate, authorize };
