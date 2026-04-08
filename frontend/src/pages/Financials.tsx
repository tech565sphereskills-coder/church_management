import { useState, useMemo, useEffect } from 'react';
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
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { SuccessAnimation } from '@/components/ui/SuccessAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { FunctionalPagination } from '@/components/common/FunctionalPagination';

export default function Financials() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Success!');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('income');
  
  // Date range filtering
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  useEffect(() => {
    document.title = 'Financial Dashboard | RCCG Emmanuel Sanctuary';
  }, []);

  const { 
    contributions, 
    expenses, 
    budgets,
    pledges,
    loading, 
    summary,
    expenseSummary,
    contributionsCount,
    contributionsPages,
    expensesCount,
    expensesPages,
    createContribution, 
    updateContribution, 
    deleteContribution,
    createExpense,
    updateExpense,
    deleteExpense,
    generateReceipt
  } = useFinancials({
    page: currentPage,
    search: debouncedSearch,
    type: typeFilter,
    start_date: startDate,
    end_date: endDate
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, typeFilter, startDate, endDate, activeTab]);

  const stats = useMemo(() => {
    const totalIncome = summary.reduce((acc, curr) => acc + curr.total, 0);
    const totalExpenses = expenseSummary.reduce((acc, curr) => acc + curr.total, 0);
    
    const totalTithes = summary
      .find(s => s.contribution_type === 'tithe')?.total || 0;
    
    const totalOfferings = summary
      .find(s => s.contribution_type === 'offering')?.total || 0;
      
    const netPosition = totalIncome - totalExpenses;
    
    return { totalIncome, totalExpenses, totalTithes, totalOfferings, netPosition };
  }, [summary, expenseSummary]);

  const budgetStats = useMemo(() => {
    const currentBudgets = budgets.filter(b => {
      const now = new Date();
      return b.month === (now.getMonth() + 1) && b.year === now.getFullYear();
    });

    return currentBudgets.map(b => {
      let actual = 0;
      if (b.budget_type === 'income_target') {
        actual = summary
          .filter(s => b.category.toLowerCase() === 'all' || s.contribution_type.toLowerCase() === b.category.toLowerCase())
          .reduce((acc, curr) => acc + curr.total, 0);
      } else {
        actual = expenseSummary
          .filter(s => b.category.toLowerCase() === 'all' || s.category.toLowerCase() === b.category.toLowerCase())
          .reduce((acc, curr) => acc + curr.total, 0);
      }
      return { 
        ...b, 
        actual, 
        percentage: Math.min(Math.round((actual / parseFloat(b.amount)) * 100), 100) 
      };
    });
  }, [budgets, summary, expenseSummary]);

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
      const params = {
        start_date: startDate,
        end_date: endDate,
        search: debouncedSearch,
        contribution_type: typeFilter !== 'all' ? typeFilter : undefined
      };
      const response = await api.get(endpoint, { params, responseType: 'blob' });
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

  if (loading && !contributions.length && !expenses.length) {
    return (
      <div className="min-h-screen">
        <Header title="Financials" subtitle="Track tithes and offerings" />
        <div className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
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
        <div className="mb-8 flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-600">Period:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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

        <div className="mb-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5 shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-200 mb-4">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600/80">Total Income</p>
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
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600/80">Tithes Collected</p>
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
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600/80">Total Expenses</p>
            <p className="text-2xl font-black text-rose-900">{formatCurrency(stats.totalExpenses)}</p>
          </motion.div>
        </div>

        <FinancialCharts contributions={contributions} expenses={expenses} />

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mt-8">
          <div className="flex flex-col sm:flex-row flex-1 items-start sm:items-center gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder={`Search ${activeTab === 'performance' ? 'targets' : 'transactions'}...`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 shadow-sm rounded-xl border-slate-200 w-full" 
              />
            </div>
            {activeTab !== 'performance' && (
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-44 h-11 rounded-xl shadow-sm border-slate-200 bg-white">
                  <Filter className="h-4 w-4 mr-2 text-slate-400" />
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
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-none h-11 rounded-xl shadow-sm bg-white">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            {activeTab === 'income' && (
              <Button onClick={() => { setEditingContribution(null); setIsDialogOpen(true); }} className="btn-gold flex-1 sm:flex-none h-11 rounded-xl shadow-lg">
                <Plus className="mr-2 h-4 w-4" /> Record Payment
              </Button>
            )}
            {activeTab === 'expenses' && (
              <Button onClick={() => { setEditingExpense(null); setIsExpenseDialogOpen(true); }} className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg flex-1 sm:flex-none h-11 rounded-xl">
                <Plus className="mr-2 h-4 w-4" /> Record Expense
              </Button>
            )}
            {activeTab === 'performance' && (
              <Button onClick={() => setIsBudgetDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex-1 sm:flex-none h-11 rounded-xl font-bold">
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
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="py-5 font-bold">Date</TableHead>
                      <TableHead className="font-bold">Member / Source</TableHead>
                      <TableHead className="font-bold">Type</TableHead>
                      <TableHead className="font-bold">Method</TableHead>
                      <TableHead className="text-center font-bold">Actions</TableHead>
                      <TableHead className="text-right pr-8 font-bold">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contributions.map((c) => (
                      <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-medium text-slate-500 py-4">
                          {format(parseISO(c.date), 'dd MMM, yyyy')}
                        </TableCell>
                        <TableCell className="font-bold text-slate-900">
                          {c.member_name || <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400">Anonymous</Badge>}
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
                          <div className="flex justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditContribution(c)} className="h-9 w-9 p-0 text-slate-400 hover:text-blue-600"><Edit2 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => generateReceipt(c.id)} className="h-9 w-9 p-0 text-slate-400 hover:text-emerald-600"><Printer className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteContribution(c.id)} className="h-9 w-9 p-0 text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-black pr-8 whitespace-nowrap">
                          {formatCurrency(parseFloat(c.amount))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View for Income */}
              <div className="grid gap-4 p-4 md:hidden">
                {contributions.map((c) => (
                  <div key={c.id} className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{format(parseISO(c.date), 'dd MMM, yyyy')}</p>
                        <h4 className="font-black text-slate-800 text-lg leading-tight truncate">
                          {c.member_name || <span className="text-slate-300 italic font-medium">Anonymous</span>}
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge className="text-[9px] h-5 bg-blue-50 text-blue-600 border-none uppercase px-2 font-black">
                            {c.contribution_type.replace('_', ' ')}
                          </Badge>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {c.payment_method.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-xl font-black text-emerald-600 leading-none">{formatCurrency(parseFloat(c.amount))}</p>
                      </div>
                    </div>
                    <div className="flex justify-end items-center pt-4 border-t border-slate-50 mt-2 gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => generateReceipt(c.id)} 
                          className="h-10 px-3 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs gap-2"
                        >
                          <Printer className="h-4 w-4" />
                          Receipt
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditContribution(c)} 
                          className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteContribution(c.id)} 
                          className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </div>
                ))}
              </div>

              {contributions.length === 0 && !loading && (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                  <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Banknote className="h-10 w-10 text-slate-200" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800">No Revenue Records</h3>
                  <p className="text-slate-500 max-w-xs mx-auto mt-2 text-sm font-medium">There are no financial records matching your current selection.</p>
                </div>
              )}

              <div className="p-4 border-t">
                <FunctionalPagination 
                  currentPage={currentPage}
                  totalPages={contributionsPages}
                  onPageChange={setCurrentPage}
                  isLoading={loading}
                />
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="expenses">
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-premium"
            >
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="py-5 font-bold">Date</TableHead>
                      <TableHead className="font-bold">Description</TableHead>
                      <TableHead className="font-bold">Category</TableHead>
                      <TableHead className="text-center font-bold">Actions</TableHead>
                      <TableHead className="text-right pr-8 font-bold">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((e) => (
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
                          <div className="flex justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditExpense(e)} className="h-9 w-9 p-0 text-slate-400 hover:text-blue-600"><Edit2 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(e.id)} className="h-9 w-9 p-0 text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-black text-rose-600 pr-8 whitespace-nowrap">
                          {formatCurrency(parseFloat(e.amount))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View for Expenses */}
              <div className="grid gap-4 p-4 md:hidden">
                {expenses.map((e) => (
                  <div key={e.id} className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{format(parseISO(e.date), 'dd MMM, yyyy')}</p>
                        <h4 className="font-black text-slate-800 text-lg leading-tight truncate">{e.description}</h4>
                        <div className="flex items-center gap-2 mt-2">
                           <Badge variant="outline" className="text-[9px] h-5 border-slate-200 text-slate-600 uppercase px-2 font-black italic">
                            {e.category.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-xl font-black text-rose-600 leading-none">{formatCurrency(parseFloat(e.amount))}</p>
                      </div>
                    </div>
                    <div className="flex justify-end items-center pt-4 border-t border-slate-50 mt-2 gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditExpense(e)} 
                        className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteExpense(e.id)} 
                        className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {expenses.length === 0 && !loading && (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                  <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <ArrowDownCircle className="h-10 w-10 text-slate-200" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800">No Expenditure Records</h3>
                  <p className="text-slate-500 max-w-xs mx-auto mt-2 text-sm font-medium">There are no expense records matching your current selection.</p>
                </div>
              )}

              <div className="p-4 border-t">
                <FunctionalPagination 
                  currentPage={currentPage}
                  totalPages={expensesPages}
                  onPageChange={setCurrentPage}
                  isLoading={loading}
                />
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="performance">
             <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                {budgetStats.length === 0 && (
                   <div className="md:col-span-2 py-20 text-center flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 px-4">
                      <Target className="h-12 w-12 text-slate-200 mb-4" />
                      <h3 className="text-lg font-black text-slate-800">No Active Budget Goals</h3>
                      <p className="text-slate-500 max-w-xs mx-auto mt-2 text-sm font-medium">Set financial targets to track income and expenditure performance.</p>
                      <Button onClick={() => setIsBudgetDialogOpen(true)} className="mt-6 btn-gold h-12 px-8 rounded-xl font-black">Create First Goal</Button>
                   </div>
                )}
                {budgetStats.map((b) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-100 shadow-premium"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${b.budget_type === 'income_target' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {b.budget_type === 'income_target' ? <ArrowUpCircle className="h-5 w-5" /> : <ArrowDownCircle className="h-5 w-5" />}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm sm:text-base">{b.category}</h4>
                          <p className="text-[10px] font-bold text-slate-400 capitalize">{b.budget_type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <Badge className={`${b.percentage >= 100 ? 'bg-emerald-500' : 'bg-slate-900'} text-[10px] sm:text-xs`}>{b.percentage}%</Badge>
                    </div>

                    <div className="space-y-3">
                       <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:items-center text-[10px] font-black uppercase tracking-widest">
                          <span className="text-slate-400">Current Progress</span>
                          <span className="text-slate-900">{formatCurrency(b.actual)} / {formatCurrency(parseFloat(b.amount))}</span>
                       </div>
                       <Progress value={b.percentage} className="h-2.5 rounded-full" />
                    </div>
                  </motion.div>
                ))}
             </div>
          </TabsContent>
        </Tabs>
      </div>

      <ContributionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={editingContribution || undefined}
        onSave={async (data) => {
          const result = editingContribution 
            ? await updateContribution(editingContribution.id, data)
            : await createContribution(data);
          
          if (result) {
            setSuccessMessage(editingContribution ? 'Contribution updated!' : 'Record added successfully!');
            setShowSuccess(true);
          }
          return result;
        }}
      />

      <ExpenseDialog
        open={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
        initialData={editingExpense || undefined}
        onSave={async (data) => {
          const success = editingExpense
            ? await updateExpense(editingExpense.id, data)
            : await createExpense(data);

          if (success) {
            setSuccessMessage(editingExpense ? 'Expense record updated!' : 'Expense recorded successfully!');
            setShowSuccess(true);
          }
          return success;
        }}
      />

      <BudgetDialog
        open={isBudgetDialogOpen}
        onOpenChange={(open) => {
          setIsBudgetDialogOpen(open);
          if (!open && !loading) {
            // This is a hacky way to show success since BudgetDialog doesn't have onSave
            // but the user just closed it (hopefully after saving)
          }
        }}
      />

      <SuccessAnimation 
        isVisible={showSuccess} 
        onClose={() => setShowSuccess(false)} 
        message={successMessage}
      />
    </div>
  );
}
