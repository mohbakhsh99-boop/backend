const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.split(' ')[1] || req.cookies?.accessToken;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function roleMiddleware(roles = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

module.exports = { authMiddleware, roleMiddleware };
