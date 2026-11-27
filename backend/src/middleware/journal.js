// middleware/journal.js
// Traçabilité des accès aux dossiers médicaux.
//
//   router.get('/patient/:id', authenticate, journaliser('ordonnances', 'lecture'), exigerAccesPatient('id'), ...)
//
// Le middleware se place APRÈS authenticate et AVANT les contrôles d'accès, pour
// enregistrer aussi les tentatives refusées (403). L'écriture se fait à la fin de la
// réponse (événement « finish ») et n'en retarde ni n'en fait jamais échouer l'envoi.
//
// Le patient concerné est déterminé, dans l'ordre, par :
//   res.locals.journal.patientId (posé par la route, ex. suppression d'un document),
//   req.params[param], req.body.patient_id.
// Les lectures qu'un patient fait de son propre dossier ne sont pas enregistrées (bruit).
const JournalAcces = require('../models/JournalAcces');

const entier = (v) => {
  const n = parseInt(v, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const tronquer = (s, n) => (s == null ? null : String(s).slice(0, n));

/** Codes HTTP enregistrés : les succès et les refus d'accès. */
const aJournaliser = (statut) => (statut >= 200 && statut < 300) || statut === 403;

const ecrire = (entree) =>
  JournalAcces.create(entree).catch((err) => {
    // Le journal ne doit jamais bloquer l'application, mais une panne doit se voir.
    console.error("[journal] écriture impossible :", err.message);
  });

const journaliser = (ressource, action, { param = 'id' } = {}) => (req, res, next) => {
  // Les créations : on récupère l'id de la ressource créée dans la réponse JSON
  const jsonOrigine = res.json.bind(res);
  res.json = (corps) => {
    if (corps && typeof corps === 'object' && !Array.isArray(corps) && corps.id != null) {
      res.locals.journalCorpsId = corps.id;
    }
    return jsonOrigine(corps);
  };

  res.on('finish', () => {
    if (!req.user || !aJournaliser(res.statusCode)) return;
    const info = res.locals.journal || {};
    const patientId = entier(info.patientId) ?? entier(req.params?.[param]) ?? entier(req.body?.patient_id);
    const autorise = res.statusCode !== 403;

    // Un patient qui consulte son propre dossier : rien à tracer
    if ((action === 'lecture' || action === 'telechargement') && autorise && patientId === req.user.id) return;

    ecrire({
      acteur_id: req.user.id,
      acteur_nom: tronquer(req.user.nom, 100),
      acteur_role: req.user.role,
      patient_id: patientId,
      action,
      ressource,
      ressource_id: entier(info.ressourceId) ?? (action === 'creation' ? entier(res.locals.journalCorpsId) : null),
      details: tronquer(info.details, 255),
      autorise,
      statut_http: res.statusCode,
      methode: req.method,
      chemin: tronquer(req.originalUrl.split('?')[0], 255),
      ip: tronquer(req.ip, 64),
      user_agent: tronquer(req.get('user-agent'), 255),
    });
  });
  next();
};

/**
 * Suppression des entrées plus anciennes que JOURNAL_RETENTION_JOURS.
 * Désactivé par défaut (conservation illimitée) : la durée légale dépend du pays.
 */
const purgerJournal = async () => {
  const jours = parseInt(process.env.JOURNAL_RETENTION_JOURS, 10);
  if (!jours || jours <= 0) return 0;
  const limite = new Date(Date.now() - jours * 24 * 3600 * 1000);
  const { sequelize } = JournalAcces;
  const [, meta] = await sequelize.query(
    'DELETE FROM journal_acces WHERE created_at < :limite',
    { replacements: { limite } },
  );
  return meta?.rowCount ?? 0;
};

module.exports = { journaliser, purgerJournal };
