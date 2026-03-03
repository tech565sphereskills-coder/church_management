import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Child {
  id: string;
  full_name: string;
  gender: 'male' | 'female';
  date_of_birth: string;
  allergies: string | null;
  parent_1: string;
  parent_2: string | null;
  parent_1_name?: string;
  parent_2_name?: string;
  emergency_contact: string | null;
  check_in_code: string;
  created_at: string;
  updated_at: string;
}

export interface ChildCheckIn {
  id: string;
  child: string;
  child_name?: string;
  service: string;
  service_name?: string;
  checked_in_at: string;
  checked_out_at: string | null;
  checked_in_by: string;
}

export function useChildren() {
  const [children, setChildren] = useState<Child[]>([]);
  const [checkIns, setCheckIns] = useState<ChildCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchChildren = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/children/');
      setChildren(response.data);
    } catch (error) {
      console.error('Error fetching children:', error);
      toast({
        title: 'Error',
        description: 'Failed to load children data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchCheckIns = useCallback(async () => {
    try {
      const response = await api.get('/child-checkins/');
      setCheckIns(response.data);
    } catch (error) {
      console.error('Error fetching child check-ins:', error);
    }
  }, []);

  const createChild = async (data: Partial<Child>) => {
    try {
      const response = await api.post('/children/', data);
      toast({
        title: 'Child Registered',
        description: `${data.full_name} has been added to the system.`,
      });
      await fetchChildren();
      return response.data;
    } catch (error) {
      console.error('Error registering child:', error);
      toast({
        title: 'Registration Failed',
        description: 'Failed to add child to the system.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const checkInChild = async (childId: string, serviceId: string) => {
    try {
      const response = await api.post('/child-checkins/', { child: childId, service: serviceId });
      toast({
        title: 'Checked In',
        description: 'Child has been checked in successfully.',
      });
      await fetchCheckIns();
      return response.data;
    } catch (error) {
      console.error('Error checking in child:', error);
      toast({
        title: 'Check-in Failed',
        description: 'Failed to process check-in.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const checkOutChild = async (checkInId: string) => {
    try {
      await api.post(`/child-checkins/${checkInId}/checkout/`);
      toast({
        title: 'Checked Out',
        description: 'Child has been checked out successfully.',
      });
      await fetchCheckIns();
      return true;
    } catch (error) {
      console.error('Error checking out child:', error);
      toast({
        title: 'Check-out Failed',
        description: 'Failed to process check-out.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchChildren();
      fetchCheckIns();
    }
  }, [user, fetchChildren, fetchCheckIns]);

  return {
    children,
    checkIns,
    loading,
    fetchChildren,
    fetchCheckIns,
    createChild,
    checkInChild,
    checkOutChild,
  };
}
