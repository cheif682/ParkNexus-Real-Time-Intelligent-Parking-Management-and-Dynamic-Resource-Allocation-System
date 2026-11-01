import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; full_name: string; phone_number?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isCustomer: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('parknexus_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      if (token) {
        const currentUser = await api.getMe();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to load user session:', err);
      localStorage.removeItem('parknexus_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const response = await api.login({ email, password });
      localStorage.setItem('parknexus_token', response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      return response.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; full_name: string; phone_number?: string }) => {
    setLoading(true);
    try {
      await api.register(data);
      // Auto login after registration
      await login(data.email, data.password);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('parknexus_token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    if (token) {
      const updated = await api.getMe();
      setUser(updated);
    }
  };

  const role = user?.role;
  const isAuthenticated = !!user;
  const isAdmin = role === 'ADMIN';
  const isStaff = role === 'PARKING_STAFF';
  const isCustomer = role === 'CUSTOMER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated,
        isAdmin,
        isStaff,
        isCustomer,
        loading,
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
