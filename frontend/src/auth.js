// auth.js — gestion de la session côté navigateur
//
// Le serveur délivre :
//  - un jeton d'accès court (15 min), gardé dans sessionStorage("token") et envoyé
//    dans l'en-tête Authorization par les appels fetch existants ;
//  - un cookie httpOnly de rafraîchissement (7 jours), invisible pour le JavaScript.
//
// Ce module, installé une fois au démarrage (main.jsx) :
//  1. intercepte fetch : si l'API répond 401, il renouvelle la session puis rejoue la requête ;
//  2. renouvelle le jeton peu avant son expiration (liens de fichiers, socket du chat) ;
//  3. au chargement d'un onglet sans jeton, tente de reprendre la session via le cookie ;
//  4. fournit deconnexion() qui révoque la session côté serveur.
import { API_URL } from "./config.js";

const fetchOriginal = window.fetch.bind(window);

// Routes publiques : pas de rafraîchissement automatique sur un 401
const SANS_RAFRAICHISSEMENT = [
  "/api/auth/login", "/api/auth/register", "/api/auth/refresh", "/api/auth/logout",
  "/api/auth/verify-email", "/api/auth/resend-verification",
  "/api/auth/forgot-password", "/api/auth/reset-password", "/api/auth/create-first-admin",
];

const urlDe = (input) => (typeof input === "string" ? input : input instanceof URL ? input.href : input.url);

const lireEntete = (headers, nom) => {
  if (!headers) return null;
  if (headers instanceof Headers) return headers.get(nom);
  const cle = Object.keys(headers).find((k) => k.toLowerCase() === nom.toLowerCase());
  return cle ? headers[cle] : null;
};

const avecJeton = (headers, token) => {
  if (headers instanceof Headers) {
    const h = new Headers(headers);
    h.set("Authorization", `Bearer ${token}`);
    return h;
  }
  const h = { ...(headers || {}) };
  Object.keys(h).forEach((k) => { if (k.toLowerCase() === "authorization") delete h[k]; });
  h.Authorization = `Bearer ${token}`;
  return h;
};

/** Expiration (ms) d'un JWT, ou 0 si illisible. */
const expiration = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return (payload.exp || 0) * 1000;
  } catch {
    return 0;
  }
};

const enregistrer = ({ token, user }) => {
  sessionStorage.setItem("token", token);
  if (user) {
    sessionStorage.setItem("role",   user.role);
    sessionStorage.setItem("nom",    user.nom);
    sessionStorage.setItem("email",  user.email);
    sessionStorage.setItem("userId", user.id);
  }
};

const terminerSession = () => {
  sessionStorage.clear();
  if (!window.location.pathname.startsWith("/login")) window.location.assign("/login");
};

// Un seul rafraîchissement à la fois, même si plusieurs requêtes échouent en même temps
let enCours = null;

/** Renouvelle la session via le cookie. Renvoie le nouveau jeton, ou null. */
export const rafraichirSession = () => {
  if (!enCours) {
    enCours = fetchOriginal(`${API_URL}/api/auth/refresh`, { method: "POST", credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        enregistrer(data);
        return data.token;
      })
      .catch(() => null)
      .finally(() => { enCours = null; });
  }
  return enCours;
};

/** Déconnexion de cet appareil (révoque le cookie côté serveur) puis vide la session. */
export const deconnexion = async () => {
  try {
    await fetchOriginal(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
  } catch {
    /* hors ligne : on vide quand même la session locale */
  }
  sessionStorage.clear();
};

/** Déconnexion de tous les appareils. */
export const deconnexionPartout = async () => {
  const token = sessionStorage.getItem("token");
  try {
    await window.fetch(`${API_URL}/api/auth/logout-all`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    /* ignoré */
  }
  sessionStorage.clear();
};

/** Jeton d'accès actuel (à lire au moment de l'utiliser, il change toutes les ~15 min). */
export const jetonActuel = () => sessionStorage.getItem("token");

// ── 1. Interception de fetch ─────────────────────────────────
window.fetch = async (input, init = {}) => {
  const url = urlDe(input);
  if (!url.startsWith(API_URL)) return fetchOriginal(input, init);

  // credentials: "include" pour que le navigateur envoie / enregistre le cookie de session
  const options = { ...init, credentials: init.credentials ?? "include" };
  const res = await fetchOriginal(input, options);

  const chemin = url.slice(API_URL.length).split("?")[0];
  if (res.status !== 401 || SANS_RAFRAICHISSEMENT.includes(chemin) || !lireEntete(options.headers, "Authorization")) {
    return res;
  }

  const nouveau = await rafraichirSession();
  if (!nouveau) {
    terminerSession();
    return res;
  }
  return fetchOriginal(input, { ...options, headers: avecJeton(options.headers, nouveau) });
};

// ── 2. Renouvellement préventif ──────────────────────────────
setInterval(() => {
  const token = sessionStorage.getItem("token");
  if (token && expiration(token) - Date.now() < 2 * 60 * 1000) {
    rafraichirSession().then((t) => { if (!t) terminerSession(); });
  }
}, 30 * 1000);

// ── 3. Reprise de session au chargement ──────────────────────
/** À attendre avant le premier rendu : reprend la session si un cookie valide existe. */
export const initialiserSession = async () => {
  const token = sessionStorage.getItem("token");
  if (token && expiration(token) > Date.now() + 30 * 1000) return;
  await rafraichirSession(); // en cas d'échec : simplement non connecté
};
