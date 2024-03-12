const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token =req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ error: 're bhai phele toh login krle itni bhi jaldi ky h bhai ' });
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