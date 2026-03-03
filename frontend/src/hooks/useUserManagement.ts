import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export type AppRole = 'admin' | 'attendance_officer' | 'viewer';

export interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: AppRole | null;
}

export function useUserManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
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
      await api.post(`/profiles/${userId}/assign_role/`, { role });
      toast({
        title: 'Success',
        description: `Role assigned successfully`,
      });
      await fetchUsers();
      return true;
    } catch (error: unknown) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign role',
        variant: 'destructive',
      });
      return false;
    }
  };

  const removeRole = async (userId: string): Promise<boolean> => {
    try {
      await api.post(`/profiles/${userId}/remove_role/`);
      toast({
        title: 'Success',
        description: 'Role removed successfully',
      });
      await fetchUsers();
      return true;
    } catch (error: unknown) {
      console.error('Error removing role:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove role',
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
    assignRole,
    removeRole,
  };
}
