const jwt = require('jsonwebtoken');
const config = require('../config/env');

module.exports = (req, res, next) => {
  const authorization = req.get('authorization');
  const [scheme, token] = authorization ? authorization.split(' ') : [];

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Sign in to access this resource.'
    });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (typeof payload !== 'object' || typeof payload.sub !== 'string' || !/^[1-9]\d*$/.test(payload.sub)) {
      throw new Error('Invalid token subject');
    }
    req.auth = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role || 'admin',
    };
    next();
  } catch {
    return res.status(401).json({
      error: 'INVALID_SESSION',
      message: 'Your session is invalid or expired. Sign in again.'
    });
  }
};
