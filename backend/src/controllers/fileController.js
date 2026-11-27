// controllers/fileController.js
// Accès contrôlé aux fichiers envoyés (ordonnances, analyses, justificatifs).
// Les contrôles d'accès (authentification, rôle, droits sur le dossier), la validation
// des données et la traçabilité sont faits par les middlewares déclarés dans
// routes/fileRoutes.js, avant l'appel de ces fonctions.
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const Ordonnance = require('../models/Ordonnance');
const Analyse = require('../models/Analyse');
const { medecinSuitPatient } = require('../middleware/access');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// GET /uploads/:folder/:filename
const telecharger = async (req, res) => {
  try {
    const { folder, filename } = req.params;
    const { id: userId, role } = req.user;

    // Empêche toute traversée de répertoire (../)
    if (filename !== path.basename(filename)) {
      return res.status(400).json({ message: 'Nom de fichier invalide.' });
    }

    let autorise = false;

    if (folder === 'demandes') {
      autorise = role === 'admin';
    } else if (folder === 'ordonnances' || folder === 'analyses') {
      const Model = folder === 'ordonnances' ? Ordonnance : Analyse;
      const record = await Model.findOne({
        where: { fichier: { [Op.eq]: `uploads/${folder}/${filename}` } },
      });
      if (!record) return res.status(404).json({ message: 'Fichier introuvable.' });
      res.locals.journal = { patientId: record.patient_id, ressourceId: record.id, details: folder };

      if (role === 'admin') autorise = true;
      else if (role === 'patient') autorise = record.patient_id === userId;
      else if (role === 'medecin') {
        autorise = record.medecin_id === userId || await medecinSuitPatient(userId, record.patient_id);
      }
    } else {
      return res.status(404).json({ message: 'Fichier introuvable.' });
    }

    if (!autorise) return res.status(403).json({ message: 'Accès refusé.' });

    const filePath = path.join(UPLOADS_DIR, folder, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Fichier introuvable.' });

    res.set('Cache-Control', 'private, no-store');
    res.sendFile(filePath);
  } catch (err) {
    console.error('Erreur accès fichier:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  telecharger,
};
