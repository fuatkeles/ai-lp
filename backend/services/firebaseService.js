const admin = require('firebase-admin');
const path = require('path');

// Firebase Admin SDK initialization
let firebaseApp;

const initializeFirebase = () => {
  if (!firebaseApp) {
    try {
      const serviceAccountPath = path.join(__dirname, '../../cro-generator-firebase-adminsdk-fbsvc-4008b78b11.json');
      const serviceAccount = require(serviceAccountPath);
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || 'cro-generator',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'cro-generator.appspot.com'
      });
      
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Firebase initialization error:', error.message);
      throw error;
    }
  }
  return firebaseApp;
};

// Get Firebase Auth instance
const getAuth = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.auth();
};

// Get Firestore instance
const getFirestore = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.firestore();
};

// Verify Firebase ID token
const verifyIdToken = async (idToken) => {
  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return {
      success: true,
      user: decodedToken
    };
  } catch (error) {
    console.error('Token verification error:', error.message);
    return {
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    };
  }
};

// Get user by UID
const getUserByUid = async (uid) => {
  try {
    const auth = getAuth();
    const userRecord = await auth.getUser(uid);
    return {
      success: true,
      user: userRecord
    };
  } catch (error) {
    console.error('Get user error:', error.message);
    return {
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }
    };
  }
};

// Create or update user in Firestore
const createOrUpdateUser = async (userData) => {
  try {
    const db = getFirestore();
    const userRef = db.collection('users').doc(userData.uid);
    
    const userDoc = await userRef.get();
    const now = admin.firestore.FieldValue.serverTimestamp();
    
    if (!userDoc.exists) {
      // Create new user
      const newUser = {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.name || userData.displayName || '',
        photoURL: userData.picture || userData.photoURL || '',
        role: 'user',
        createdAt: now,
        lastLoginAt: now,
        subscription: {
          plan: 'free',
          status: 'active',
          expiresAt: null
        }
      };
      
      await userRef.set(newUser);
      return {
        success: true,
        user: newUser,
        isNewUser: true
      };
    } else {
      // Update existing user
      const updateData = {
        lastLoginAt: now,
        displayName: userData.name || userData.displayName || userDoc.data().displayName,
        photoURL: userData.picture || userData.photoURL || userDoc.data().photoURL
      };
      
      await userRef.update(updateData);
      const updatedUser = { ...userDoc.data(), ...updateData };
      
      return {
        success: true,
        user: updatedUser,
        isNewUser: false
      };
    }
  } catch (error) {
    console.error('Create/Update user error:', error.message);
    return {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to create or update user'
      }
    };
  }
};

module.exports = {
  initializeFirebase,
  getAuth,
  getFirestore,
  verifyIdToken,
  getUserByUid,
  createOrUpdateUser
};