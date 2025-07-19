const express = require('express');
const router = express.Router();

// Import middleware
const { authenticateToken, authRateLimit } = require('../../middleware/auth');

// Import route handlers
const googleLogin = require('./google-login');
const { getProfile, refreshSession, logout } = require('./profile');

// Apply rate limiting to all auth routes
router.use(authRateLimit);

// Public routes (no authentication required)
router.post('/google-login', googleLogin);

// Protected routes (authentication required)
router.get('/profile', authenticateToken, getProfile);
router.post('/refresh', authenticateToken, refreshSession);
router.post('/logout', authenticateToken, logout);

// Verify token endpoint (for client-side token validation)
router.get('/verify-token', authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        uid: req.user.uid,
        email: req.user.email,
        role: req.user.role
      }
    },
    message: 'Token is valid'
  });
});

module.exports = router;