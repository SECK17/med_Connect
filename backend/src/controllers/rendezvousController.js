// controllers/rendezvousController.js
// Rendez-vous : prise, suivi, changement de statut.
// Les contrôles d'accès (authentification, rôle, droits sur le dossier), la validation
// des données et la traçabilité sont faits par les middlewares déclarés dans
// routes/rendezvousRoutes.js, avant l'appel de ces fonctions.
const { profilAdminHopital, medecinDansHopital } = require('../middleware/access');
const { paginatedFindAll } = require('../utils/pagination');
const RendezVous = require('../models/RendezVous');
const Patient = require('../models/Patient');
const Medecin = require('../models/Medecin');
const User = require('../models/User');
const { sendRdvConfirme, sendRdvAnnule } = require('../services/emailService');

// GET /api/rendezvous/patient/:patientId
const listerParPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Vérification: le patient ne peut voir que ses RDV
    if (req.user.role === 'patient' && req.user.id !== parseInt(patientId)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const rendezvous = await paginatedFindAll(req, res, RendezVous, {
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
};

// GET /api/rendezvous/medecin/:medecinId
const listerParMedecin = async (req, res) => {
  try {
    const { medecinId } = req.params;

    // Vérification: le médecin ne peut voir que ses RDV
    if (req.user.role === 'medecin' && req.user.id !== parseInt(medecinId)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const rendezvous = await paginatedFindAll(req, res, RendezVous, {
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
};

// GET /api/rendezvous/stats
const statistiques = async (req, res) => {
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
};

// POST /api/rendezvous
const creer = async (req, res) => {
  try {
    const { patientId, medecinId, date, heure, motif } = req.body;

    // Le patient est TOUJOURS l'utilisateur connecté : un RDV donne au médecin
    // l'accès au dossier, on ne peut donc pas en créer au nom de quelqu'un d'autre.
    if (patientId && patientId !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez prendre rendez-vous que pour vous-même.' });
    }

    const medecin = await Medecin.findByPk(medecinId, { attributes: ['id', 'valide'] });
    if (!medecin || !medecin.valide) {
      return res.status(404).json({ message: 'Médecin introuvable.' });
    }

    const aujourdhui = new Date().toISOString().split('T')[0];
    if (date < aujourdhui) {
      return res.status(400).json({ message: 'La date du rendez-vous ne peut pas être dans le passé.' });
    }

    const rendezvous = await RendezVous.create({
      patient_id: req.user.id,
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
};

// PUT /api/rendezvous/:id
const modifier = async (req, res) => {
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

    // Médecin : peut agir uniquement sur ses propres RDV, sans les réattribuer
    if (role === 'medecin') {
      if (rendezvous.medecin_id !== userId) {
        return res.status(403).json({ message: 'Accès refusé.' });
      }
      if (medecin_id && parseInt(medecin_id, 10) !== userId) {
        return res.status(403).json({ message: 'Un médecin ne peut pas réattribuer un rendez-vous.' });
      }
    }

    // Admin hôpital : uniquement les RDV des médecins de SON hôpital,
    // et une réattribution seulement vers un médecin du même hôpital
    if (role === 'admin_hopital') {
      const profil = await profilAdminHopital(userId);
      if (!profil) return res.status(403).json({ message: 'Profil admin hôpital introuvable.' });
      if (!(await medecinDansHopital(rendezvous.medecin_id, profil.hopital_nom))) {
        return res.status(403).json({ message: "Ce rendez-vous n'appartient pas à votre hôpital." });
      }
      if (medecin_id && !(await medecinDansHopital(parseInt(medecin_id, 10), profil.hopital_nom))) {
        return res.status(403).json({ message: "Le médecin choisi n'exerce pas dans votre hôpital." });
      }
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
};

// DELETE /api/rendezvous/:id
const supprimer = async (req, res) => {
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
};

module.exports = {
  listerParPatient,
  listerParMedecin,
  statistiques,
  creer,
  modifier,
  supprimer,
};
