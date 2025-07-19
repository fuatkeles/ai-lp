const { verifyJWTToken, getUserProfile } = require('../services/authService');

// Authentication middleware to verify JWT tokens
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Access token is required'
        }
      });
    }
    
    // Verify JWT token
    const tokenResult = verifyJWTToken(token);
    if (!tokenResult.success) {
      return res.status(401).json({
        success: false,
        error: tokenResult.error
      });
    }
    
    // Add user info to request object
    req.user = tokenResult.user;
    next();
    
  } catch (error) {
    console.error('Authentication middleware error:', error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed'
      }
    });
  }
};

// Authorization middleware to check user roles
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
      }
      
      const userRole = req.user.role || 'user';
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions'
          }
        });
      }
      
      next();
    } catch (error) {
      console.error('Authorization middleware error:', error.message);
      return res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Authorization failed'
        }
      });
    }
  };
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const tokenResult = verifyJWTToken(token);
      if (tokenResult.success) {
        req.user = tokenResult.user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Middleware to refresh user data from database
const refreshUserData = async (req, res, next) => {
  try {
    if (!req.user || !req.user.uid) {
      return next();
    }
    
    // Get fresh user data from database
    const profileResult = await getUserProfile(req.user.uid);
    if (profileResult.success) {
      req.user = { ...req.user, ...profileResult.user };
    }
    
    next();
  } catch (error) {
    console.error('Refresh user data error:', error.message);
    next(); // Continue even if refresh fails
  }
};

// Rate limiting for authentication endpoints
const authRateLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs for auth endpoints
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authenticateToken,
  authorizeRole,
  optionalAuth,
  refreshUserData,
  authRateLimit
};