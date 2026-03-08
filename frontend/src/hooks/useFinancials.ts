import { useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export type ContributionType = 'tithe' | 'offering' | 'welfare' | 'building_fund' | 'thanksgiving' | 'seeds' | 'donation' | 'other';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'pos' | 'cheque' | 'online';
export type ExpenseCategory = 'maintenance' | 'utilities' | 'salary' | 'projects' | 'administration' | 'outreach' | 'purchase' | 'other';

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

export interface Budget {
  id: string;
  category: string;
  amount: string;
  month: number;
  year: number;
  budget_type: 'income_target' | 'expense_limit';
}

export interface Pledge {
  id: string;
  member: string;
  member_name: string;
  amount: string;
  target_date: string;
  purpose: string;
  is_fulfilled: boolean;
  notes?: string;
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
      return response.data as Contribution[];
    },
    enabled: !!user,
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const response = await api.get('/expenses/');
      return response.data as Expense[];
    },
    enabled: !!user,
  });

  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const response = await api.get('/budgets/');
      return response.data as Budget[];
    },
    enabled: !!user,
  });

  const { data: pledges = [], isLoading: pledgesLoading } = useQuery({
    queryKey: ['pledges'],
    queryFn: async () => {
      const response = await api.get('/pledges/');
      return response.data as Pledge[];
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

  const loading = contributionsLoading || expensesLoading || summaryLoading || budgetsLoading || pledgesLoading;
  const summary = summaryData?.contributions || [];
  const expenseSummary = summaryData?.expenses || [];

  const createContribution = async (data: Partial<Contribution>) => {
    try {
      const response = await api.post('/contributions/', data);
      toast({ title: 'Record Saved', description: 'Contribution has been recorded successfully.' });
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

  const createBudget = async (data: Partial<Budget>) => {
    try {
      const response = await api.post('/budgets/', data);
      toast({ title: 'Budget Set', description: 'Budget target has been saved.' });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      return response.data;
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to set budget', variant: 'destructive' });
      return null;
    }
  };

  const createPledge = async (data: Partial<Pledge>) => {
    try {
      const response = await api.post('/pledges/', data);
      toast({ title: 'Pledge Recorded', description: 'Member commitment has been saved.' });
      queryClient.invalidateQueries({ queryKey: ['pledges'] });
      return response.data;
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save pledge', variant: 'destructive' });
      return null;
    }
  };

  const updatePledge = async (id: string, data: Partial<Pledge>) => {
    try {
      const response = await api.patch(`/pledges/${id}/`, data);
      toast({ title: 'Pledge Updated', description: 'Pledge status has been updated.' });
      queryClient.invalidateQueries({ queryKey: ['pledges'] });
      return response.data;
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update pledge', variant: 'destructive' });
      return null;
    }
  };

  const generateReceipt = async (id: string) => {
    try {
      const response = await api.get(`/contributions/${id}/generate_receipt/`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast({ title: 'Error', description: 'Failed to generate PDF receipt', variant: 'destructive' });
    }
  };

  const fetchSummary = useCallback(async (month?: number, year?: number) => {
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
    budgets,
    pledges,
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
    createBudget,
    createPledge,
    updatePledge,
    generateReceipt,
  };
}
