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
  Filter
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useFinancials, Contribution } from '@/hooks/useFinancials';
import { ContributionDialog } from '@/components/financials/ContributionDialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function Financials() {
  const { contributions, loading, summary, createContribution } = useFinancials();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredContributions = useMemo(() => {
    return contributions.filter((c) => {
      const matchesSearch = 
        c.member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (!c.member && searchQuery.toLowerCase().includes('anonymous'));
      
      const matchesType = typeFilter === 'all' || c.contribution_type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [contributions, searchQuery, typeFilter]);

  const stats = useMemo(() => {
    const total = contributions.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const tithes = contributions
      .filter(c => c.contribution_type === 'tithe')
      .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const offerings = contributions
      .filter(c => c.contribution_type === 'offering')
      .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    
    return { total, tithes, offerings };
  }, [contributions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/contributions/export_excel/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'financials_export.xlsx');
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.total)}</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
              <Wallet className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Tithes</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.tithes)}</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <CreditCard className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Offerings</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.offerings)}</p>
            </div>
          </motion.div>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search transactions..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10" 
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="tithe">Tithe</SelectItem>
                <SelectItem value="offering">Offering</SelectItem>
                <SelectItem value="welfare">Welfare</SelectItem>
                <SelectItem value="building_fund">Building Fund</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button onClick={() => setIsDialogOpen(true)} className="btn-gold">
              <Plus className="mr-2 h-4 w-4" /> Record Payment
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member / Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContributions.map((c, index) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {new Date(c.date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {c.member_name || (
                      <Badge variant="outline" className="text-xs font-normal">
                        Anonymous
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {c.contribution_type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">
                    {c.payment_method.replace('_', ' ')}
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {formatCurrency(parseFloat(c.amount))}
                  </TableCell>
                </TableRow>
              ))}
              {filteredContributions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </motion.div>
      </div>

      <ContributionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={createContribution}
      />
    </div>
  );
}
