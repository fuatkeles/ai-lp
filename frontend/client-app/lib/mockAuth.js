// Mock authentication for development/testing when Firebase is not configured
export const mockAuth = {
  currentUser: null,
  
  // Mock sign in with Google
  signInWithPopup: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser = {
      uid: 'mock-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://via.placeholder.com/40',
      getIdToken: async () => 'mock-id-token-123'
    };
    
    mockAuth.currentUser = mockUser;
    return { user: mockUser };
  },
  
  // Mock sign out
  signOut: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    mockAuth.currentUser = null;
  },
  
  // Mock auth state listener
  onAuthStateChanged: (callback) => {
    // Simulate initial auth state check
    setTimeout(() => {
      callback(mockAuth.currentUser);
    }, 100);
    
    // Return unsubscribe function
    return () => {};
  }
};

export const mockGoogleProvider = {
  setCustomParameters: () => {}
};