const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticate, authorize } = require('../middleware/authenticate');
const Hopital  = require('../models/Hopital');
const Medecin  = require('../models/Medecin');
const Patient  = require('../models/Patient');
const User     = require('../models/User');
const RendezVous = require('../models/RendezVous');

// GET /api/hopitaux — liste de tous les hôpitaux
router.get('/', async (req, res) => {
  try {
    const hopitaux = await Hopital.findAll({ order: [['nom', 'ASC']] });
    res.json(hopitaux);
  } catch (err) {
    console.error('Erreur récupération hôpitaux:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/hopitaux/rdv-stats-all — stats RDV pour tous les hôpitaux (admin)
router.get('/rdv-stats-all', authenticate, authorize('admin'), async (req, res) => {
  try {
    const hopitaux    = await Hopital.findAll({ attributes: ['id', 'nom'] });
    const allMedecins = await Medecin.findAll({ attributes: ['id', 'hopital'] });

    const medByHop = {};
    allMedecins.forEach(m => {
      if (!medByHop[m.hopital]) medByHop[m.hopital] = [];
      medByHop[m.hopital].push(m.id);
    });

    const results = await Promise.all(hopitaux.map(async h => {
      const ids = medByHop[h.nom] || [];
      if (ids.length === 0) return { hopital_id: h.id, total: 0, confirme: 0, en_attente: 0, annule: 0 };
      const [total, confirme, en_attente, annule] = await Promise.all([
        RendezVous.count({ where: { medecin_id: { [Op.in]: ids } } }),
        RendezVous.count({ where: { medecin_id: { [Op.in]: ids }, statut: 'confirme' } }),
        RendezVous.count({ where: { medecin_id: { [Op.in]: ids }, statut: 'en_attente' } }),
        RendezVous.count({ where: { medecin_id: { [Op.in]: ids }, statut: 'annule' } }),
      ]);
      return { hopital_id: h.id, total, confirme, en_attente, annule };
    }));

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/hopitaux/:id — détail d'un hôpital
router.get('/:id', async (req, res) => {
  try {
    const hopital = await Hopital.findByPk(req.params.id);
    if (!hopital) return res.status(404).json({ message: 'Hôpital introuvable.' });
    res.json(hopital);
  } catch (err) {
    console.error('Erreur récupération hôpital:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/hopitaux/:id/medecins — médecins inscrits dans cet hôpital (admin)
router.get('/:id/medecins', authenticate, authorize('admin'), async (req, res) => {
  try {
    const hopital = await Hopital.findByPk(req.params.id);
    if (!hopital) return res.status(404).json({ message: 'Hôpital introuvable.' });

    const medecins = await Medecin.findAll({
      where: { hopital: hopital.nom },
      include: [{ model: User, as: 'user', attributes: ['id', 'nom', 'email', 'telephone'] }],
    });

    res.json(medecins.map(m => ({
      id: m.id,
      nom: m.user?.nom || '—',
      email: m.user?.email || '—',
      telephone: m.user?.telephone || '—',
      specialite: m.specialite || '—',
      valide: m.valide,
      disponible: m.disponible,
    })));
  } catch (err) {
    console.error('Erreur médecins hôpital:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/hopitaux/:id/patients — patients ayant eu un RDV dans cet hôpital (admin)
router.get('/:id/patients', authenticate, authorize('admin'), async (req, res) => {
  try {
    const hopital = await Hopital.findByPk(req.params.id);
    if (!hopital) return res.status(404).json({ message: 'Hôpital introuvable.' });

    // 1. Médecins de cet hôpital
    const medecins = await Medecin.findAll({ where: { hopital: hopital.nom }, attributes: ['id'] });
    const medecinIds = medecins.map(m => m.id);

    if (medecinIds.length === 0) return res.json([]);

    // 2. RDV avec ces médecins → patient_ids uniques
    const rdvs = await RendezVous.findAll({
      where: { medecin_id: { [Op.in]: medecinIds } },
      attributes: ['patient_id'],
    });
    const patientIds = [...new Set(rdvs.map(r => r.patient_id))];

    if (patientIds.length === 0) return res.json([]);

    // 3. Patients avec leur user
    const patients = await Patient.findAll({
      where: { id: { [Op.in]: patientIds } },
      include: [{ model: User, as: 'user', attributes: ['id', 'nom', 'email', 'telephone'] }],
    });

    res.json(patients.map(p => ({
      id: p.id,
      nom: p.user?.nom || '—',
      email: p.user?.email || '—',
      telephone: p.user?.telephone || '—',
      groupeSanguin: p.groupeSanguin || '—',
    })));
  } catch (err) {
    console.error('Erreur patients hôpital:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/hopitaux/:id/rdv-stats — stats RDV pour un hôpital (admin)
router.get('/:id/rdv-stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const hopital = await Hopital.findByPk(req.params.id);
    if (!hopital) return res.status(404).json({ message: 'Hôpital introuvable.' });

    const medecins = await Medecin.findAll({ where: { hopital: hopital.nom }, attributes: ['id'] });
    const medecinIds = medecins.map(m => m.id);

    if (medecinIds.length === 0) return res.json({ total: 0, en_attente: 0, transfere: 0, confirme: 0, annule: 0 });

    const [total, en_attente, transfere, confirme, annule] = await Promise.all([
      RendezVous.count({ where: { medecin_id: { [Op.in]: medecinIds } } }),
      RendezVous.count({ where: { medecin_id: { [Op.in]: medecinIds }, statut: 'en_attente' } }),
      RendezVous.count({ where: { medecin_id: { [Op.in]: medecinIds }, statut: 'transfere' } }),
      RendezVous.count({ where: { medecin_id: { [Op.in]: medecinIds }, statut: 'confirme' } }),
      RendezVous.count({ where: { medecin_id: { [Op.in]: medecinIds }, statut: 'annule' } }),
    ]);

    res.json({ total, en_attente, transfere, confirme, annule });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/hopitaux — créer un hôpital (admin)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { nom, type, ville, telephone, adresse } = req.body;
    if (!nom || !ville) return res.status(400).json({ message: 'Nom et ville requis.' });
    const hop = await Hopital.create({ nom, type: type || 'Hôpital', ville, telephone, adresse });
    res.status(201).json(hop);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// PUT /api/hopitaux/:id — modifier un hôpital (admin)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const hop = await Hopital.findByPk(req.params.id);
    if (!hop) return res.status(404).json({ message: 'Hôpital introuvable.' });
    const { nom, type, ville, telephone, adresse } = req.body;
    await hop.update({ nom, type, ville, telephone, adresse });
    res.json(hop);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// DELETE /api/hopitaux/:id — supprimer un hôpital (admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const hop = await Hopital.findByPk(req.params.id);
    if (!hop) return res.status(404).json({ message: 'Hôpital introuvable.' });

    const nbMedecins = await Medecin.count({ where: { hopital: hop.nom } });
    if (nbMedecins > 0) {
      return res.status(400).json({
        message: `Impossible de supprimer : ${nbMedecins} médecin(s) sont rattachés à cet hôpital.`,
      });
    }

    await hop.destroy();
    res.json({ message: 'Hôpital supprimé.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

module.exports = router;
