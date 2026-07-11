const multer = require('multer');
const path = require('path');
const fs = require('fs');

const makeStorage = (folder) => {
  const dir = path.join(__dirname, '../../uploads', folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    },
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

module.exports = { uploadOrdonnance, uploadAnalyse };
