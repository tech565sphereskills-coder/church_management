import { useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export type ContributionType = 'tithe' | 'offering' | 'welfare' | 'building_fund' | 'thanksgiving' | 'seeds' | 'other';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'pos' | 'cheque' | 'online';
export type ExpenseCategory = 'maintenance' | 'utilities' | 'salary' | 'projects' | 'administration' | 'outreach' | 'other';

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

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: string;
  date: string;
  recorded_by: number;
  recorded_by_name?: string;
  notes: string | null;
  created_at: string;
}

export interface ExpenseSummary {
  category: ExpenseCategory;
  total: number;
}

export function useFinancials() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Queries
  const { data: contributions = [], isLoading: contributionsLoading } = useQuery({
    queryKey: ['contributions'],
    queryFn: async () => {
      const response = await api.get('/contributions/');
      return response.data;
    },
    enabled: !!user,
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const response = await api.get('/expenses/');
      return response.data;
    },
    enabled: !!user,
  });

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: async () => {
      const [contResp, expResp] = await Promise.all([
        api.get('/contributions/summary/'),
        api.get('/expenses/summary/')
      ]);
      return {
        contributions: contResp.data as ContributionSummary[],
        expenses: expResp.data as ExpenseSummary[]
      };
    },
    enabled: !!user,
  });

  const loading = contributionsLoading || expensesLoading || summaryLoading;
  const summary = summaryData?.contributions || [];
  const expenseSummary = summaryData?.expenses || [];

  const createContribution = async (data: Partial<Contribution>) => {
    try {
      const response = await api.post('/contributions/', data);
      toast({ title: 'Record Saved', description: 'Contribution has been recorded successfully.' });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      return response.data;
    } catch (error) {
      console.error('Error creating contribution:', error);
      toast({ title: 'Error', description: 'Failed to save record', variant: 'destructive' });
      return null;
    }
  };

  const createExpense = async (data: Partial<Expense>) => {
    try {
      const response = await api.post('/expenses/', data);
      toast({ title: 'Expense Recorded', description: 'Outgoing has been recorded successfully.' });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      return response.data;
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({ title: 'Error', description: 'Failed to save expense record', variant: 'destructive' });
      return null;
    }
  };

  const fetchSummary = useCallback(async (month?: number, year?: number) => {
    // This function can now be used for custom filtering if needed, 
    // though the default useQuery handles the basic case.
    const params: Record<string, number> = {};
    if (month) params.month = month;
    if (year) params.year = year;
    
    const [contResp, expResp] = await Promise.all([
      api.get('/contributions/summary/', { params }),
      api.get('/expenses/summary/', { params })
    ]);
    return {
      contributions: contResp.data as ContributionSummary[],
      expenses: expResp.data as ExpenseSummary[]
    };
  }, []);

  const updateContribution = async (id: string, data: Partial<Contribution>) => {
    try {
      const response = await api.patch(`/contributions/${id}/`, data);
      toast({ title: 'Record Updated', description: 'Contribution has been updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      return response.data;
    } catch (error) {
      console.error('Error updating contribution:', error);
      toast({ title: 'Error', description: 'Failed to update record', variant: 'destructive' });
      return null;
    }
  };

  const deleteContribution = async (id: string) => {
    try {
      await api.delete(`/contributions/${id}/`);
      toast({ title: 'Record Deleted', description: 'Contribution has been deleted.' });
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      return true;
    } catch (error) {
      console.error('Error deleting contribution:', error);
      toast({ title: 'Error', description: 'Failed to delete record', variant: 'destructive' });
      return false;
    }
  };

  const updateExpense = async (id: string, data: Partial<Expense>) => {
    try {
      const response = await api.patch(`/expenses/${id}/`, data);
      toast({ title: 'Expense Updated', description: 'Record has been updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      return response.data;
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({ title: 'Error', description: 'Failed to update expense', variant: 'destructive' });
      return null;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await api.delete(`/expenses/${id}/`);
      toast({ title: 'Expense Deleted', description: 'Record has been deleted.' });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({ title: 'Error', description: 'Failed to delete expense', variant: 'destructive' });
      return false;
    }
  };

  return {
    contributions,
    expenses,
    loading,
    summary,
    expenseSummary,
    fetchSummary,
    createContribution,
    updateContribution,
    deleteContribution,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}
