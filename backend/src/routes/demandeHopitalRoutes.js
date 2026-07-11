const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { authenticate, authorize } = require('../middleware/authenticate');
const { DemandeHopital, Medecin, User } = require('../models');

const router = express.Router();

const uploadsDir = path.join(__dirname, '../../uploads/demandes');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `demande_${req.user.id}_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// POST / — médecin soumet une demande
router.post('/', authenticate, authorize('medecin'), upload.single('justificatif'), async (req, res) => {
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
});

// GET /moi — médecin voit sa demande en cours
router.get('/moi', authenticate, authorize('medecin'), async (req, res) => {
  try {
    const demande = await DemandeHopital.findOne({
      where:  { medecin_id: req.user.id, statut: 'en_attente' },
      order:  [['created_at', 'DESC']],
    });
    res.json(demande);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE /moi — médecin annule sa demande
router.delete('/moi', authenticate, authorize('medecin'), async (req, res) => {
  try {
    await DemandeHopital.update(
      { statut: 'annulee' },
      { where: { medecin_id: req.user.id, statut: 'en_attente' } }
    );
    res.json({ message: 'Demande annulée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET / — admin voit toutes les demandes (filtrables par statut)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const where = {};
    if (req.query.statut) where.statut = req.query.statut;

    const demandes = await DemandeHopital.findAll({
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
});

// PUT /:id/valider — admin valide la demande et met à jour l'hôpital du médecin
router.put('/:id/valider', authenticate, authorize('admin'), async (req, res) => {
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
});

// PUT /:id/rejeter — admin rejette la demande
router.put('/:id/rejeter', authenticate, authorize('admin'), async (req, res) => {
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
});

module.exports = router;
