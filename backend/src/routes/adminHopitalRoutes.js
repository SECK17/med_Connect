const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const { authenticate, authorize } = require('../middleware/authenticate');
const { Op } = require('sequelize');
const { sequelize, User, AdminHopital, Hopital, Patient, Medecin, RendezVous } = require('../models');

// ── Super admin : créer un admin hôpital ──────────────────────
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { nom, email, password, telephone, hopital_id } = req.body;
    if (!nom || !email || !password || !hopital_id) {
      await t.rollback();
      return res.status(400).json({ message: 'Champs requis : nom, email, password, hopital_id.' });
    }

    const hopital = await Hopital.findByPk(hopital_id, { transaction: t });
    if (!hopital) { await t.rollback(); return res.status(404).json({ message: 'Hôpital introuvable.' }); }

    let existing = await User.findOne({ where: { email }, transaction: t });
    if (existing) {
      // Orphelin : admin_hopital sans profil AdminHopital → on le supprime pour recréer proprement
      if (existing.role === 'admin_hopital') {
        const profil = await AdminHopital.findOne({ where: { user_id: existing.id }, transaction: t });
        if (!profil) {
          await existing.destroy({ transaction: t });
          existing = null;
        }
      }
      if (existing) {
        await t.rollback();
        return res.status(409).json({ message: 'Email déjà utilisé.' });
      }
    }

    const user = await User.create(
      { nom, email, password, telephone: telephone || '—', role: 'admin_hopital' },
      { transaction: t }
    );

    await AdminHopital.create(
      { user_id: user.id, hopital_id, hopital_nom: hopital.nom },
      { transaction: t }
    );

    await t.commit();
    res.status(201).json({ message: 'Admin hôpital créé.', userId: user.id, hopital: hopital.nom });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.', detail: err.message });
  }
});

