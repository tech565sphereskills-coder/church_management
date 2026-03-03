import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export type ContributionType = 'tithe' | 'offering' | 'welfare' | 'building_fund' | 'thanksgiving' | 'seeds' | 'other';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'pos' | 'cheque' | 'online';

export interface Contribution {
  id: string;
  member: string | null;
  member_name?: string;
  amount: string;
  contribution_type: ContributionType;
  date: string;
  payment_method: PaymentMethod;
  recorded_by: number;
  recorded_by_name?: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContributionSummary {
  contribution_type: ContributionType;
  total: number;
}

export function useFinancials() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ContributionSummary[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchContributions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/contributions/');
      setContributions(response.data);
    } catch (error) {
      console.error('Error fetching contributions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load financial records',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchSummary = useCallback(async (month?: number, year?: number) => {
    try {
      const params: Record<string, number> = {};
      if (month) params.month = month;
      if (year) params.year = year;
      
      const response = await api.get('/contributions/summary/', { params });
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  }, []);

  const createContribution = async (data: Partial<Contribution>) => {
    try {
      const response = await api.post('/contributions/', data);
      toast({
        title: 'Record Saved',
        description: 'Contribution has been recorded successfully.',
      });
      await fetchContributions();
      await fetchSummary();
      return response.data;
    } catch (error) {
      console.error('Error creating contribution:', error);
      toast({
        title: 'Error',
        description: 'Failed to save record',
        variant: 'destructive',
      });
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      fetchContributions();
      fetchSummary();
    }
  }, [user, fetchContributions, fetchSummary]);

  return {
    contributions,
    loading,
    summary,
    fetchContributions,
    fetchSummary,
    createContribution,
  };
}
