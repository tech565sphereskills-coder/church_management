import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
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
  Scale
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
import { Badge } from '@/components/ui/badge';
import { useFinancials, Contribution, Expense } from '@/hooks/useFinancials';
import { ContributionDialog } from '@/components/financials/ContributionDialog';
import { ExpenseDialog } from '@/components/financials/ExpenseDialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function Financials() {
  const { contributions, expenses, loading, summary, createContribution, createExpense } = useFinancials();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('income');

  const filteredContributions = useMemo(() => {
    return contributions.filter((c) => {
      const matchesSearch = 
        c.member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'all' || c.contribution_type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [contributions, searchQuery, typeFilter]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch = 
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'all' || e.category === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [expenses, searchQuery, typeFilter]);

  const stats = useMemo(() => {
    const totalIncome = contributions.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const netPosition = totalIncome - totalExpenses;
    
    return { totalIncome, totalExpenses, netPosition };
  }, [contributions, expenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
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
    <div className="min-h-screen">
      <Header title="Financials" subtitle="Track tithes and offerings" />

      <div className="p-6">
        {/* Stats Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5 shadow-sm"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-200">
              <ArrowUpCircle className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600/80">Total Income</p>
              <p className="text-2xl font-black text-emerald-900">{formatCurrency(stats.totalIncome)}</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 rounded-2xl border border-rose-100 bg-rose-50/30 p-5 shadow-sm"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500 shadow-lg shadow-rose-200">
              <ArrowDownCircle className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-600/80">Expenditure</p>
              <p className="text-2xl font-black text-rose-900">{formatCurrency(stats.totalExpenses)}</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${stats.netPosition >= 0 ? 'bg-slate-900' : 'bg-orange-500'} shadow-lg`}>
              <Scale className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Position</p>
              <p className={`text-2xl font-black ${stats.netPosition >= 0 ? 'text-slate-900' : 'text-orange-600'}`}>{formatCurrency(stats.netPosition)}</p>
            </div>
          </motion.div>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder={`Search ${activeTab === 'income' ? 'transactions' : 'expenses'}...`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11" 
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44 h-11">
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
                  </>
                ) : (
                  <>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="salary">Salary / Welfare</SelectItem>
                    <SelectItem value="projects">Church Projects</SelectItem>
                    <SelectItem value="administration">Administration</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} className="h-11">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            {activeTab === 'income' ? (
              <Button onClick={() => setIsDialogOpen(true)} className="btn-gold h-11">
                <Plus className="mr-2 h-4 w-4" /> Record Payment
              </Button>
            ) : (
              <Button onClick={() => setIsExpenseDialogOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg h-11">
                <Plus className="mr-2 h-4 w-4" /> Record Expense
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md h-12 bg-slate-100 p-1 mb-6 rounded-xl">
            <TabsTrigger value="income" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Revenue / Income</TabsTrigger>
            <TabsTrigger value="expenses" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm text-rose-600">Expenditure / Outgoings</TabsTrigger>
          </TabsList>

          <TabsContent value="income">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Member / Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContributions.map((c) => (
                    <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-500">
                        {new Date(c.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">
                        {c.member_name || <Badge variant="outline" className="text-[10px] uppercase">Anonymous</Badge>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize bg-primary/5 text-primary border-none">
                          {c.contribution_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize text-slate-500 font-medium">
                        {c.payment_method.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="text-right font-black text-emerald-600">
                        {formatCurrency(parseFloat(c.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          </TabsContent>

          <TabsContent value="expenses">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((e) => (
                    <TableRow key={e.id} className="hover:bg-rose-50/30 transition-colors border-rose-100">
                      <TableCell className="font-medium text-slate-500">
                        {new Date(e.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">
                        {e.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize border-slate-200">
                          {e.category.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-black text-rose-600">
                        {formatCurrency(parseFloat(e.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-slate-400 font-medium">
                        No expenditure records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      <ContributionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={createContribution}
      />

      <ExpenseDialog
        open={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
        onSave={createExpense}
      />
    </div>
  );
}
