const { getUserProfile, refreshUserSession } = require('../../services/authService');

// Get user profile
const getProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    
    const profileResult = await getUserProfile(uid);
    
    if (!profileResult.success) {
      return res.status(404).json(profileResult);
    }
    
    res.status(200).json({
      success: true,
      user: profileResult.user,
      message: 'Profile retrieved successfully'
    });
    
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_ERROR',
        message: 'Failed to get user profile'
      }
    });
  }
};

// Refresh user session
const refreshSession = async (req, res) => {
  try {
    const uid = req.user.uid;
    
    const sessionResult = await refreshUserSession(uid);
    
    if (!sessionResult.success) {
      return res.status(400).json(sessionResult);
    }
    
    res.status(200).json({
      success: true,
      data: {
        user: sessionResult.user,
        token: sessionResult.token
      },
      message: 'Session refreshed successfully'
    });
    
  } catch (error) {
    console.error('Refresh session error:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'REFRESH_ERROR',
        message: 'Failed to refresh session'
      }
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    // For JWT tokens, we don't need to do anything server-side
    // The client will remove the token from localStorage
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: 'Failed to logout'
      }
    });
  }
};

module.exports = {
  getProfile,
  refreshSession,
  logout
};