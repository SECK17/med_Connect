const multer = require('multer');
const path = require('path');
const fs = require('fs');

const nomAleatoire = (_req, file) =>
  `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname).toLowerCase()}`;

const makeStorage = (folder, nommer = nomAleatoire) => {
  const dir = path.join(__dirname, '../../uploads', folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (req, file, cb) => cb(null, nommer(req, file)),
  });
};

const fileFilter = (_req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Format non supporté. Utilisez JPG, PNG ou PDF.'), false);
};

const limits = { fileSize: 10 * 1024 * 1024 }; // 10 MB

const uploadOrdonnance = multer({ storage: makeStorage('ordonnances'), fileFilter, limits });
const uploadAnalyse    = multer({ storage: makeStorage('analyses'),    fileFilter, limits });
// Justificatif d'une demande de changement d'hôpital (consulté par l'admin uniquement)
const uploadJustificatif = multer({
  storage: makeStorage('demandes', (req, file) =>
    `demande_${req.user.id}_${Date.now()}${path.extname(file.originalname).toLowerCase()}`),
  fileFilter,
  limits,
});

module.exports = { uploadOrdonnance, uploadAnalyse, uploadJustificatif };
