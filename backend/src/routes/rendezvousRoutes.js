// routes/rendezvousRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authenticate');
const RendezVous = require('../models/RendezVous');
const Patient = require('../models/Patient');
const Medecin = require('../models/Medecin');
const User = require('../models/User');
const { sendRdvConfirme, sendRdvAnnule } = require('../services/emailService');

/**
 * GET /api/rendezvous/patient/:patientId
 * Récupère tous les rendez-vous d'un patient
 */
router.get('/patient/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Vérification: le patient ne peut voir que ses RDV
    if (req.user.role === 'patient' && req.user.id !== parseInt(patientId)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const rendezvous = await RendezVous.findAll({
      where: { patient_id: patientId },
      include: [
        {
          model: Medecin,
          as: 'medecin',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'nom', 'email'],
            },
          ],
        },
      ],
      order: [['date_rdv', 'DESC']],
    });

    res.json(rendezvous);
  } catch (err) {
    console.error('Erreur RDV patient:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

/**
 * GET /api/rendezvous/medecin/:medecinId
 * Récupère tous les rendez-vous d'un médecin
 */
router.get('/medecin/:medecinId', authenticate, async (req, res) => {
  try {
    const { medecinId } = req.params;

    // Vérification: le médecin ne peut voir que ses RDV
    if (req.user.role === 'medecin' && req.user.id !== parseInt(medecinId)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const rendezvous = await RendezVous.findAll({
      where: { medecin_id: medecinId },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'dateNaissance', 'groupeSanguin', 'adresse'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'nom', 'email', 'telephone'],
            },
          ],
        },
      ],
      order: [['date_rdv', 'ASC']],
    });

    res.json(rendezvous);
  } catch (err) {
    console.error('Erreur RDV médecin:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

/**
 * GET /api/rendezvous/stats
 * Statistiques globales des RDV (super admin)
 */
router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [total, en_attente, transfere, confirme, annule] = await Promise.all([
      RendezVous.count(),
      RendezVous.count({ where: { statut: 'en_attente' } }),
      RendezVous.count({ where: { statut: 'transfere' } }),
      RendezVous.count({ where: { statut: 'confirme' } }),
      RendezVous.count({ where: { statut: 'annule' } }),
    ]);
    res.json({ total, en_attente, transfere, confirme, annule });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

/**
 * POST /api/rendezvous
 * Crée un nouveau rendez-vous (patient)
 */
router.post('/', authenticate, authorize('patient', 'donneur'), async (req, res) => {
  try {
    const { patientId, medecinId, date, heure, motif } = req.body;

    if (!patientId || !medecinId || !date || !heure || !motif) {
      return res.status(400).json({ message: 'Champs obligatoires manquants.' });
    }

    const rendezvous = await RendezVous.create({
      patient_id: patientId,
      medecin_id: medecinId,
      date_rdv: date,
      heure,
      motif,
      statut: 'en_attente',
    });

    res.status(201).json(rendezvous);
  } catch (err) {
    console.error('Erreur création RDV:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

/**
 * PUT /api/rendezvous/:id
 * Modifie le statut et les détails d'un rendez-vous
 * - medecin : confirme ou annule ses propres RDV (date_rdv, heure, statut)
 * - admin_hopital : transfère un RDV vers un médecin (statut = transfere)
 * - patient : annule uniquement son propre RDV (statut = annule)
 * - admin : accès complet
 */
router.put('/:id', authenticate, authorize('medecin', 'admin', 'admin_hopital', 'patient'), async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, date_rdv, heure, medecin_id } = req.body;
    const { role, id: userId } = req.user;

    const rendezvous = await RendezVous.findByPk(id);
    if (!rendezvous) {
      return res.status(404).json({ message: 'Rendez-vous introuvable.' });
    }

    // Patient : peut seulement annuler son propre RDV
    if (role === 'patient') {
      if (rendezvous.patient_id !== userId) {
        return res.status(403).json({ message: 'Accès refusé.' });
      }
      if (statut !== 'annule') {
        return res.status(403).json({ message: 'Action non autorisée.' });
      }
      await rendezvous.update({ statut: 'annule' });
      return res.json(rendezvous);
    }

    // Médecin : peut agir uniquement sur ses propres RDV
    if (role === 'medecin' && rendezvous.medecin_id !== userId) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const updates = {};
    if (statut)    updates.statut    = statut;
    if (date_rdv)  updates.date_rdv  = date_rdv;
    if (heure)     updates.heure     = heure;
    if (medecin_id) updates.medecin_id = medecin_id;

    const ancienStatut = rendezvous.statut;
    await rendezvous.update(updates);

    // Emails de notification si le statut change
    if (updates.statut && updates.statut !== ancienStatut) {
      try {
        const patientUser = await User.findByPk(rendezvous.patient_id, { attributes: ['nom', 'email'] });
        const medecinUser = await User.findByPk(rendezvous.medecin_id, { attributes: ['nom'] });
        if (patientUser && medecinUser) {
          if (updates.statut === 'confirme') {
            sendRdvConfirme(patientUser.email, patientUser.nom, medecinUser.nom, rendezvous.date_rdv, rendezvous.heure).catch(() => {});
          } else if (updates.statut === 'annule') {
            sendRdvAnnule(patientUser.email, patientUser.nom, medecinUser.nom, rendezvous.date_rdv).catch(() => {});
          }
        }
      } catch (_) {}
    }

    res.json(rendezvous);
  } catch (err) {
    console.error('Erreur modification RDV:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

/**
 * DELETE /api/rendezvous/:id
 * Annule un rendez-vous
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const rendezvous = await RendezVous.findByPk(id);
    if (!rendezvous) {
      return res.status(404).json({ message: 'Rendez-vous introuvable.' });
    }

    // Vérification: seul le patient ou le médecin peut annuler
    if (req.user.id !== rendezvous.patient_id && req.user.id !== rendezvous.medecin_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    await rendezvous.destroy();
    res.json({ message: 'Rendez-vous annulé.' });
  } catch (err) {
    console.error('Erreur suppression RDV:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
