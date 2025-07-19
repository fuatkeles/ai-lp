const { verifyIdToken, createOrUpdateUser, getUserByUid } = require('./firebaseService');
const jwt = require('jsonwebtoken');

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token for user session
const generateJWTToken = (user) => {
  const payload = {
    uid: user.uid,
    email: user.email,
    role: user.role || 'user',
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d' // Token expires in 7 days
  });
};

// Verify JWT token
const verifyJWTToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      success: true,
      user: decoded
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INVALID_JWT',
        message: 'Invalid or expired JWT token'
      }
    };
  }
};

// Handle Google OAuth login
const handleGoogleLogin = async (idToken) => {
  try {
    // Verify Firebase ID token
    const tokenResult = await verifyIdToken(idToken);
    if (!tokenResult.success) {
      return tokenResult;
    }
    
    const firebaseUser = tokenResult.user;
    
    // Create or update user in Firestore
    const userResult = await createOrUpdateUser({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.name,
      picture: firebaseUser.picture
    });
    
    if (!userResult.success) {
      return userResult;
    }
    
    // Generate JWT token for session management
    const jwtToken = generateJWTToken(userResult.user);
    
    return {
      success: true,
      user: userResult.user,
      token: jwtToken,
      isNewUser: userResult.isNewUser
    };
    
  } catch (error) {
    console.error('Google login error:', error.message);
    return {
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: 'Failed to process Google login'
      }
    };
  }
};

// Get user profile
const getUserProfile = async (uid) => {
  try {
    const userResult = await getUserByUid(uid);
    if (!userResult.success) {
      return userResult;
    }
    
    // Get additional user data from Firestore
    const { getFirestore } = require('./firebaseService');
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found'
        }
      };
    }
    
    const userData = userDoc.data();
    
    return {
      success: true,
      user: {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        role: userData.role,
        subscription: userData.subscription,
        createdAt: userData.createdAt,
        lastLoginAt: userData.lastLoginAt
      }
    };
    
  } catch (error) {
    console.error('Get user profile error:', error.message);
    return {
      success: false,
      error: {
        code: 'PROFILE_ERROR',
        message: 'Failed to get user profile'
      }
    };
  }
};

// Refresh user session
const refreshUserSession = async (uid) => {
  try {
    const profileResult = await getUserProfile(uid);
    if (!profileResult.success) {
      return profileResult;
    }
    
    // Generate new JWT token
    const jwtToken = generateJWTToken(profileResult.user);
    
    return {
      success: true,
      user: profileResult.user,
      token: jwtToken
    };
    
  } catch (error) {
    console.error('Refresh session error:', error.message);
    return {
      success: false,
      error: {
        code: 'REFRESH_FAILED',
        message: 'Failed to refresh user session'
      }
    };
  }
};

module.exports = {
  generateJWTToken,
  verifyJWTToken,
  handleGoogleLogin,
  getUserProfile,
  refreshUserSession
};