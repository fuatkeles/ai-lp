// Simple test script to verify Firebase Authentication setup
require('dotenv').config();

const { initializeFirebase, verifyIdToken } = require('./services/firebaseService');
const { handleGoogleLogin } = require('./services/authService');

async function testFirebaseSetup() {
  try {
    console.log('🧪 Testing Firebase Authentication setup...\n');
    
    // Test 1: Initialize Firebase
    console.log('1. Testing Firebase initialization...');
    initializeFirebase();
    console.log('✅ Firebase initialized successfully\n');
    
    // Test 2: Test service imports
    console.log('2. Testing service imports...');
    console.log('✅ Firebase service imported');
    console.log('✅ Auth service imported\n');
    
    // Test 3: Test middleware import
    console.log('3. Testing middleware import...');
    const authMiddleware = require('./middleware/auth');
    console.log('✅ Auth middleware imported\n');
    
    // Test 4: Test API route imports
    console.log('4. Testing API route imports...');
    const authRoutes = require('./api/auth');
    console.log('✅ Auth routes imported\n');
    
    console.log('🎉 All Firebase Authentication components loaded successfully!');
    console.log('\nAvailable endpoints:');
    console.log('- POST /api/auth/google-login');
    console.log('- GET  /api/auth/profile');
    console.log('- POST /api/auth/refresh');
    console.log('- POST /api/auth/logout');
    console.log('- GET  /api/auth/verify-token');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testFirebaseSetup();