import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface Department {
  id: string;
  name: string;
  description: string | null;
  head_of_department: string | null;
  hod_name?: string;
  member_count?: number;
  created_at: string;
  updated_at: string;
}

export function useDepartments() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: departments = [], isLoading, refetch } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments/');
      return response.data;
    },
    enabled: !!user,
  });

  const fetchDepartments = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const loading = isLoading;

  const createDepartment = async (data: Partial<Department>) => {
    try {
      const response = await api.post('/departments/', data);
      toast({
        title: 'Department Created',
        description: `${data.name} has been added successfully.`,
      });

      queryClient.invalidateQueries({ queryKey: ['departments'] });
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
        description: 'Department information has been updated.',
      });

      queryClient.invalidateQueries({ queryKey: ['departments'] });
      return true;
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
        description: 'Department has been removed from the system.',
      });

      queryClient.invalidateQueries({ queryKey: ['departments'] });
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


  return {
    departments,
    loading,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}
