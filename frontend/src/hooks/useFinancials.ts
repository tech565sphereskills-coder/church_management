import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ContributionSummary[]>([]);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary[]>([]);
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

  const fetchExpenses = useCallback(async () => {
    try {
      const response = await api.get('/expenses/');
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  }, []);

  const fetchSummary = useCallback(async (month?: number, year?: number) => {
    try {
      const params: Record<string, number> = {};
      if (month) params.month = month;
      if (year) params.year = year;
      
      const [contResp, expResp] = await Promise.all([
        api.get('/contributions/summary/', { params }),
        api.get('/expenses/summary/', { params })
      ]);
      setSummary(contResp.data);
      setExpenseSummary(expResp.data);
    } catch (error) {
      console.error('Error fetching financial summaries:', error);
    }
  }, []);

  const createContribution = async (data: Partial<Contribution>) => {
    try {
      const response = await api.post('/contributions/', data);
      toast({ title: 'Record Saved', description: 'Contribution has been recorded successfully.' });
      await Promise.all([fetchContributions(), fetchSummary()]);
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
      await Promise.all([fetchExpenses(), fetchSummary()]);
      return response.data;
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({ title: 'Error', description: 'Failed to save expense record', variant: 'destructive' });
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchContributions(),
        fetchExpenses(),
        fetchSummary()
      ]).finally(() => setLoading(false));
    }
  }, [user, fetchContributions, fetchExpenses, fetchSummary]);

  return {
    contributions,
    expenses,
    loading,
    summary,
    expenseSummary,
    fetchContributions,
    fetchExpenses,
    fetchSummary,
    createContribution,
    createStatus: createExpense, // Shortcut naming
    createExpense,
  };
}
