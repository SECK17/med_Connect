// validation/schemas.js — schémas des données acceptées par chaque route d'écriture.
// Les champs non listés sont ignorés (supprimés de req.body).
const {
  z, texte, requis, facultatif, effacable, id, email, motDePasse, telephone,
  date, heure, groupeSanguin, booleen, nombre, facultatifNb, versVide,
} = require('./index');

const objet = (forme) => z.object(forme);
const jeton = z.string({ error: 'Lien invalide.' }).min(1, { error: 'Lien invalide.' }).max(2000, { error: 'Lien invalide.' });

// ── Authentification ─────────────────────────────────────────
const auth = {
  register: objet({
    nom: requis(100, 'Le nom'),
    email,
    password: motDePasse,
    telephone,
    role: z.enum(['patient', 'donneur', 'medecin'], { error: 'Rôle non autorisé pour l\'inscription.' }),
    dateNaissance: z.preprocess(versVide, date('La date de naissance').optional()),
    adresse: facultatif(200, "L'adresse"),
    groupeSanguin: z.preprocess(versVide, groupeSanguin.optional()),
    specialite: facultatif(100, 'La spécialité'),
    numeroOrdre: facultatif(50, "Le numéro d'ordre"),
    hopital: facultatif(200, "L'hôpital"),
  }),
  // Pas de minimum de longueur à la connexion : d'anciens comptes peuvent avoir un mot de passe court
  login: objet({
    email,
    password: z.string({ error: 'Mot de passe obligatoire.' }).min(1, { error: 'Mot de passe obligatoire.' }).max(128),
  }),
  email: objet({ email }),
  jeton: objet({ token: jeton }),
  reset: objet({ token: jeton, password: motDePasse }),
  premierAdmin: objet({
    nom: requis(100, 'Le nom'), email, password: motDePasse, telephone,
    adminCode: z.string({ error: 'Code administrateur requis.' }).min(1).max(200),
  }),
  admin: objet({ nom: requis(100, 'Le nom'), email, password: motDePasse, telephone }),
};

// ── Rendez-vous ──────────────────────────────────────────────
const STATUTS_RDV = ['en_attente', 'confirme', 'annule', 'transfere'];
const rendezvous = {
  creer: objet({
    patientId: z.preprocess(versVide, id('Patient').optional()), // ignoré : le patient est l'utilisateur connecté
    medecinId: id('Médecin'),
    date: date('La date du rendez-vous'),
    heure: heure("L'heure du rendez-vous"),
    motif: requis(500, 'Le motif'),
  }),
  modifier: objet({
    statut: z.enum(STATUTS_RDV, { error: 'Statut de rendez-vous invalide.' }).optional(),
    date_rdv: date('La date du rendez-vous').optional(),
    heure: heure("L'heure du rendez-vous").optional(),
    medecin_id: z.preprocess(versVide, id('Médecin').optional()),
  }),
  statutAdminHopital: objet({ statut: z.literal('annule', { error: 'Action non autorisée. Utilisez /transferer pour transmettre au médecin.' }) }),
};

// ── Dossier médical ──────────────────────────────────────────
const listeTextes = (nom) => z.array(texte(200, nom), { error: `${nom} : liste attendue.` })
  .max(50, { error: `${nom} : 50 éléments maximum.` });

const patient = {
  modifier: objet({
    dateNaissance: z.preprocess(versNullDate, date('La date de naissance').nullable().optional()),
    adresse: effacable(200, "L'adresse"),
    groupeSanguin: z.preprocess(versVide, groupeSanguin.optional()),
    telephone: z.preprocess(versVide, telephone.optional()), // le formulaire envoie '' si non renseigné
    allergies: listeTextes('Allergies').optional(),
    antecedents: listeTextes('Antécédents').optional(),
    traitements: listeTextes('Traitements').optional(),
    vaccinations: listeTextes('Vaccinations').optional(),
  }),
};
function versNullDate(v) { return v === '' ? null : v; }

const medicament = objet({
  nom: requis(200, 'Le nom du médicament'),
  dosage: facultatif(200, 'Le dosage'),
  duree: facultatif(200, 'La durée'),
  frequence: facultatif(200, 'La fréquence'),
});

const ordonnance = {
  creer: objet({
    patient_id: id('Patient'),
    medicaments: z.array(medicament, { error: 'Liste de médicaments attendue.' })
      .min(1, { error: 'Ajoutez au moins un médicament.' })
      .max(50, { error: '50 médicaments maximum.' }),
    notes: effacable(5000, 'Les notes'),
    date: z.preprocess(versVide, date().optional()),
  }),
  // Upload (multipart) : tous les champs arrivent en texte
  upload: objet({ patient_id: id('Patient'), notes: effacable(5000, 'Les notes') }),
};

const consultation = {
  creer: objet({
    patient_id: id('Patient'),
    rdv_id: z.preprocess(versVide, id('Rendez-vous').optional()),
    date: z.preprocess(versVide, date().optional()),
    hopital: facultatif(255, "L'hôpital"),
    motif: facultatif(255, 'Le motif'),
    diagnostic: facultatif(255, 'Le diagnostic'),
    traitement: facultatif(5000, 'Le traitement'),
    notes: facultatif(5000, 'Les notes'),
  }),
};

const partage = { creer: objet({ medecin_id: id('Médecin') }) };

