import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);

  const fetchProfile = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await authService.getMe();
      if (data.success) {
        setUser(data.user);
        setUserStats(data.stats);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (err) {
      console.warn('Session verification failed:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [token]);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    if (data.success) {
      setToken(data.token);
      setUser(data.user);
      return data;
    }
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    if (data.success) {
      setToken(data.token);
      setUser(data.user);
      return data;
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
    setUserStats(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        userStats,
        login,
        register,
        logout,
        refreshProfile: fetchProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
