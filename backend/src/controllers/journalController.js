// controllers/journalController.js
// Consultation du journal d'accès aux dossiers médicaux.
// Les contrôles d'accès (authentification, rôle, droits sur le dossier), la validation
// des données et la traçabilité sont faits par les middlewares déclarés dans
// routes/journalRoutes.js, avant l'appel de ces fonctions.
const { Op } = require('sequelize');
const { paginatedFindAll } = require('../utils/pagination');
const JournalAcces = require('../models/JournalAcces');

// Le patient voit qui, quand, quoi — mais pas l'IP ni le navigateur des soignants
const CHAMPS_PATIENT = [
  'id', 'acteur_id', 'acteur_nom', 'acteur_role', 'action', 'ressource',
  'ressource_id', 'details', 'autorise', 'created_at',
];

// Par défaut, une page de 50 entrées plutôt que tout l'historique
const avecLimiteParDefaut = (req) => {
  if (req.query.page === undefined && req.query.limit === undefined) {
    Object.defineProperty(req, 'query', { value: { ...req.query, limit: 50 }, writable: true, configurable: true });
  }
};

// GET /api/journal/patient/:patientId
const journalPatient = async (req, res, next) => {
    try {
      avecLimiteParDefaut(req);
      const entrees = await paginatedFindAll(req, res, JournalAcces, {
        where: { patient_id: req.params.patientId },
        attributes: req.user.role === 'admin' ? undefined : CHAMPS_PATIENT,
        order: [['created_at', 'DESC'], ['id', 'DESC']],
      });
      res.json(entrees);
    } catch (err) {
      next(err);
    }
  };

// GET /api/journal
const journalGlobal = async (req, res, next) => {
  try {
    const { patient_id, acteur_id, action, ressource, autorise, du, au } = req.query;
    const where = {};
    if (patient_id) where.patient_id = patient_id;
    if (acteur_id) where.acteur_id = acteur_id;
    if (action) where.action = action;
    if (ressource) where.ressource = ressource;
    if (autorise !== undefined) where.autorise = autorise;
    if (du || au) {
      where.created_at = {};
      if (du) where.created_at[Op.gte] = new Date(`${du}T00:00:00`);
      if (au) where.created_at[Op.lt] = new Date(new Date(`${au}T00:00:00`).getTime() + 24 * 3600 * 1000);
    }
    avecLimiteParDefaut(req);
    const entrees = await paginatedFindAll(req, res, JournalAcces, {
      where,
      order: [['created_at', 'DESC'], ['id', 'DESC']],
    });
    res.json(entrees);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  journalPatient,
  journalGlobal,
};