const evaluation = {
  creer: objet({
    medecin_id: id('Médecin'),
    rdv_id: z.preprocess(versVide, id('Rendez-vous').optional()),
    note: z.coerce.number({ error: 'La note doit être un nombre.' })
      .int({ error: 'La note doit être un entier.' })
      .min(1, { error: 'La note doit être comprise entre 1 et 5.' })
      .max(5, { error: 'La note doit être comprise entre 1 et 5.' }),
    commentaire: facultatif(1000, 'Le commentaire'),
  }),
};

// ── Médecins ─────────────────────────────────────────────────
const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const creneau = objet({
  actif: z.boolean({ error: 'Disponibilité : « actif » doit valoir vrai ou faux.' }),
  debut: heure('Heure de début'),
  fin: heure('Heure de fin'),
});

const medecin = {
  modifier: objet({
    nom: facultatif(100, 'Le nom'),
    telephone: z.preprocess(versVide, telephone.optional()),
    specialite: facultatif(100, 'La spécialité'),
    // Le profil envoie l'année de début de pratique (stockée dans « experience »)
    experience: facultatifNb(0, 2100, "L'expérience"),
    disponible: booleen('La disponibilité').optional(),
    tarif: z.preprocess(v => (typeof v === 'number' ? String(v) : versVide(v)), facultatif(50, 'Le tarif')),
    hopital: facultatif(200, "L'hôpital"),
    numeroOrdre: facultatif(50, "Le numéro d'ordre"),
    numLicence: facultatif(50, 'Le numéro de licence'),
    disponibilites: z.partialRecord(z.enum(JOURS, { error: 'Jour invalide.' }), creneau).nullable().optional(),
  }),
};

const demandeHopital = {
  creer: objet({
    hopital_actuel: facultatif(200, "L'hôpital actuel"),
    hopital_demande: requis(200, "L'hôpital demandé"),
  }),
  rejeter: objet({ motif: facultatif(1000, 'Le motif') }),
};

// ── Hôpitaux ─────────────────────────────────────────────────
const hopital = {
  enregistrer: objet({
    nom: requis(200, 'Le nom'),
    type: z.enum(['Hôpital', 'Clinique', 'CHU', 'Centre'], { error: "Type d'établissement invalide." }).optional(),
    ville: facultatif(100, 'La ville'),
    telephone: z.preprocess(versVide, telephone.optional()),
    adresse: facultatif(500, "L'adresse"),
  }),
  creerAdmin: objet({
    nom: requis(100, 'Le nom'), email, password: motDePasse,
    telephone: z.preprocess(versVide, telephone.optional()),
    hopital_id: id('Hôpital'),
  }),
};

// ── Don de sang ──────────────────────────────────────────────
const latitude = facultatifNb(-90, 90, 'La latitude');
const longitude = facultatifNb(-180, 180, 'La longitude');

const alerte = {
  creer: objet({
    groupe_sang: groupeSanguin,
    quantite: z.preprocess(v => (typeof v === 'number' ? String(v) : versVide(v)), facultatif(50, 'La quantité')),
    message: facultatif(1000, 'Le message'),
    urgence: z.enum(['Faible', 'Moyen', 'Urgent', 'Critique'], { error: "Niveau d'urgence invalide." }).optional(),
    latitude, longitude,
    rayon_km: facultatifNb(1, 1000, 'Le rayon'),
    duree_heures: facultatifNb(1, 24 * 30, 'La durée'),
  }),
  statut: objet({ statut: z.enum(['active', 'terminee', 'annulee'], { error: "Statut d'alerte invalide." }) }),
};

const donneur = {
  inscription: objet({ groupe: groupeSanguin, ville: facultatif(100, 'La ville') }),
  localisation: objet({
    latitude: nombre(-90, 90, 'La latitude'),
    longitude: nombre(-180, 180, 'La longitude'),
  }),
};

const push = {
  abonner: objet({
    endpoint: z.url({ error: 'Abonnement invalide.' }).max(2000),
    keys: objet({ p256dh: requis(500, 'La clé p256dh'), auth: requis(500, 'La clé auth') }),
  }),
};

// ── Journal d'accès ──────────────────────────────────────────
const pagination = {
  page: z.preprocess(versVide, z.coerce.number().int().min(1).optional()),
  limit: z.preprocess(versVide, z.coerce.number().int().min(1).max(100).optional()),
};
const journal = {
  patient: objet({ ...pagination }),
  filtres: objet({
    ...pagination,
    patient_id: z.preprocess(versVide, id('Patient').optional()),
    acteur_id: z.preprocess(versVide, id('Acteur').optional()),
    action: z.preprocess(versVide, z.enum(['lecture', 'creation', 'modification', 'suppression', 'telechargement'], { error: 'Action invalide.' }).optional()),
    ressource: z.preprocess(versVide, z.enum(['profil', 'rendezvous', 'ordonnances', 'analyses', 'consultations', 'partages', 'fichier'], { error: 'Ressource invalide.' }).optional()),
    autorise: z.preprocess(versVide, booleen('Le filtre « autorisé »').optional()),
    du: z.preprocess(versVide, date('La date de début').optional()),
    au: z.preprocess(versVide, date('La date de fin').optional()),
  }),
};

module.exports = {
  journal,
  auth, rendezvous, patient, ordonnance, consultation, partage, evaluation,
  medecin, demandeHopital, hopital, alerte, donneur, push, STATUTS_RDV,
};
