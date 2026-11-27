// routes/fileRoutes.js
// Sert les fichiers uploadés (ordonnances, analyses, justificatifs) uniquement
// aux utilisateurs autorisés. Remplace l'ancien express.static('uploads') public.
const express = require('express');
const { authenticateFichier } = require('../middleware/authenticate');
const { journaliser } = require('../middleware/journal');
const { telecharger } = require('../controllers/fileController');

const router = express.Router();

router.get('/:folder/:filename', authenticateFichier, journaliser('fichier', 'telechargement', { param: null }), telecharger);

module.exports = router;
