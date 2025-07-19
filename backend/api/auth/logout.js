const { verifyToken } = require('../../middleware/auth');
const authService = require('../../services/authService');

/**
 * Logout Handler
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    // Update last logout time in user profile
    const userRef = require('../../utils/firebaseAdmin').db.collection('users').doc(req.user.uid);
    await userRef.update({
      lastLogoutAt: new Date(),
      updatedAt: new Date()
    });
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Successfully logged out'
      }
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if updating logout time fails, we should still return success
    // since the client-side token invalidation is what matters most
    res.status(200).json({
      success: true,
      data: {
        message: 'Successfully logged out'
      }
    });
  }
};

module.exports = [verifyToken, logout];