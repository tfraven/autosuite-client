import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize or fetch current session
  useEffect(() => {
    const token = localStorage.getItem('autosuite_token');
    if (token) {
      api.getMe()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('autosuite_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      // Auto login as admin initially for demonstration if no token
      autoLoginDefault();
    }
  }, []);

  const autoLoginDefault = async () => {
    try {
      const res = await api.login('admin', 'admin123');
      localStorage.setItem('autosuite_token', res.accessToken);
      setUser(res.user);
    } catch (e) {
      console.warn('Auto-login failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const res = await api.login(username, password);
    localStorage.setItem('autosuite_token', res.accessToken);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('autosuite_token');
    setUser(null);
  };

  // Fast switch for RBAC testing
  const switchUser = async (username) => {
    const passwords = {
      admin: 'admin123',
      manager: 'manager123',
      operator: 'operator123',
      sales: 'sales123'
    };
    const pwd = passwords[username] || 'admin123';
    return login(username, pwd);
  };

  const hasPermission = (permissionName) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return user.permissions?.includes(permissionName) || false;
  };

  const isRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        switchUser,
        hasPermission,
        isRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
