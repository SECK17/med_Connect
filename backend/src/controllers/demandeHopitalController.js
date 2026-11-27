// controllers/demandeHopitalController.js
// Demandes de changement d'hôpital des médecins.
// Les contrôles d'accès (authentification, rôle, droits sur le dossier), la validation
// des données et la traçabilité sont faits par les middlewares déclarés dans
// routes/demandeHopitalRoutes.js, avant l'appel de ces fonctions.
const { paginatedFindAll } = require('../utils/pagination');
const { DemandeHopital, Medecin, User } = require('../models');

// POST /api/demandes-hopital
const creer = async (req, res) => {
  try {
    const { hopital_actuel, hopital_demande } = req.body;
    if (!hopital_demande) return res.status(400).json({ message: 'Hôpital demandé requis' });

    // Annuler toute demande en attente précédente
    await DemandeHopital.update(
      { statut: 'annulee' },
      { where: { medecin_id: req.user.id, statut: 'en_attente' } }
    );

    const demande = await DemandeHopital.create({
      medecin_id:      req.user.id,
      hopital_actuel:  hopital_actuel || null,
      hopital_demande,
      justificatif:    req.file ? req.file.filename : null,
    });

    res.status(201).json(demande);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// GET /api/demandes-hopital/moi
const maDemande = async (req, res) => {
  try {
    const demande = await DemandeHopital.findOne({
      where:  { medecin_id: req.user.id, statut: 'en_attente' },
      order:  [['created_at', 'DESC']],
    });
    res.json(demande);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /api/demandes-hopital/moi
const annulerMaDemande = async (req, res) => {
  try {
    await DemandeHopital.update(
      { statut: 'annulee' },
      { where: { medecin_id: req.user.id, statut: 'en_attente' } }
    );
    res.json({ message: 'Demande annulée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/demandes-hopital
const lister = async (req, res) => {
  try {
    const where = {};
    if (req.query.statut) where.statut = req.query.statut;

    const demandes = await paginatedFindAll(req, res, DemandeHopital, {
      where,
      include: [{
        model: User, as: 'medecin',
        attributes: ['id', 'nom', 'email', 'telephone'],
      }],
      order: [['created_at', 'DESC']],
    });
    res.json(demandes);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// PUT /api/demandes-hopital/:id/valider
const validerDemande = async (req, res) => {
  try {
    const demande = await DemandeHopital.findByPk(req.params.id);
    if (!demande) return res.status(404).json({ message: 'Demande non trouvée' });
    if (demande.statut !== 'en_attente') return res.status(400).json({ message: 'Demande déjà traitée' });

    await Medecin.update(
      { hopital: demande.hopital_demande },
      { where: { id: demande.medecin_id } }
    );

    await demande.update({ statut: 'validee' });
    res.json({ message: 'Demande validée — hôpital mis à jour', demande });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// PUT /api/demandes-hopital/:id/rejeter
const rejeterDemande = async (req, res) => {
  try {
    const { motif } = req.body;
    const demande = await DemandeHopital.findByPk(req.params.id);
    if (!demande) return res.status(404).json({ message: 'Demande non trouvée' });
    if (demande.statut !== 'en_attente') return res.status(400).json({ message: 'Demande déjà traitée' });

    await demande.update({ statut: 'rejetee', motif_rejet: motif || null });
    res.json({ message: 'Demande rejetée', demande });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

module.exports = {
  creer,
  maDemande,
  annulerMaDemande,
  lister,
  validerDemande,
  rejeterDemande,
};
