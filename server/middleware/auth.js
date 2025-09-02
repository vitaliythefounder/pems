const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Try to find user in both legacy User model and PlatformUser model
    let user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      // Try PlatformUser model
      const PlatformUser = require('../models/PlatformUser');
      user = await PlatformUser.findById(decoded.userId).select('-password');
    }
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin()) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Middleware to check if user is super admin
const requireSuperAdmin = (req, res, next) => {
  if (!req.user.isSuperAdmin()) {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

// Middleware to check resource ownership or admin access
const requireOwnershipOrAdmin = (resourceOwnerField = 'owner') => {
  return (req, res, next) => {
    const resourceOwner = req.resource[resourceOwnerField];
    
    if (req.user.isAdmin() || resourceOwner.toString() === req.user._id.toString()) {
      return next();
    }
    
    res.status(403).json({ error: 'Access denied' });
  };
};

// Middleware to check if user can view resource
const requireViewAccess = (resourceField = 'resource') => {
  return (req, res, next) => {
    const resource = req[resourceField];
    
    if (resource.canView(req.user._id)) {
      return next();
    }
    
    res.status(403).json({ error: 'Access denied' });
  };
};

// Middleware to check if user can edit resource
const requireEditAccess = (resourceField = 'resource') => {
  return (req, res, next) => {
    const resource = req[resourceField];
    
    if (resource.canEdit(req.user._id)) {
      return next();
    }
    
    res.status(403).json({ error: 'Edit access denied' });
  };
};

// Middleware to check if user can admin resource
const requireAdminAccess = (resourceField = 'resource') => {
  return (req, res, next) => {
    const resource = req[resourceField];
    
    if (resource.canAdmin(req.user._id)) {
      return next();
    }
    
    res.status(403).json({ error: 'Admin access denied' });
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireSuperAdmin,
  requireOwnershipOrAdmin,
  requireViewAccess,
  requireEditAccess,
  requireAdminAccess
};
