const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token =req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Token is missing' });
  }

  try {
    const decoded = jwt.verify(token, 'joshua');

    req.userdetail = decoded;
    console.log(decoded)
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;