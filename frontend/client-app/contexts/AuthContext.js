import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import axios from 'axios';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // API base URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setError('');
      setLoading(true);

      // Sign in with Firebase
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      // Send token to backend for verification and user creation
      const response = await axios.post(`${API_URL}/api/auth/google-login`, {
        idToken
      });

      if (response.data.success) {
        const userData = response.data.data.user;
        setUser(userData);
        
        // Store token in localStorage for API requests
        localStorage.setItem('authToken', response.data.data.token);
        
        return userData;
      } else {
        throw new Error(response.data.error?.message || 'Login failed');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      setError(error.message || 'An error occurred during login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setError('');
      await firebaseSignOut(auth);
      setUser(null);
      localStorage.removeItem('authToken');
    } catch (error) {
      console.error('Sign out error:', error);
      setError(error.message || 'An error occurred during sign out');
      throw error;
    }
  };

  // Get user profile from backend
  const getUserProfile = async (idToken) => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });

      if (response.data.success) {
        return response.data.data.user;
      }
      return null;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in, get profile from backend
          const idToken = await firebaseUser.getIdToken();
          const userProfile = await getUserProfile(idToken);
          
          if (userProfile) {
            setUser(userProfile);
            localStorage.setItem('authToken', idToken);
          } else {
            // If backend doesn't have user, sign out
            await firebaseSignOut(auth);
            setUser(null);
            localStorage.removeItem('authToken');
          }
        } else {
          // User is signed out
          setUser(null);
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Refresh user data
  const refreshUser = async () => {
    try {
      if (auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken(true);
        const userProfile = await getUserProfile(idToken);
        if (userProfile) {
          setUser(userProfile);
          localStorage.setItem('authToken', idToken);
        }
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};