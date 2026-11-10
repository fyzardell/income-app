import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('income_auth_token') || '');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('income_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      api.getProfile()
        .then((u) => {
          setUser(u);
          localStorage.setItem('income_auth_user', JSON.stringify(u));
        })
        .catch(() => logout());
    }
  }, [token]);

  const loginWithToken = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('income_auth_token', newToken);
    localStorage.setItem('income_auth_user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('income_auth_token');
    localStorage.removeItem('income_auth_user');
  };

  const updateProfileName = async (name) => {
    const updated = await api.updateProfile(name);
    setUser(updated);
    localStorage.setItem('income_auth_user', JSON.stringify(updated));
    return updated;
  };

  const isAuthenticated = !!token;
  const isCashier = user?.role === 'cashier' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        setLoading,
        isAuthenticated,
        isCashier,
        isAdmin,
        loginWithToken,
        logout,
        updateProfileName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

