import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Set default axios base URL dynamically for production/dev environments
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff';
  branchId: string;
  token?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserBranch: (branchId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('erp_user');
    const storedToken = localStorage.getItem('erp_token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const data = response.data;
      
      setUser(data);
      setToken(data.token);
      localStorage.setItem('erp_user', JSON.stringify(data));
      localStorage.setItem('erp_token', data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('erp_user');
    localStorage.removeItem('erp_token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUserBranch = (branchId: string) => {
    if (user) {
      const updatedUser = { ...user, branchId };
      setUser(updatedUser);
      localStorage.setItem('erp_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUserBranch }}>
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