// ── Super admin : liste des admins hôpitaux ───────────────────
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const admins = await AdminHopital.findAll({
      include: [
        { model: User,    as: 'user',    attributes: ['id','nom','email','telephone'] },
        { model: Hopital, as: 'hopital', attributes: ['id','nom','ville','type'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ── Admin hôpital : ses infos ─────────────────────────────────
router.get('/me', authenticate, authorize('admin_hopital'), async (req, res) => {
  try {
    const profil = await AdminHopital.findOne({
      where: { user_id: req.user.id },
      include: [{ model: Hopital, as: 'hopital' }],
    });
    if (!profil) return res.status(404).json({ message: 'Profil admin introuvable.' });
    res.json(profil);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ── Admin hôpital : voir les donneurs (filtrables par groupe) ─
router.get('/donneurs', authenticate, authorize('admin_hopital', 'admin'), async (req, res) => {
  try {
    const { groupe } = req.query;

    const donneurs = await User.findAll({
      where: { role: 'donneur' },
      include: [{ model: Patient, as: 'profil_patient', attributes: ['groupeSanguin','dateNaissance','adresse'] }],
      attributes: ['id','nom','email','telephone'],
    });

    let list = donneurs.map(u => ({
      id:      u.id,
      nom:     u.nom,
      email:   u.email,
      telephone: u.telephone,
      groupe:  u.profil_patient?.groupeSanguin || null,
      adresse: u.profil_patient?.adresse || '—',
    }));

    if (groupe) list = list.filter(d => d.groupe === groupe);

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ── Admin hôpital : médecins de son hôpital ──────────────────
router.get('/medecins', authenticate, authorize('admin_hopital'), async (req, res) => {
  try {
    const profil = await AdminHopital.findOne({ where: { user_id: req.user.id } });
    if (!profil) return res.status(403).json({ message: 'Profil admin introuvable.' });

    const medecins = await Medecin.findAll({
      where: { hopital: profil.hopital_nom },
      include: [{ model: User, as: 'user', attributes: ['id', 'nom', 'email', 'telephone'] }],
    });

    res.json(medecins.map(m => ({
      id:        m.id,
      nom:       m.user?.nom       || '—',
      email:     m.user?.email     || '—',
      telephone: m.user?.telephone || '—',
      specialite: m.specialite     || '—',
      valide:    m.valide,
      disponible: m.disponible,
    })));
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// ── Secrétaire : valider un médecin de l'hôpital ─────────────
router.put('/medecins/:id/valider', authenticate, authorize('admin_hopital'), async (req, res) => {
  try {
    const profil = await AdminHopital.findOne({ where: { user_id: req.user.id } });
    const medecin = await Medecin.findOne({ where: { id: req.params.id, hopital: profil.hopital_nom } });
    if (!medecin) return res.status(404).json({ message: 'Médecin introuvable dans votre hôpital.' });
    await medecin.update({ valide: true });
    res.json({ message: 'Médecin validé.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ── Secrétaire : rejeter un médecin de l'hôpital ─────────────
router.put('/medecins/:id/rejeter', authenticate, authorize('admin_hopital'), async (req, res) => {
  try {
    const profil = await AdminHopital.findOne({ where: { user_id: req.user.id } });
    const medecin = await Medecin.findOne({ where: { id: req.params.id, hopital: profil.hopital_nom } });
    if (!medecin) return res.status(404).json({ message: 'Médecin introuvable dans votre hôpital.' });
    await medecin.update({ valide: false });
    res.json({ message: 'Médecin rejeté.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ── Secrétaire : rendez-vous de l'hôpital ────────────────────
router.get('/rendez-vous', authenticate, authorize('admin_hopital'), async (req, res) => {
  try {
    const profil = await AdminHopital.findOne({ where: { user_id: req.user.id } });
    if (!profil) return res.status(403).json({ message: 'Profil admin introuvable.' });

    const medecins = await Medecin.findAll({ where: { hopital: profil.hopital_nom } });
    const medecinIds = medecins.map(m => m.id);
    if (medecinIds.length === 0) return res.json([]);

    const rdvs = await RendezVous.findAll({
      where: { medecin_id: { [Op.in]: medecinIds } },
      include: [
        { model: Patient, as: 'patient', include: [{ model: User, as: 'user', attributes: ['nom', 'email', 'telephone'] }] },
        { model: Medecin, as: 'medecin', include: [{ model: User, as: 'user', attributes: ['nom'] }] },
      ],
      order: [['date_rdv', 'ASC'], ['heure', 'ASC']],
    });

    res.json(rdvs.map(r => ({
      id:       r.id,
      date_rdv: r.date_rdv,
      heure:    r.heure,
      motif:    r.motif || '—',
      statut:   r.statut,
      patient:  { nom: r.patient?.user?.nom || '—', email: r.patient?.user?.email || '—', telephone: r.patient?.user?.telephone || '—' },
      medecin:  { nom: r.medecin?.user?.nom || '—' },
    })));
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// ── Secrétaire : transférer un RDV au médecin ────────────────
router.put('/rendez-vous/:id/transferer', authenticate, authorize('admin_hopital'), async (req, res) => {
  try {
    const profil = await AdminHopital.findOne({ where: { user_id: req.user.id } });
    if (!profil) return res.status(403).json({ message: 'Profil admin introuvable.' });

    const rdv = await RendezVous.findByPk(req.params.id, {
      include: [{ model: Medecin, as: 'medecin' }],
    });
    if (!rdv) return res.status(404).json({ message: 'RDV introuvable.' });
    if (rdv.medecin?.hopital !== profil.hopital_nom)
      return res.status(403).json({ message: 'Ce RDV n\'appartient pas à votre hôpital.' });
    if (rdv.statut !== 'en_attente')
      return res.status(400).json({ message: 'Ce RDV a déjà été traité.' });

    await rdv.update({ statut: 'transfere' });
    res.json({ message: 'RDV transmis au médecin.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// ── Secrétaire : annuler un RDV ──────────────────────────────
router.put('/rendez-vous/:id', authenticate, authorize('admin_hopital'), async (req, res) => {
  try {
    const profil = await AdminHopital.findOne({ where: { user_id: req.user.id } });
    if (!profil) return res.status(403).json({ message: 'Profil admin introuvable.' });

    const rdv = await RendezVous.findByPk(req.params.id, {
      include: [{ model: Medecin, as: 'medecin' }],
    });
    if (!rdv) return res.status(404).json({ message: 'RDV introuvable.' });
    if (rdv.medecin?.hopital !== profil.hopital_nom)
      return res.status(403).json({ message: 'Ce RDV n\'appartient pas à votre hôpital.' });

    const { statut } = req.body;
    if (!['annule'].includes(statut))
      return res.status(400).json({ message: 'Action non autorisée. Utilisez /transferer pour transmettre au médecin.' });

    await rdv.update({ statut });
    res.json({ message: 'RDV annulé.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// ── Secrétaire : patients ayant des RDV dans l'hôpital ───────
router.get('/patients', authenticate, authorize('admin_hopital'), async (req, res) => {
  try {
    const profil = await AdminHopital.findOne({ where: { user_id: req.user.id } });
    if (!profil) return res.status(403).json({ message: 'Profil admin introuvable.' });

    const medecins = await Medecin.findAll({ where: { hopital: profil.hopital_nom } });
    const medecinIds = medecins.map(m => m.id);
    if (medecinIds.length === 0) return res.json([]);

    const rdvs = await RendezVous.findAll({
      where: { medecin_id: { [Op.in]: medecinIds } },
      include: [
        { model: Patient, as: 'patient', include: [{ model: User, as: 'user', attributes: ['id','nom','email','telephone'] }] },
        { model: Medecin, as: 'medecin', include: [{ model: User, as: 'user', attributes: ['nom'] }] },
      ],
      order: [['date_rdv', 'DESC']],
    });

    const seen = new Set();
    const patients = [];
    for (const r of rdvs) {
      const pid = r.patient_id;
      if (!seen.has(pid)) {
        seen.add(pid);
        patients.push({
          id:          r.patient?.user?.id || pid,
          nom:         r.patient?.user?.nom      || '—',
          email:       r.patient?.user?.email    || '—',
          telephone:   r.patient?.user?.telephone || '—',
          dernier_rdv: r.date_rdv,
          medecin:     r.medecin?.user?.nom || '—',
        });
      }
    }
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// ── Super admin : supprimer un admin hôpital ──────────────────
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const profil = await AdminHopital.findByPk(req.params.id);
    if (!profil) return res.status(404).json({ message: 'Admin introuvable.' });
    await User.destroy({ where: { id: profil.user_id } });
    res.json({ message: 'Admin hôpital supprimé.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
