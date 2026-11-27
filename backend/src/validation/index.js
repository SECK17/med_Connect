// validation/index.js
// Validation des données reçues (corps, paramètres d'URL, query) avec zod.
//
//   router.post('/', authenticate, valider({ body: schemaX }), handler)
//
// En cas d'erreur : 400 { message: "<premier problème>", erreurs: [{ champ, message }] }
// En cas de succès : req.body / req.params / req.query sont REMPLACÉS par les données
// validées et nettoyées (espaces retirés, nombres convertis, champs inconnus supprimés).
const fs = require('fs');
const { z } = require('zod');

z.config(z.locales.fr()); // messages par défaut en français

// ── Briques réutilisables ────────────────────────────────────

/** '' / null / undefined → undefined (champ absent). */
const versVide = (v) => (v === '' || v === null ? undefined : v);
/** '' → null (champ vidé volontairement). */
const versNull = (v) => (v === '' ? null : v);

const texte = (max, nom = 'Ce champ') =>
  z.string({ error: `${nom} doit être un texte.` })
    .trim()
    .max(max, { error: `${nom} ne doit pas dépasser ${max} caractères.` });

const requis = (max, nom) => texte(max, nom).min(1, { error: `${nom} est obligatoire.` });

/** Texte facultatif : '' ou null = absent. */
const facultatif = (max, nom) => z.preprocess(versVide, texte(max, nom).optional());

/** Texte qu'on peut vider explicitement : '' → null. */
const effacable = (max, nom) => z.preprocess(versNull, texte(max, nom).nullable().optional());

const id = (nom = 'Identifiant') =>
  z.coerce.number({ error: `${nom} invalide.` })
    .int({ error: `${nom} invalide.` })
    .positive({ error: `${nom} invalide.` });

const email = z.string({ error: 'Email obligatoire.' })
  .trim()
  .toLowerCase()
  .max(150, { error: "L'email ne doit pas dépasser 150 caractères." })
  .pipe(z.email({ error: 'Adresse email invalide.' }));

const motDePasse = z.string({ error: 'Mot de passe obligatoire.' })
  .min(8, { error: 'Le mot de passe doit contenir au moins 8 caractères.' })
  .max(128, { error: 'Le mot de passe ne doit pas dépasser 128 caractères.' });

const telephone = z.string({ error: 'Téléphone invalide.' })
  .trim()
  .min(6, { error: 'Numéro de téléphone trop court.' })
  .max(20, { error: 'Numéro de téléphone trop long.' })
  .regex(/^[0-9+().\s-]+$/, { error: 'Le téléphone ne doit contenir que des chiffres, espaces, + ( ) . -' });

const estDateValide = (s) => {
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
};
const date = (nom = 'La date') =>
  z.string({ error: `${nom} est invalide.` })
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: `${nom} doit être au format AAAA-MM-JJ.` })
    .refine(estDateValide, { error: `${nom} n'existe pas.` });

const heure = (nom = "L'heure") =>
  z.string({ error: `${nom} est invalide.` })
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, { error: `${nom} doit être au format HH:MM.` });

const GROUPES_SANGUINS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const groupeSanguin = z.enum(GROUPES_SANGUINS, { error: 'Groupe sanguin invalide.' });

const booleen = (nom) => z.union([
  z.boolean(),
  z.enum(['true', 'false']).transform(v => v === 'true'),
], { error: `${nom} doit valoir vrai ou faux.` });

const nombre = (min, max, nom) =>
  z.coerce.number({ error: `${nom} doit être un nombre.` })
    .min(min, { error: `${nom} doit être au moins ${min}.` })
    .max(max, { error: `${nom} ne doit pas dépasser ${max}.` });

const facultatifNb = (min, max, nom) => z.preprocess(versVide, nombre(min, max, nom).optional());

// ── Middleware ───────────────────────────────────────────────

const formaterErreurs = (issues, partie) =>
  issues.map(i => ({ champ: i.path.join('.') || partie, message: i.message }));

/**
 * valider({ body, params, query }) — chaque clé est un schéma zod.
 * Supprime le fichier uploadé (multer) si la validation échoue.
 */
const valider = (schemas) => (req, res, next) => {
  for (const partie of ['params', 'query', 'body']) {
    const schema = schemas[partie];
    if (!schema) continue;
    const resultat = schema.safeParse(req[partie] ?? {});
    if (!resultat.success) {
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      const erreurs = formaterErreurs(resultat.error.issues, partie);
      return res.status(400).json({ message: erreurs[0].message, erreurs });
    }
    // Express 5 : req.query est un getter, on le redéfinit explicitement
    Object.defineProperty(req, partie, { value: resultat.data, writable: true, configurable: true, enumerable: true });
  }
  next();
};

/** Paramètre d'URL numérique (:id, :patientId…) : 400 au lieu d'une erreur SQL 500. */
const verifierParamId = (req, res, next, valeur, nom) => {
  if (!/^[1-9]\d{0,9}$/.test(String(valeur))) {
    return res.status(400).json({ message: `Paramètre « ${nom} » invalide.` });
  }
  next();
};

module.exports = {
  z, valider, verifierParamId,
  texte, requis, facultatif, effacable, id, email, motDePasse, telephone,
  date, heure, groupeSanguin, GROUPES_SANGUINS, booleen, nombre, facultatifNb, versVide,
};
