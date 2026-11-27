// controllers/medecinController.js
// Médecins : annuaire, profil, validation.
// Les contrôles d'accès (authentification, rôle, droits sur le dossier), la validation
// des données et la traçabilité sont faits par les middlewares déclarés dans
// routes/medecinRoutes.js, avant l'appel de ces fonctions.
const { paginatedFindAll } = require('../utils/pagination');
const { fn, col } = require('sequelize');
const { User, Medecin, Evaluation } = require('../models');

// GET /api/medecins
const lister = async (req, res) => {
  try {
    const medecins = await paginatedFindAll(req, res, User, {
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

    // Notes moyennes calculées en SQL, uniquement pour les médecins de cette page
    const ids = medecins.map(m => m.id);
    const stats = ids.length
      ? await Evaluation.findAll({
          where: { medecin_id: ids },
          attributes: [
            "medecin_id",
            [fn("AVG", col("note")), "moyenne"],
            [fn("COUNT", col("id")), "total"],
          ],
          group: ["medecin_id"],
          raw: true,
        })
      : [];
    const notesMap = {};
    stats.forEach(s => {
      notesMap[s.medecin_id] = { moyenne: Number(s.moyenne), total: Number(s.total) };
    });

    const formattedMedecins = medecins.map(m => {
      const st = notesMap[m.id];
      const note = st ? Math.round(st.moyenne * 10) / 10 : 0;
      return {
        id: m.id,
        nom: m.nom,
        email: m.email,
        telephone: m.telephone,
        specialite: m.profil_medecin?.specialite || null,
        hopital: m.profil_medecin?.hopital || null,
        dispo: m.profil_medecin?.disponible !== false,
        note,
        nbEvals: st ? st.total : 0,
      };
    });

    res.json(formattedMedecins);
  } catch (err) {
    console.error('Erreur récupération médecins:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/medecins/:id
const detail = async (req, res) => {
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
};

// PUT /api/medecins/:id
const modifier = async (req, res) => {
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

    // Un médecin ne change pas d'hôpital lui-même : il passe par une demande
    // validée par l'admin (/api/demandes-hopital). Renvoyer la valeur actuelle reste permis.
    if (req.user.role === 'medecin' && hopital && hopital !== (medecin.hopital || '')) {
      return res.status(403).json({
        message: "Pour changer d'hôpital, faites une demande de changement depuis votre profil.",
      });
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
};

// PUT /api/medecins/:id/validate
const validerMedecin = async (req, res) => {
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
};

module.exports = {
  lister,
  detail,
  modifier,
  validerMedecin,
};
