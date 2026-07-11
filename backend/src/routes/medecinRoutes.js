// routes/medecinRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authenticate');
const { User, Medecin, Evaluation } = require('../models');

/**
 * GET /api/medecins
 * Récupère la liste de tous les médecins
 */
router.get('/', async (req, res) => {
  try {
    const medecins = await User.findAll({
      where: { role: 'medecin' },
      include: [
        {
          model: Medecin,
          as: 'profil_medecin',
          required: false,
        },
      ],
      attributes: ['id', 'nom', 'email', 'telephone'],
    });

    // Récupérer les notes moyennes en une seule requête
    const evals = await Evaluation.findAll({ attributes: ["medecin_id", "note"] });
    const notesMap = {};
    evals.forEach(e => {
      if (!notesMap[e.medecin_id]) notesMap[e.medecin_id] = [];
      notesMap[e.medecin_id].push(e.note);
    });

    const formattedMedecins = medecins.map(m => {
      const notes = notesMap[m.id] || [];
      const note = notes.length
        ? Math.round((notes.reduce((s, n) => s + n, 0) / notes.length) * 10) / 10
        : 0;
      return {
        id: m.id,
        nom: m.nom,
        email: m.email,
        telephone: m.telephone,
        specialite: m.profil_medecin?.specialite || null,
        hopital: m.profil_medecin?.hopital || null,
        dispo: m.profil_medecin?.disponible !== false,
        note,
        nbEvals: notes.length,
      };
    });

    res.json(formattedMedecins);
  } catch (err) {
    console.error('Erreur récupération médecins:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

/**
 * GET /api/medecins/:id
 * Récupère le profil complet d'un médecin
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const medecin = await User.findByPk(id, {
      include: [
        {
          model: Medecin,
          as: 'profil_medecin',
        },
      ],
      attributes: ['id', 'nom', 'email', 'telephone', 'role'],
    });

    if (!medecin || medecin.role !== 'medecin') {
      return res.status(404).json({ message: 'Médecin introuvable.' });
    }

    res.json(medecin);
  } catch (err) {
    console.error('Erreur récupération médecin:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

/**
 * PUT /api/medecins/:id
 * Modifie le profil du médecin (médecin seulement)
 */
router.put('/:id', authenticate, authorize('medecin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { specialite, experience, disponible, tarif, hopital, numeroOrdre, numLicence, telephone, nom } = req.body;

    // Vérification: le médecin ne peut modifier que son propre profil
    if (req.user.role === 'medecin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const medecin = await Medecin.findByPk(id);
    if (!medecin) {
      return res.status(404).json({ message: 'Médecin introuvable.' });
    }

    // Mettre à jour le User (nom, telephone)
    if (nom || telephone) {
      const userUpdates = {};
      if (nom) userUpdates.nom = nom;
      if (telephone) userUpdates.telephone = telephone;
      await User.update(userUpdates, { where: { id } });
    }

    const updates = {};
    if (specialite) updates.specialite = specialite;
    if (experience !== undefined) updates.experience = experience;
    if (disponible !== undefined) updates.disponible = disponible;
    if (tarif) updates.tarif = tarif;
    if (hopital) updates.hopital = hopital;
    if (numeroOrdre) updates.numLicence = numeroOrdre;
    if (numLicence) updates.numLicence = numLicence;
    if (req.body.disponibilites !== undefined) updates.disponibilites = req.body.disponibilites;

    await medecin.update(updates);
    res.json(medecin);
  } catch (err) {
    console.error('Erreur modification profil médecin:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

/**
 * PUT /api/medecins/:id/validate
 * Valide un compte médecin (admin seulement)
 */
router.put('/:id/validate', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const medecin = await Medecin.findByPk(id);
    if (!medecin) {
      return res.status(404).json({ message: 'Médecin introuvable.' });
    }

    await medecin.update({ valide: true });
    res.json({ message: 'Médecin validé.', medecin });
  } catch (err) {
    console.error('Erreur validation médecin:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
