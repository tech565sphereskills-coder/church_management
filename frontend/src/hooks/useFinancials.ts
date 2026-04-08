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

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface FinancialsParams {
  page?: number;
  search?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
}

export function useFinancials(params: FinancialsParams = {}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { page = 1, search = '', type = 'all', start_date, end_date } = params;

  // Contributions Query
  const { data: contributionsData, isLoading: contributionsLoading } = useQuery({
    queryKey: ['contributions', page, search, type, start_date, end_date],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = { page };
      if (search) queryParams.search = search;
      if (type && type !== 'all') queryParams.contribution_type = type;
      if (start_date) queryParams.start_date = start_date;
      if (end_date) queryParams.end_date = end_date;
      
      const response = await api.get<PaginatedResponse<Contribution>>('/contributions/', { params: queryParams });
      return response.data;
    },
    enabled: !!user,
  });

  // Expenses Query (Also paginated for professional feel)
  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', page, search, type, start_date, end_date],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = { page };
      if (search) queryParams.search = search;
      if (type && type !== 'all') queryParams.category = type;
      if (start_date) queryParams.start_date = start_date;
      if (end_date) queryParams.end_date = end_date;
      
      const response = await api.get<PaginatedResponse<Expense>>('/expenses/', { params: queryParams });
      return response.data;
    },
    enabled: !!user,
  });

  const contributions = contributionsData?.results || [];
  const contributionsCount = contributionsData?.count || 0;
  const contributionsPages = Math.ceil(contributionsCount / 10);

  const expenses = expensesData?.results || [];
  const expensesCount = expensesData?.count || 0;
  const expensesPages = Math.ceil(expensesCount / 10);

  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const response = await api.get('/budgets/');
      return (response.data.results || response.data) as Budget[];
    },
    enabled: !!user,
  });

  const { data: pledges = [], isLoading: pledgesLoading } = useQuery({
    queryKey: ['pledges'],
    queryFn: async () => {
      const response = await api.get('/pledges/');
      return (response.data.results || response.data) as Pledge[];
    },
    enabled: !!user,
  });

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['financial-summary', start_date, end_date],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      
      const [contResp, expResp] = await Promise.all([
        api.get('/contributions/summary/', { params }),
        api.get('/expenses/summary/', { params })
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
      toast({ title: 'Error', description: 'Failed to save expense record', variant: 'destructive' });
      return null;
    }
  };

  const updateContribution = async (id: string, data: Partial<Contribution>) => {
    try {
      const response = await api.patch(`/contributions/${id}/`, data);
      toast({ title: 'Record Updated', description: 'Contribution has been updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      return response.data;
    } catch (error) {
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
      return true;
    } catch (error) {
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
      return response.data;
    } catch (error) {
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
      return true;
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete expense', variant: 'destructive' });
      return false;
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
      toast({ title: 'Error', description: 'Failed to generate PDF receipt', variant: 'destructive' });
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
    createContribution,
    updateContribution,
    deleteContribution,
    createExpense,
    updateExpense,
    deleteExpense,
    generateReceipt,
    contributionsCount,
    contributionsPages,
    expensesCount,
    expensesPages,
  };
}

