import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Department {
  id: string;
  name: string;
  description: string | null;
  leader: string | null;
  leader_name?: string;
  member_count?: number;
  created_at: string;
  updated_at: string;
}

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/departments/');
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load departments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createDepartment = async (data: Partial<Department>) => {
    try {
      const response = await api.post('/departments/', data);
      toast({
        title: 'Department Created',
        description: 'New department has been added successfully.',
      });
      await fetchDepartments();
      return response.data;
    } catch (error) {
      console.error('Error creating department:', error);
      toast({
        title: 'Error',
        description: 'Failed to create department',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateDepartment = async (id: string, data: Partial<Department>) => {
    try {
      const response = await api.patch(`/departments/${id}/`, data);
      toast({
        title: 'Department Updated',
        description: 'Department details have been updated.',
      });
      await fetchDepartments();
      return response.data;
    } catch (error) {
      console.error('Error updating department:', error);
      toast({
        title: 'Error',
        description: 'Failed to update department',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      await api.delete(`/departments/${id}/`);
      toast({
        title: 'Department Deleted',
        description: 'Department has been removed successfully.',
      });
      await fetchDepartments();
      return true;
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete department',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchDepartments();
    }
  }, [user, fetchDepartments]);

  return {
    departments,
    loading,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}
