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
  date_joined: string;
  
  ordained_as: 'deacon' | 'deaconess' | 'full_pastor' | null;
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
  ordained_as?: string;
  year_ordination?: number;
  
  status?: MemberStatus;
  invited_by?: string;
}

export function useMembers() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: members = [], isLoading, refetch } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const response = await api.get('/members/');
      return response.data;
    },
    enabled: !!user,
  });

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
    } catch (error: any) {
      console.error('Error creating member:', error);
      if (error.response?.data?.phone) {
        toast({
          title: 'Duplicate Phone Number',
          description: 'A member with this phone number already exists.',
          variant: 'destructive',
        });
      } else if (error.response?.data?.non_field_errors) {
        toast({
          title: 'Duplicate Registration',
          description: error.response.data.non_field_errors[0],
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

  return {
    members,
    loading,
    fetchMembers,
    searchMembers,
    searchByQRCode,
    createMember,
    updateMember,
    deleteMember,
  };
}
