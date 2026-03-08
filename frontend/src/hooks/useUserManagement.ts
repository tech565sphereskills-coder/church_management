import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export type AppRole = 'admin' | 'attendance_officer' | 'finance_officer' | 'children_officer' | 'prayer_officer' | 'hod' | 'viewer';

export interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: AppRole | null;
  member: string | number | null;
  can_manage_members: boolean;
  can_manage_attendance: boolean;
  can_manage_financials: boolean;
  can_manage_departments: boolean;
  can_manage_children: boolean;
  can_manage_prayer_requests: boolean;
  can_manage_calendar: boolean;
  can_view_reports: boolean;
  can_manage_settings: boolean;
}

export function useUserManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get('/profiles/');
      setUsers(response.data);
    } catch (error: unknown) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const assignRole = async (userId: string, role: AppRole): Promise<boolean> => {
    try {
      const response = await api.post(`/profiles/${userId}/assign_role/`, { role });
      const updatedUser = response.data;
      
      // Update local state immediately with robust ID check
      setUsers(prev => prev.map(u => String(u.id) === String(userId) ? { ...u, ...updatedUser } : u));
      
      toast({
        title: 'Success',
        description: `Role assigned successfully`,
      });
      await fetchUsers(true);
      return true;
    } catch (error: unknown) {
      console.error('Error assigning role:', error);
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const detail = axiosError.response?.data?.detail;
      const errorData = axiosError.response?.data;
      const description = detail || (errorData ? JSON.stringify(errorData) : error instanceof Error ? error.message : 'Failed to assign role');
      
      toast({
        title: 'Error',
        description: description,
        variant: 'destructive',
      });
      return false;
    }
  };

  const updatePermissions = async (userId: string, permissions: Partial<UserWithRole>): Promise<boolean> => {
    if (!userId || userId === 'undefined') {
      console.error('Missing userId in updatePermissions');
      toast({
        title: 'Error',
        description: 'Internal Error: User ID is missing',
        variant: 'destructive',
      });
      return false;
    }
    try {
      const response = await api.patch(`/profiles/${userId}/`, permissions);
      const updatedUser = response.data;
      
      // Update local state immediately with robust ID check
      setUsers(prev => prev.map(u => String(u.id) === String(userId) ? { ...u, ...updatedUser } : u));
      
      toast({
        title: 'Success',
        description: 'Permissions updated successfully',
      });
      
      // Still fetch to ensure total sync, but the UI is already updated
      await fetchUsers(true);
      return true;
    } catch (error: unknown) {
      console.error('Error updating permissions:', error);
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const detail = axiosError.response?.data?.detail;
      const errorData = axiosError.response?.data;
      const description = detail || (errorData ? JSON.stringify(errorData) : error instanceof Error ? error.message : 'Failed to update permissions');
      
      toast({
        title: 'Error',
        description: description,
        variant: 'destructive',
      });
      return false;
    }
  };

  const removeRole = async (userId: string): Promise<boolean> => {
    try {
      const response = await api.post(`/profiles/${userId}/remove_role/`);
      const updatedUser = response.data;
      
      // Update local state immediately with robust ID check
      setUsers(prev => prev.map(u => String(u.id) === String(userId) ? { ...u, ...updatedUser } : u));
      
      toast({
        title: 'Success',
        description: 'Role removed successfully',
      });
      await fetchUsers(true);
      return true;
    } catch (error: unknown) {
      console.error('Error removing role:', error);
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const detail = axiosError.response?.data?.detail;
      const errorData = axiosError.response?.data;
      const description = detail || (errorData ? JSON.stringify(errorData) : error instanceof Error ? error.message : 'Failed to remove role');
      
      toast({
        title: 'Error',
        description: description,
        variant: 'destructive',
      });
      return false;
    }
  };

  const createUser = async (email: string, fullName: string, initialPassword: string): Promise<boolean> => {
    try {
      await api.post('/register/', {
        username: email,
        email,
        password: initialPassword,
        full_name: fullName
      });
      
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
      
      await fetchUsers(true);
      return true;
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      const axiosError = error as { response?: { data?: Record<string, unknown> } };
      const description = axiosError.response?.data ? JSON.stringify(axiosError.response.data) : 'Failed to create user';
      
      toast({
        title: 'Error',
        description: description,
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      await api.delete(`/profiles/${userId}/`);
      
      // Update local state immediately
      setUsers(prev => prev.filter(u => String(u.id) !== String(userId)));
      
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      return true;
    } catch (error: unknown) {
      console.error('Error deleting user:', error);
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const detail = axiosError.response?.data?.detail;
      const errorData = axiosError.response?.data;
      const description = detail || (errorData ? JSON.stringify(errorData) : error instanceof Error ? error.message : 'Failed to delete user');
      
      toast({
        title: 'Error',
        description: description,
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    fetchUsers,
    createUser,
    assignRole,
    updatePermissions,
    removeRole,
    deleteUser,
  };
}
