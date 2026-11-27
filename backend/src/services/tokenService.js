// services/tokenService.js
// Gestion des sessions :
//  - jeton d'accès (JWT) court, envoyé dans l'en-tête Authorization ;
//  - jeton de rafraîchissement long, opaque, dans un cookie httpOnly,
//    renouvelé à chaque utilisation (rotation) avec détection de réutilisation.
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const Medecin = require('../models/Medecin');
const RefreshToken = require('../models/RefreshToken');

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TTL_JOURS = parseInt(process.env.REFRESH_TOKEN_DAYS, 10) || 7;
const COOKIE_NAME = 'medconnect_refresh';
const COOKIE_PATH = '/api/auth';

// Délai pendant lequel un jeton qui vient d'être remplacé est encore toléré :
// deux onglets qui se rafraîchissent en même temps ne doivent pas déclencher
// la détection de vol. Lu à chaque appel pour pouvoir être modifié dans les tests.
const graceMs = () => {
  const v = parseInt(process.env.REFRESH_REUSE_GRACE_MS, 10);
  return Number.isNaN(v) ? 30_000 : v;
};

const hash = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

// ── Jeton d'accès ────────────────────────────────────────────

/** JWT court : { id, role, tv } — tv = token_version de l'utilisateur. */
const signerJetonAcces = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, tv: user.token_version ?? 0 },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TTL }
  );

/**
 * Vérifie un jeton d'accès : signature, expiration, et version (révocation).
 * Renvoie { user: { id, role } } ou { erreur: 'TOKEN_EXPIRE' | 'TOKEN_INVALIDE' | 'TOKEN_REVOQUE' }.
 */
const verifierJetonAcces = async (token) => {
  if (!token) return { erreur: 'TOKEN_MANQUANT' };
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return { erreur: e.name === 'TokenExpiredError' ? 'TOKEN_EXPIRE' : 'TOKEN_INVALIDE' };
  }
  // Les liens de vérification / réinitialisation ne sont pas des jetons de connexion
  if (!decoded.id || decoded.purpose || typeof decoded.tv !== 'number') {
    return { erreur: 'TOKEN_INVALIDE' };
  }
  const user = await User.findByPk(decoded.id, { attributes: ['id', 'nom', 'role', 'token_version'] });
  if (!user || user.token_version !== decoded.tv) return { erreur: 'TOKEN_REVOQUE' };
  // Le rôle vient de la base : un changement de rôle s'applique immédiatement
  return { user: { id: user.id, role: user.role, nom: user.nom } };
};

// ── Jeton de rafraîchissement ────────────────────────────────

const creerJetonRafraichissement = async (user, req) => {
  const raw = crypto.randomBytes(48).toString('base64url');
  await RefreshToken.create({
    user_id: user.id,
    token_hash: hash(raw),
    expires_at: new Date(Date.now() + REFRESH_TTL_JOURS * 24 * 3600 * 1000),
    user_agent: (req?.headers?.['user-agent'] || '').slice(0, 255) || null,
  });
  return raw;
};

/** Révoque toutes les sessions d'un utilisateur et invalide ses jetons d'accès. */
const revoquerTout = async (userId, raison = 'logout_all') => {
  await RefreshToken.update(
    { revoked_at: new Date(), revoked_reason: raison },
    { where: { user_id: userId, revoked_at: null } }
  );
  await User.increment('token_version', { where: { id: userId } });
};

/**
 * Échange un jeton de rafraîchissement contre une nouvelle session.
 * Renvoie { user, raw } (nouveau jeton) ou { erreur }.
 */
