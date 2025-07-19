const { getUserProfile, refreshUserSession } = require('../../services/authService');

// Get user profile endpoint
const getProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }
    
    // Get user profile from database
    const profileResult = await getUserProfile(req.user.uid);
    
    if (!profileResult.success) {
      const statusCode = profileResult.error.code === 'USER_NOT_FOUND' ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        error: profileResult.error
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        user: profileResult.user
      }
    });
    
  } catch (error) {
    console.error('Get profile endpoint error:', error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user profile'
      }
    });
  }
};

// Refresh user session endpoint
const refreshSession = async (req, res) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }
    
    // Refresh user session
    const sessionResult = await refreshUserSession(req.user.uid);
    
    if (!sessionResult.success) {
      return res.status(500).json({
        success: false,
        error: sessionResult.error
      });
    }
    
    // Update HTTP-only cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    
    res.cookie('auth_token', sessionResult.token, cookieOptions);
    
    return res.status(200).json({
      success: true,
      data: {
        user: sessionResult.user,
        token: sessionResult.token
      },
      message: 'Session refreshed successfully'
    });
    
  } catch (error) {
    console.error('Refresh session endpoint error:', error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to refresh session'
      }
    });
  }
};

// Logout endpoint
const logout = async (req, res) => {
  try {
    // Clear the auth cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout endpoint error:', error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
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