const express = require('express');
const { uploader } = require('../middleware/upload');
const { uploadHandler } = require('../controllers/uploadController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/upload', authMiddleware, uploader.single('file'), uploadHandler);

module.exports = router;
