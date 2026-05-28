const jwt = require('jsonwebtoken');
const { query } = require('../db');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await query('SELECT id, name, email, avatar, created_at AS "createdAt" FROM users WHERE id = $1', [decoded.id]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }
    user._id = user.id.toString();

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = protect;
