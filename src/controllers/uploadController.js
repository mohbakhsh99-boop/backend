const path = require('path');

function uploadHandler(req, res) {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
  const url = `${baseUrl}/uploads/${req.file.filename}`;
  return res.status(201).json({ url });
}

module.exports = { uploadHandler };