const rafraichir = async (raw, req) => {
  if (!raw) return { erreur: 'SESSION_ABSENTE' };
  const rt = await RefreshToken.findOne({ where: { token_hash: hash(raw) } });
  if (!rt) return { erreur: 'SESSION_INVALIDE' };

  if (rt.revoked_at) {
    const recent = Date.now() - new Date(rt.revoked_at).getTime() < graceMs();
    if (!(rt.revoked_reason === 'rotation' && recent)) {
      // Un jeton déjà remplacé est réutilisé : probable vol → on coupe toutes les sessions
      if (rt.revoked_reason === 'rotation') await revoquerTout(rt.user_id, 'reutilisation');
      return { erreur: 'SESSION_REVOQUEE' };
    }
    // Rafraîchissement simultané (deux onglets) : toléré, on émet une nouvelle session
  } else if (new Date(rt.expires_at) < new Date()) {
    return { erreur: 'SESSION_EXPIREE' };
  }

  const user = await User.findByPk(rt.user_id);
  if (!user) return { erreur: 'SESSION_INVALIDE' };

  // Les conditions de connexion restent vérifiées à chaque renouvellement
  if (user.email_verifie === false) return { erreur: 'EMAIL_NON_VERIFIE' };
  if (user.role === 'medecin') {
    const m = await Medecin.findByPk(user.id, { attributes: ['valide'] });
    if (!m?.valide) {
      await revoquerTout(user.id, 'compte');
      return { erreur: 'COMPTE_NON_VALIDE' };
    }
  }

  if (!rt.revoked_at) await rt.update({ revoked_at: new Date(), revoked_reason: 'rotation' });
  const nouveau = await creerJetonRafraichissement(user, req);
  return { user, raw: nouveau };
};

const revoquer = async (raw, raison = 'logout') => {
  if (!raw) return;
  await RefreshToken.update(
    { revoked_at: new Date(), revoked_reason: raison },
    { where: { token_hash: hash(raw), revoked_at: null } }
  );
};

/** Supprime les jetons expirés depuis plus de 30 jours (appelé de temps en temps). */
const nettoyer = () =>
  RefreshToken.destroy({ where: { expires_at: { [Op.lt]: new Date(Date.now() - 30 * 24 * 3600 * 1000) } } });

// ── Cookie ───────────────────────────────────────────────────
// En local, frontend (localhost:5173) et API (localhost:5000) sont sur le même site :
// SameSite=Lax suffit. Si le frontend et l'API sont sur des domaines différents en
// production, définir COOKIE_SAMESITE=none (le cookie est alors forcément Secure).
// COOKIE_SECURE : true | false | auto. « auto » = Secure si la requête est arrivée en HTTPS
// (derrière un proxy, nécessite TRUST_PROXY pour lire X-Forwarded-Proto). Sans valeur :
// Secure en production, pas en développement.
const cookieSecure = (req, sameSite) => {
  if (sameSite === 'none') return true; // exigé par les navigateurs
  const v = (process.env.COOKIE_SECURE || '').toLowerCase();
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'auto') return !!req?.secure;
  return process.env.NODE_ENV === 'production';
};

const optionsCookie = (req) => {
  const sameSite = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
  return {
    httpOnly: true,
    secure: cookieSecure(req, sameSite),
    sameSite,
    path: COOKIE_PATH,
  };
};

const poserCookie = (res, raw) =>
  res.cookie(COOKIE_NAME, raw, { ...optionsCookie(res.req), maxAge: REFRESH_TTL_JOURS * 24 * 3600 * 1000 });

const effacerCookie = (res) => res.clearCookie(COOKIE_NAME, optionsCookie(res.req));

const lireCookie = (req) => req.cookies?.[COOKIE_NAME];

/** Ouvre une session : pose le cookie de rafraîchissement et renvoie le jeton d'accès. */
const ouvrirSession = async (user, req, res) => {
  const raw = await creerJetonRafraichissement(user, req);
  poserCookie(res, raw);
  return signerJetonAcces(user);
};

module.exports = {
  COOKIE_NAME,
  signerJetonAcces, verifierJetonAcces,
  ouvrirSession, rafraichir, revoquer, revoquerTout, nettoyer,
  poserCookie, effacerCookie, lireCookie,
};
