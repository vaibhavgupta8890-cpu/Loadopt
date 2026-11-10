import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getStoredToken, getStoredUser, removeStoredToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = getStoredToken();
      if (storedToken) {
        try {
          const profile = await api.getCurrentUser();
          setUser(profile);
        } catch {
          removeStoredToken();
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };
    verifySession();
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'LOGISTICS_MANAGER';
  const isViewer = user?.role === 'VIEWER';
  const canModify = isAdmin || isManager;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        isManager,
        isViewer,
        canModify,
        login,
        logout,
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
