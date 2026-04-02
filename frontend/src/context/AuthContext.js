import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { token, user: savedUser } = authService.getAuthData();
    
    console.log('🔍 AuthContext - checkAuth');
    console.log('Token exists:', !!token);
    console.log('Saved user:', savedUser);
    
    if (token && savedUser) {
      console.log('📡 Validating token with backend...');
      const result = await authService.getProfile();
      
      if (result.success) {
        console.log('✅ Token valid, user:', result.user);
        setUser(result.user);
      } else {
        console.warn('❌ Token invalid, clearing auth data');
        authService.clearAuthData();
        setUser(null);
      }
    } else {
      console.log('ℹ️  No saved auth data found');
    }
    
    setLoading(false);
  };

  const login = async (identifier, password, rememberMe = false) => {
    const result = await authService.login(identifier, password, rememberMe);
    
    if (result.success) {
      setUser(result.user);
    }
    
    return result;
  };

  const register = async (username, email, password, rememberMe = false) => {
    const result = await authService.register(username, email, password, rememberMe);
    
    if (result.success) {
      setUser(result.user);
    }
    
    return result;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;