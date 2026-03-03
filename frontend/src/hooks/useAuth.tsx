import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';
import axios from 'axios';
import { User, AppRole, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/profiles/me/');
      setUser(response.data.user);
      setRole(response.data.role);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post('/token/', { username: email, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      await fetchUserProfile();
      return { error: null };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        return { error: error.response?.data?.detail || 'Login failed' };
      }
      return { error: 'Login failed' };
    }
  };

  const signInWithGoogle = async (accessToken: string) => {
    try {
      const response = await api.post('/auth/google/', { access_token: accessToken });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      await fetchUserProfile();
      return { error: null };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        return { error: error.response?.data?.detail || 'Google login failed' };
      }
      return { error: 'Google login failed' };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      await api.post('/register/', { username: email, email, password, full_name: fullName });
      return { error: null };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        return { error: error.response?.data || 'Sign up failed' };
      }
      return { error: 'Sign up failed' };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setRole(null);
  };

  const isAdmin = role === 'admin';
  const isOfficer = role === 'attendance_officer';
  const canManageAttendance = isAdmin || isOfficer;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        isAdmin,
        isOfficer,
        canManageAttendance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
