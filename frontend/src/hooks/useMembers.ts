import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export type MemberStatus = 'active' | 'inactive' | 'first_timer';
export type Gender = 'male' | 'female';

export interface Member {
  id: string;
  surname: string;
  firstname: string;
  other_name: string | null;
  full_name: string;
  phone: string;
  gender: Gender;
  email: string | null;
  address: string | null;
  date_of_birth: string | null;
  
  marital_status: 'single' | 'married' | 'widowed' | 'divorced';
  spouse_full_name: string | null;
  spouse_phone_number: string | null;
  
  church_membership: 'worker' | 'minister' | null;
  departments: string[];
  department_names?: string[];
  department_post: string | null;
  family: string | null;
  family_name?: string;
  
  year_joined: number | null;
  year_joined_workforce: number | null;
  date_joined: string;
  
  is_ordained: boolean;
  ordained_as: 'deacon' | 'deaconess' | 'minister' | 'assistant_pastor' | 'full_pastor' | null;
  year_ordination: number | null;
  
  qr_code: string | null;
  status: MemberStatus;
  invited_by: string | null;
  photo_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewMemberData {
  surname: string;
  firstname: string;
  other_name?: string;
  phone: string;
  gender: Gender;
  email?: string;
  address?: string;
  date_of_birth?: string;
  
  marital_status?: string;
  spouse_full_name?: string;
  spouse_phone_number?: string;
  
  church_membership?: string;
  departments?: string[];
  department_post?: string;
  family?: string;
  
  year_joined?: number;
  year_joined_workforce?: number;
  is_ordained?: boolean;
  ordained_as?: string;
  year_ordination?: number;
  
  status?: MemberStatus;
  invited_by?: string;
}

export interface PaginatedMembers {
  count: number;
  next: string | null;
  previous: string | null;
  results: Member[];
}

export function useMembers(page: number = 1, search: string = '', status: string = 'all') {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['members', page, search, status],
    queryFn: async () => {
      const params: Record<string, string | number> = { page };
      if (search) params.search = search;
      if (status && status !== 'all') params.status = status;
      
      const response = await api.get<PaginatedMembers>('/members/', { params });
      return response.data;
    },
    enabled: !!user,
  });

  const members = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / 20); // 20 is the default PAGE_SIZE in settings.py

  const fetchMembers = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const loading = isLoading;


  const searchMembers = async (query: string): Promise<Member[]> => {
    if (!query.trim()) return [];
    
    try {
      const response = await api.get('/members/', {
        params: { search: query }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching members:', error);
      return [];
    }
  };

  const searchByQRCode = async (qrCode: string): Promise<Member | null> => {
    try {
      const response = await api.get('/members/', {
        params: { qr_code: qrCode }
      });
      return response.data[0] || null;
    } catch (error) {
      console.error('Error searching by QR code:', error);
      return null;
    }
  };

  const createMember = async (memberData: NewMemberData): Promise<Member | null> => {
    try {
      const response = await api.post('/members/', memberData);

      toast({
        title: 'Member Created',
        description: `${memberData.surname} ${memberData.firstname} has been registered successfully.`,
      });

      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      return response.data;
    } catch (error: unknown) {
      console.error('Error creating member:', error);
      const err = error as { response?: { data?: { phone?: unknown, non_field_errors?: string[] } } };
      if (err.response?.data?.phone) {
        toast({
          title: 'Duplicate Phone Number',
          description: 'A member with this phone number already exists.',
          variant: 'destructive',
        });
      } else if (err.response?.data?.non_field_errors) {
        toast({
          title: 'Duplicate Registration',
          description: err.response.data.non_field_errors[0],
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create member',
          variant: 'destructive',
        });
      }
      return null;
    }
  };

  const updateMember = async (id: string, updates: Partial<NewMemberData & { status: MemberStatus }>): Promise<boolean> => {
    try {
      await api.patch(`/members/${id}/`, updates);

      toast({
        title: 'Member Updated',
        description: 'Member information has been updated.',
      });

      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      return true;
    } catch (error) {
      console.error('Error updating member:', error);
      toast({
        title: 'Error',
        description: 'Failed to update member',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteMember = async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/members/${id}/`);

      toast({
        title: 'Member Deleted',
        description: 'Member has been removed from the system.',
      });

      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      return true;
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete member',
        variant: 'destructive',
      });
      return false;
    }
  };

  const exportMembers = async (): Promise<void> => {
    try {
      const response = await api.get('/members/export_excel/', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `members_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({
        title: 'Export Successful',
        description: 'Members list has been exported to Excel.',
      });
    } catch (error) {
      console.error('Error exporting members:', error);
      toast({
        title: 'Export Failed',
        description: 'Could not export members list.',
        variant: 'destructive',
      });
    }
  };

  const importMembers = async (file: File): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await api.post('/members/import_members/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast({
        title: 'Import Successful',
        description: 'Member data has been updated from the file.',
      });
      return true;
    } catch (error) {
      console.error('Error importing members:', error);
      toast({
        title: 'Import Failed',
        description: 'Please check your file format and try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    members,
    totalCount,
    totalPages,
    loading,
    fetchMembers,
    searchMembers,
    searchByQRCode,
    createMember,
    updateMember,
    deleteMember,
    exportMembers,
    importMembers,
  };
}
