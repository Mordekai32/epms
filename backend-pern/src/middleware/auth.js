const jwt = require('jsonwebtoken');

// Verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

// Check role
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

// Restrict manager/deputy_manager to only their own department's data.
// Admin bypasses this check entirely.
const scopeToOwnDepartment = (req, res, next) => {
  if (req.user.role === 'admin') return next();

  if (['manager', 'deputy_manager'].includes(req.user.role)) {
    if (!req.user.departmentCode) {
      return res.status(403).json({ message: 'No department assigned to your account.' });
    }
    // Attach to request so route handlers can filter queries by it
    req.scopedDepartment = req.user.departmentCode;
    return next();
  }

  // Employees never reach department-scoped routes — block by default
  return res.status(403).json({ message: 'Access denied.' });
};

module.exports = { verifyToken, requireRole, scopeToOwnDepartment };