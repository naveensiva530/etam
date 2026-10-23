module.exports = (...allowedRoles) => (req, res, next) => {
  if (!req.auth?.role || !allowedRoles.includes(req.auth.role)) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'You do not have permission to access this resource.'
    });
  }
  next();
};
