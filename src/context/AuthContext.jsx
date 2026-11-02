import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    const token = authService.getToken();

    if (storedUser && token) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    const authenticatedUser = response.user;

    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const completeLogin = (userData, token) => {
    authService.setSession(token, null, userData);
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    authService.clearSession();
  };

  const updateUserProfile = (updatedData) => {
    const newUserData = { ...user, ...updatedData };
    setUser(newUserData);
    authService.setUser(newUserData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, completeLogin, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};