import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Banknote, 
  Plus, 
  Search, 
  Download,
  Calendar,
  Wallet,
  TrendingUp,
  CreditCard,
  Filter,
  ArrowDownCircle,
  ArrowUpCircle,
  Scale,
  Edit2,
  Trash2,
  AlertTriangle,
  Receipt,
  Target,
  ChevronRight,
  Printer
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { useFinancials, Contribution, Expense, Budget } from '@/hooks/useFinancials';
import { ContributionDialog } from '@/components/financials/ContributionDialog';
import { ExpenseDialog } from '@/components/financials/ExpenseDialog';
import { BudgetDialog } from '@/components/financials/BudgetDialog';
import { FinancialCharts } from '@/components/financials/FinancialCharts';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { SuccessAnimation } from '@/components/ui/SuccessAnimation';

export default function Financials() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Success!');
  const { 
    contributions, 
    expenses, 
    budgets,
    pledges,
    loading, 
    createContribution, 
    updateContribution, 
    deleteContribution,
    createExpense,
    updateExpense,
    deleteExpense,
    generateReceipt
  } = useFinancials();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('income');
  
  // Date range filtering
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const filteredContributions = useMemo(() => {
    return contributions.filter((c) => {
      const date = parseISO(c.date);
      const inRange = isWithinInterval(date, { 
        start: parseISO(startDate), 
        end: parseISO(endDate) 
      });
      
      const matchesSearch = 
        c.member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'all' || c.contribution_type === typeFilter;
      
      return inRange && matchesSearch && matchesType;
    });
  }, [contributions, searchQuery, typeFilter, startDate, endDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const date = parseISO(e.date);
      const inRange = isWithinInterval(date, { 
        start: parseISO(startDate), 
        end: parseISO(endDate) 
      });

      const matchesSearch = 
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'all' || e.category === typeFilter;
      
      return inRange && matchesSearch && matchesType;
    });
  }, [expenses, searchQuery, typeFilter, startDate, endDate]);

  const stats = useMemo(() => {
    const totalIncome = filteredContributions.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    
    const totalTithes = filteredContributions
      .filter(c => c.contribution_type === 'tithe')
      .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    
    const totalOfferings = filteredContributions
      .filter(c => c.contribution_type === 'offering')
      .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
      
    const netPosition = totalIncome - totalExpenses;
    
    return { totalIncome, totalExpenses, totalTithes, totalOfferings, netPosition };
  }, [filteredContributions, filteredExpenses]);

  const budgetStats = useMemo(() => {
    const currentBudgets = budgets.filter(b => {
      const now = new Date();
      return b.month === (now.getMonth() + 1) && b.year === now.getFullYear();
    });

    return currentBudgets.map(b => {
      let actual = 0;
      if (b.budget_type === 'income_target') {
        actual = contributions
          .filter(c => {
            const d = parseISO(c.date);
            return (d.getMonth() + 1) === b.month && d.getFullYear() === b.year && 
                   (b.category.toLowerCase() === 'all' || c.contribution_type.toLowerCase() === b.category.toLowerCase());
          })
          .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
      } else {
        actual = expenses
          .filter(e => {
            const d = parseISO(e.date);
            return (d.getMonth() + 1) === b.month && d.getFullYear() === b.year && 
                   (b.category.toLowerCase() === 'all' || e.category.toLowerCase() === b.category.toLowerCase());
          })
          .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
      }
      return { 
        ...b, 
        actual, 
        percentage: Math.min(Math.round((actual / parseFloat(b.amount)) * 100), 100) 
      };
    });
  }, [budgets, contributions, expenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExport = async () => {
    try {
      const endpoint = activeTab === 'income' ? '/contributions/export_excel/' : '/expenses/export_excel/';
      const filename = activeTab === 'income' ? 'income_report.xlsx' : 'expense_report.xlsx';
      const response = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed', error);
    }
  };

  const handleEditContribution = (c: Contribution) => {
    setEditingContribution(c);
    setIsDialogOpen(true);
  };

  const handleDeleteContribution = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this contribution? This action cannot be undone.')) {
      await deleteContribution(id);
    }
  };

  const handleEditExpense = (e: Expense) => {
    setEditingExpense(e);
    setIsExpenseDialogOpen(true);
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense record? This action cannot be undone.')) {
      await deleteExpense(id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Financials" subtitle="Track tithes and offerings" />
        <div className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <Header title="Financials" subtitle="Track tithes and offerings" />

      <div className="p-6">
        {/* Date Filter Bar */}
        <div className="mb-8 flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-600">Period:</span>
          </div>
          <div className="flex items-center gap-3">
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40 h-9 text-sm rounded-lg"
            />
            <span className="text-slate-300">to</span>
            <Input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40 h-9 text-sm rounded-lg"
            />
          </div>
          <div className="h-4 w-[1px] bg-slate-200 hidden md:block" />
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
                setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
              }}
              className="text-[10px] uppercase font-bold tracking-wider"
            >
              This Month
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                const prev = subMonths(new Date(), 1);
                setStartDate(format(startOfMonth(prev), 'yyyy-MM-dd'));
                setEndDate(format(endOfMonth(prev), 'yyyy-MM-dd'));
              }}
              className="text-[10px] uppercase font-bold tracking-wider"
            >
              Last Month
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5 shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-200 mb-4">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600/80">Income</p>
            <p className="text-2xl font-black text-emerald-900">{formatCurrency(stats.totalIncome)}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-blue-100 bg-blue-50/30 p-5 shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 shadow-lg shadow-blue-200 mb-4">
              <Banknote className="h-6 w-6 text-white" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600/80">Tithes</p>
            <p className="text-2xl font-black text-blue-900">{formatCurrency(stats.totalTithes)}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-amber-100 bg-amber-50/30 p-5 shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 shadow-lg shadow-amber-200 mb-4">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600/80">Offerings</p>
            <p className="text-2xl font-black text-amber-900">{formatCurrency(stats.totalOfferings)}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-rose-100 bg-rose-50/30 p-5 shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500 shadow-lg shadow-rose-200 mb-4">
              <ArrowDownCircle className="h-6 w-6 text-white" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600/80">Expenses</p>
            <p className="text-2xl font-black text-rose-900">{formatCurrency(stats.totalExpenses)}</p>
          </motion.div>
        </div>

        {/* Analytics Section */}
        <FinancialCharts contributions={filteredContributions} expenses={filteredExpenses} />

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder={`Search ${activeTab === 'performance' ? 'targets' : 'transactions'}...`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 shadow-sm rounded-xl border-slate-200" 
              />
            </div>
            {activeTab !== 'performance' && (
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-44 h-11 rounded-xl shadow-sm border-slate-200">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {activeTab === 'income' ? (
                    <>
                      <SelectItem value="tithe">Tithe</SelectItem>
                      <SelectItem value="offering">Offering</SelectItem>
                      <SelectItem value="welfare">Welfare</SelectItem>
                      <SelectItem value="building_fund">Building Fund</SelectItem>
                      <SelectItem value="thanksgiving">Thanksgiving</SelectItem>
                      <SelectItem value="seeds">Seeds</SelectItem>
                      <SelectItem value="donation">Donation</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="salary">Salary / Welfare</SelectItem>
                      <SelectItem value="projects">Church Projects</SelectItem>
                      <SelectItem value="administration">Administration</SelectItem>
                      <SelectItem value="outreach">Outreach</SelectItem>
                      <SelectItem value="purchase">Purchases / Equipment</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} className="h-11 rounded-xl shadow-sm">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            {activeTab === 'income' && (
              <Button onClick={() => { setEditingContribution(null); setIsDialogOpen(true); }} className="btn-gold h-11 rounded-xl shadow-lg">
                <Plus className="mr-2 h-4 w-4" /> Record Payment
              </Button>
            )}
            {activeTab === 'expenses' && (
              <Button onClick={() => { setEditingExpense(null); setIsExpenseDialogOpen(true); }} className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg h-11 rounded-xl">
                <Plus className="mr-2 h-4 w-4" /> Record Expense
              </Button>
            )}
            {activeTab === 'performance' && (
              <Button onClick={() => setIsBudgetDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg h-11 rounded-xl font-bold">
                <Target className="mr-2 h-4 w-4" /> New Budget Goal
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg h-12 bg-slate-100 p-1 mb-8 rounded-2xl shadow-inner">
            <TabsTrigger value="income" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">Revenue</TabsTrigger>
            <TabsTrigger value="expenses" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-md text-rose-600 transition-all">Outgoings</TabsTrigger>
            <TabsTrigger value="performance" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-md text-indigo-600 transition-all">Budgeting</TabsTrigger>
          </TabsList>

          <TabsContent value="income">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-premium"
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="font-bold py-5">Date</TableHead>
                      <TableHead className="font-bold">Member / Source</TableHead>
                      <TableHead className="font-bold">Type</TableHead>
                      <TableHead className="font-bold">Method</TableHead>
                      <TableHead className="text-center font-bold">Actions</TableHead>
                      <TableHead className="text-right font-bold pr-8">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContributions.map((c) => (
                      <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-medium text-slate-500 py-4">
                          {format(parseISO(c.date), 'dd MMM, yyyy')}
                        </TableCell>
                        <TableCell className="font-bold text-slate-900">
                          {c.member_name || <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400">Anonymous Contribution</Badge>}
                        </TableCell>
                        <TableCell>
                          <Badge className="capitalize bg-blue-50 text-blue-600 border-none px-3 py-1 font-bold">
                            {c.contribution_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize text-slate-500 font-medium">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-slate-300" />
                            {c.payment_method.replace('_', ' ')}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditContribution(c)}
                              className="h-9 w-9 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => generateReceipt(c.id)}
                              className="h-9 w-9 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Print Receipt"
                            >
                              <Receipt className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteContribution(c.id)}
                              className="h-9 w-9 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-black text-emerald-600 text-lg pr-8">
                          {formatCurrency(parseFloat(c.amount))}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredContributions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-40 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <ArrowUpCircle className="h-10 w-10 mb-2 opacity-20" />
                            <p className="font-semibold">No income records found for this period</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="expenses">
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-premium"
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="font-bold py-5">Date</TableHead>
                      <TableHead className="font-bold">Description</TableHead>
                      <TableHead className="font-bold">Category</TableHead>
                      <TableHead className="text-center font-bold">Actions</TableHead>
                      <TableHead className="text-right font-bold pr-8">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((e) => (
                      <TableRow key={e.id} className="hover:bg-rose-50/20 transition-colors">
                        <TableCell className="font-medium text-slate-500 py-4">
                          {format(parseISO(e.date), 'dd MMM, yyyy')}
                        </TableCell>
                        <TableCell className="font-bold text-slate-900">
                          {e.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize border-slate-200 text-slate-600 px-3 py-1 font-semibold">
                            {e.category.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditExpense(e)}
                              className="h-9 w-9 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpense(e.id)}
                              className="h-9 w-9 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-black text-rose-600 text-lg pr-8">
                          {formatCurrency(parseFloat(e.amount))}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredExpenses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-40 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <ArrowDownCircle className="h-10 w-10 mb-2 opacity-20" />
                            <p className="font-semibold">No expenditure records found for this period</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="performance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-500" />
                  Monthly Performance Results
                </h3>
                {budgetStats.length === 0 ? (
                  <Card className="border-dashed border-2 p-12 text-center bg-slate-50/50">
                    <p className="text-slate-400 font-medium">No active budget targets for this month.</p>
                    <Button 
                      variant="link" 
                      onClick={() => setIsBudgetDialogOpen(true)}
                      className="mt-2 text-indigo-600 font-bold"
                    >
                      Set your first goal +
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {budgetStats.map((budget) => (
                      <motion.div 
                        key={budget.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 rounded-2xl bg-white border border-slate-100 shadow-premium"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={budget.budget_type === 'income_target' ? 'bg-emerald-50 text-emerald-600 border-none' : 'bg-amber-50 text-amber-600 border-none'}>
                                {budget.budget_type === 'income_target' ? 'Revenue Goal' : 'Expense Limit'}
                              </Badge>
                              <span className="text-sm font-bold text-slate-800 capitalize">{budget.category}</span>
                            </div>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                              Current Month Performance
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
                            <p className={`text-sm font-black ${budget.percentage >= 100 ? 'text-emerald-500' : 'text-indigo-500'}`}>
                              {budget.percentage}% Reached
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-bold text-slate-700">{formatCurrency(budget.actual)}</span>
                            <span className="text-slate-400">Target: {formatCurrency(parseFloat(budget.amount))}</span>
                          </div>
                          <Progress 
                            value={budget.percentage} 
                            className={`h-2 ${budget.budget_type === 'income_target' ? 'bg-emerald-50' : 'bg-amber-100'}`}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Scale className="h-40 w-40" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-6">Financial Insights</h3>
                  
                  <div className="space-y-8">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <ArrowUpCircle className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-1">Net Flow</p>
                        <p className="text-3xl font-black">{formatCurrency(stats.netPosition)}</p>
                        <p className="text-white/40 text-xs mt-1">Difference between current income and expenses</p>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                      <h4 className="font-bold mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        Professional Advice
                      </h4>
                      <ul className="space-y-3 text-sm text-white/70">
                        <li className="flex gap-2">
                          <ChevronRight className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span>Focus on increasing member pledges to ensure stable monthly revenue.</span>
                        </li>
                        <li className="flex gap-2">
                          <ChevronRight className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span>Ensure all utilities are paid within the first week to avoid late fees.</span>
                        </li>
                        <li className="flex gap-2">
                          <ChevronRight className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span>Current tithe-to-offering ratio is healthy for sustainable growth.</span>
                        </li>
                      </ul>
                    </div>

                    <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold h-12 rounded-xl">
                      Generate Full Treasury Report
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ContributionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={async (data) => {
          const res = await (editingContribution ? updateContribution(editingContribution.id, data) : createContribution(data));
          if (res) {
            setSuccessMessage(editingContribution ? 'Record Updated!' : 'Record Saved!');
            setShowSuccess(true);
          }
          return res;
        }}
        initialData={editingContribution || undefined}
      />

      <ExpenseDialog
        open={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
        onSave={async (data) => {
          const res = await (editingExpense ? updateExpense(editingExpense.id, data) : createExpense(data));
          if (res) {
            setSuccessMessage(editingExpense ? 'Expense Updated!' : 'Expense Recorded!');
            setShowSuccess(true);
          }
          return res;
        }}
        initialData={editingExpense || undefined}
      />

      <BudgetDialog 
        open={isBudgetDialogOpen}
        onOpenChange={setIsBudgetDialogOpen}
      />
      <SuccessAnimation 
        isVisible={showSuccess} 
        onClose={() => setShowSuccess(false)} 
        message={successMessage}
      />
    </div>
  );
}
