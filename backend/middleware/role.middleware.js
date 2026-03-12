// Re-export protect from auth if needed, or combine
exports.protect = require('./auth.middleware').protect;

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Role not authorized' });
    }
    next();
  };
};