// middleware/access.js
// Règles d'accès aux données médicales, partagées par toutes les routes.
const fs = require('fs');
const DossierPartage = require('../models/DossierPartage');
const RendezVous = require('../models/RendezVous');
const AdminHopital = require('../models/AdminHopital');
const Medecin = require('../models/Medecin');
const AlerteSang = require('../models/AlerteSang');

/**
 * Un médecin a accès au dossier d'un patient si le patient lui a partagé
 * son dossier, ou s'ils ont (eu) un rendez-vous ensemble.
 */
const medecinSuitPatient = async (medecinId, patientId) => {
  const [partage, rdv] = await Promise.all([
    DossierPartage.findOne({ where: { patient_id: patientId, medecin_id: medecinId }, attributes: ['id'] }),
    RendezVous.findOne({ where: { patient_id: patientId, medecin_id: medecinId }, attributes: ['id'] }),
  ]);
  return !!(partage || rdv);
};

/**
 * Qui peut voir les données du patient `patientId` ?
 *  - admin : oui
 *  - le patient (ou donneur) lui-même : oui
 *  - un médecin qui suit ce patient : oui
 *  - tous les autres : non
 */
const peutVoirPatient = async (user, patientId) => {
  if (!user || !patientId) return false;
  if (user.role === 'admin') return true;
  if (user.id === patientId) return true;
  if (user.role === 'medecin') return medecinSuitPatient(user.id, patientId);
  return false;
};

/** Middleware : refuse si l'utilisateur ne peut pas voir le patient de req.params[param]. */
const exigerAccesPatient = (param = 'id') => async (req, res, next) => {
  try {
    const patientId = parseInt(req.params[param], 10);
    if (!patientId) return res.status(400).json({ message: 'Identifiant patient invalide.' });
    if (!(await peutVoirPatient(req.user, patientId))) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

/** Middleware : seul l'utilisateur concerné (req.params[param]) ou un admin passe. */
const exigerSoiMemeOuAdmin = (param = 'id') => (req, res, next) => {
  const id = parseInt(req.params[param], 10);
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' });
  if (req.user.role !== 'admin' && req.user.id !== id) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }
  next();
};

/**
 * Middleware pour les créations (ordonnance, analyse, consultation) :
 * le médecin connecté doit suivre le patient indiqué dans req.body.patient_id.
 * À placer APRÈS multer pour les uploads (req.body n'existe qu'ensuite) ;
 * en cas de refus, le fichier déjà reçu est supprimé.
 */
const exigerMedecinSuitPatientBody = async (req, res, next) => {
  const refuser = (status, message) => {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    return res.status(status).json({ message });
  };
  try {
    const patientId = parseInt(req.body?.patient_id, 10);
    if (!patientId) return refuser(400, 'patient_id requis.');
    if (!(await medecinSuitPatient(req.user.id, patientId))) {
      return refuser(403, "Vous ne suivez pas ce patient (aucun rendez-vous ni dossier partagé).");
    }
    next();
  } catch (err) {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    next(err);
  }
};

// ── Admin hôpital : cloisonnement par établissement ─────────

/** Profil AdminHopital de l'utilisateur connecté (ou null). */
const profilAdminHopital = (userId) => AdminHopital.findOne({ where: { user_id: userId } });

/** true si le médecin `medecinId` exerce dans l'hôpital `hopitalNom`. */
const medecinDansHopital = async (medecinId, hopitalNom) => {
  if (!medecinId || !hopitalNom) return false;
  const m = await Medecin.findByPk(medecinId, { attributes: ['id', 'hopital'] });
  return !!m && m.hopital === hopitalNom;
};

/**
 * Middleware pour /api/alertes-sang/:id (modifier, supprimer, voir les répondants) :
 * un admin hôpital n'agit que sur les alertes de SON hôpital. Le super admin passe.
 * L'alerte trouvée est placée dans req.alerte.
 */
const exigerAlerteDeMonHopital = async (req, res, next) => {
  try {
    const alerte = await AlerteSang.findByPk(req.params.id);
    if (!alerte) return res.status(404).json({ message: 'Alerte introuvable.' });

    if (req.user.role === 'admin_hopital') {
      const profil = await profilAdminHopital(req.user.id);
      if (!profil) return res.status(403).json({ message: 'Profil admin hôpital introuvable.' });
      if (alerte.hopital_id !== profil.hopital_id) {
        return res.status(403).json({ message: "Cette alerte n'appartient pas à votre hôpital." });
      }
    }
    req.alerte = alerte;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  peutVoirPatient, medecinSuitPatient,
  exigerAccesPatient, exigerSoiMemeOuAdmin, exigerMedecinSuitPatientBody,
  profilAdminHopital, medecinDansHopital, exigerAlerteDeMonHopital,
};
