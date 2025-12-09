const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png'];
  if (!allowed.includes(file.mimetype)) return cb(new Error('Only jpg/png allowed'));
  cb(null, true);
}

const uploader = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });

module.exports = { uploader };
