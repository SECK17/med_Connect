// config/verifierSecrets.js
// Contrôle des secrets au démarrage. Un JWT_SECRET faible ou laissé à sa valeur d'exemple
// rend les jetons falsifiables ; un ADMIN_CODE d'exemple permet de créer le premier admin.
//   - JWT_SECRET absent : le serveur refuse toujours de démarrer.
//   - Secret trop court ou valeur d'exemple : refus en production (NODE_ENV=production),
//     simple avertissement en développement.

// Valeurs fournies dans .env.example et autres valeurs évidentes
const VALEURS_EXEMPLE = [
  /your_jwt_secret/i, /admin_secret_code/i, /_here$/i, /^change[-_ ]?me/i,
  /^secret$/i, /^password$/i, /^admin$/i,
];

const REGLES = [
  { nom: 'JWT_SECRET', obligatoire: true, longueurMin: 32 },
  { nom: 'ADMIN_CODE', obligatoire: false, longueurMin: 12 },
];

/** Renvoie { erreurs, avertissements } pour l'environnement donné (sans rien afficher). */
const analyserSecrets = (env = process.env) => {
  const production = env.NODE_ENV === 'production';
  const erreurs = [];
  const avertissements = [];

  for (const { nom, obligatoire, longueurMin } of REGLES) {
    const valeur = env[nom];
    if (!valeur) {
      if (obligatoire) erreurs.push(`${nom} n'est pas défini dans .env.`);
      continue;
    }
    const problemes = [];
    if (VALEURS_EXEMPLE.some((re) => re.test(valeur))) {
      problemes.push(`${nom} a encore sa valeur d'exemple`);
    } else if (valeur.length < longueurMin) {
      problemes.push(`${nom} est trop court (${valeur.length} caractères, au moins ${longueurMin})`);
    }
    (production ? erreurs : avertissements).push(...problemes);
  }
  return { erreurs, avertissements };
};

/** À appeler au démarrage : lève une erreur si un secret bloque, affiche les avertissements. */
const verifierSecrets = (env = process.env) => {
  const { erreurs, avertissements } = analyserSecrets(env);
  for (const a of avertissements) {
    console.warn(`⚠️  ${a}. Refusé en production. Générez une valeur : openssl rand -hex 32`);
  }
  if (erreurs.length) {
    throw new Error(`Secrets invalides :\n  - ${erreurs.join('\n  - ')}\n  Générez une valeur : openssl rand -hex 32`);
  }
};

module.exports = { analyserSecrets, verifierSecrets };
