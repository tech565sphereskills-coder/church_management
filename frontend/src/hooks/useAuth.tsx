import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';
import axios from 'axios';
import { User, AppRole, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [hodDepartments, setHodDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState({
    can_manage_members: false,
    can_manage_attendance: false,
    can_manage_financials: false,
    can_manage_departments: false,
    can_manage_children: false,
    can_manage_prayer_requests: false,
    can_manage_calendar: false,
    can_view_reports: false,
    can_manage_settings: false,
  });

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/profiles/me/');
      const { 
        id, email, username, role: userRole,
        can_manage_members, can_manage_attendance, can_manage_financials,
        can_manage_departments, can_manage_children, can_manage_prayer_requests,
        can_manage_calendar, can_view_reports, can_manage_settings,
        hod_departments
      } = response.data;
      
      setUser({ id, email, username });
      setRole(userRole);
      setPermissions({
        can_manage_members, can_manage_attendance, can_manage_financials,
        can_manage_departments, can_manage_children, can_manage_prayer_requests,
        can_manage_calendar, can_view_reports, can_manage_settings
      });
      setHodDepartments(hod_departments || []);
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

  const signIn = async (email: string, password: string, twoFactorToken?: string) => {
    try {
      console.log('Attempting sign-in for:', email);
      const response = await api.post('/token/', { 
        email, 
        password,
        two_factor_token: twoFactorToken 
      });
      
      const accessToken = response.data.access || response.data.access_token || response.data.token;
      const refreshToken = response.data.refresh || response.data.refresh_token;
      
      if (accessToken) {
        localStorage.setItem('access_token', accessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      }
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
      
      await fetchUserProfile();
      
      return { error: null };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        // Handle 2FA Required
        const responseData = error.response?.data as { 
          two_factor_required?: boolean; 
          detail?: string;
          non_field_errors?: string[];
        };
        
        if (responseData?.two_factor_required) {
          return { error: '2fa_required' };
        }
        
        const detail = responseData?.detail || 
                      responseData?.non_field_errors?.[0] || 
                      JSON.stringify(responseData) ||
                      'Login failed';
        return { error: detail };
      }
      return { error: 'Login failed' };
    }
  };


  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      await api.post('/register/', { username: email, email, password, full_name: fullName });
      return { error: null };
    } catch (error: unknown) {
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
  const isOfficer = role === 'attendance_officer' || permissions.can_manage_attendance;
  
  const canManageAttendance = isAdmin || permissions.can_manage_attendance;
  const canManageFinances = isAdmin || permissions.can_manage_financials;
  const canManageChildren = isAdmin || permissions.can_manage_children;
  const canManagePrayer = isAdmin || permissions.can_manage_prayer_requests;
  const canManageMembers = isAdmin || permissions.can_manage_members;
  const canManageDepartments = isAdmin || permissions.can_manage_departments;
  const canManageCalendar = isAdmin || permissions.can_manage_calendar;
  const canViewReports = isAdmin || permissions.can_view_reports;
  const canManageSettings = isAdmin || permissions.can_manage_settings;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin,
        isOfficer,
        isFinanceOfficer: isAdmin || role === 'finance_officer' || permissions.can_manage_financials,
        isChildrenOfficer: isAdmin || role === 'children_officer' || permissions.can_manage_children,
        isPrayerOfficer: isAdmin || role === 'prayer_officer' || permissions.can_manage_prayer_requests,
        isHOD: isAdmin || role === 'hod' || hodDepartments.length > 0,
        hodDepartments,
        canManageAttendance,
        canManageFinances,
        canManageChildren,
        canManagePrayer,
        canManageMembers,
        canManageDepartments,
        canManageCalendar,
        canViewReports,
        canManageSettings,
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
