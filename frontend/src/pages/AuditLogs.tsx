import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  RefreshCcw, 
  User as UserIcon,
  Activity,
  Calendar as CalendarIcon,
  Info,
  ArrowRight
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { useAuditLogs, AuditLog } from '@/hooks/useAuditLogs';
import { useDebounce } from '@/hooks/useDebounce';
import { FunctionalPagination } from '@/components/common/FunctionalPagination';
import { AuditLogDetailDialog } from '@/components/admin/AuditLogDetailDialog';
import { MetaManager } from '@/components/common/MetaManager';

export default function AuditLogs() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data: logData, isLoading: loading, refetch } = useAuditLogs(currentPage, debouncedSearch, actionFilter);

  const logs = logData?.results || [];
  const totalCount = logData?.count || 0;
  const totalPages = Math.ceil(totalCount / 20); // 20 is PAGE_SIZE for audit logs


  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, actionFilter]);

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'create': return <Badge className="bg-emerald-500 hover:bg-emerald-600 font-bold uppercase tracking-tighter text-white">Created</Badge>;
      case 'update': return <Badge className="bg-blue-500 hover:bg-blue-600 font-bold uppercase tracking-tighter text-white">Updated</Badge>;
      case 'delete': return <Badge className="bg-rose-500 hover:bg-rose-600 font-bold uppercase tracking-tighter text-white">Deleted</Badge>;
      case 'export': return <Badge className="bg-amber-500 hover:bg-amber-600 font-bold uppercase tracking-tighter text-white">Export</Badge>;
      case 'login': return <Badge className="bg-indigo-500 hover:bg-indigo-600 font-bold uppercase tracking-tighter text-white">Login</Badge>;
      default: return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background/50">
      <MetaManager title="Audit Logs" description="Church administrative activity and security audit trail." />
      <Header title="Administrative Audit Logs" />
      
      <main className="flex-1 p-4 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative">
                <CardContent className="p-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-indigo-100 mb-1">Total Logs</p>
                            <h2 className="text-3xl font-black">{totalCount}</h2>
                        </div>
                    </div>
                </CardContent>
                <div className="absolute -bottom-8 -right-8 h-32 w-32 bg-white/10 rounded-full blur-3xl" />
            </Card>

            <Card className="border-none shadow-sm bg-card">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Action Status</p>
                            <h2 className="text-3xl font-black text-foreground">Active</h2>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-card">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <RefreshCcw className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Server Connectivity</p>
                            <h2 className="text-3xl font-black text-foreground">Linked</h2>
                        </div>
                    </div>
                </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden border-none shadow-sm bg-card lg:p-4">
            <CardContent className="p-0">
              <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between border-b border-border">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input 
                    placeholder="Search logs..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 rounded-xl border-slate-200 focus:ring-primary shadow-none"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-[180px] h-11 rounded-xl border-slate-200 bg-slate-50/50">
                      <Filter className="h-4 w-4 mr-2 text-slate-400" />
                      <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="create">Created</SelectItem>
                      <SelectItem value="update">Updated</SelectItem>
                      <SelectItem value="delete">Deleted</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="export">Export</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="icon" onClick={() => refetch()} className="h-11 w-11 rounded-xl border-slate-200">
                    <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
                  </Button>
                </div>
              </div>

              <div className="px-0 py-2">
                <div className="hidden md:block overflow-x-auto px-6 py-2">
                  <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-slate-50">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Administrator</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Resource</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Reference</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="animate-pulse">
                                    <TableCell colSpan={5} className="h-16 bg-slate-50/50 rounded-lg" />
                                </TableRow>
                            ))
                        ) : logs.length > 0 ? (
                            logs.map((log) => (
                                <TableRow 
                                  key={log.id} 
                                  onClick={() => setSelectedLog(log)}
                                  className="group hover:bg-slate-50/50 transition-colors border-slate-50 cursor-pointer"
                                >
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-foreground">
                                                {format(parseISO(log.timestamp), 'h:mm a')}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                                {format(parseISO(log.timestamp), 'dd MMM yyyy')}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                <UserIcon className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <span className="text-sm font-black text-foreground">{log.user_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getActionBadge(log.action)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter h-5 bg-white">
                                                    {log.model_name}
                                                </Badge>
                                                <ArrowRight className="h-3 w-3 text-slate-300" />
                                                <span className="text-sm font-bold text-foreground truncate max-w-[200px]">{log.object_name || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <code className="text-[10px] font-mono text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">
                                            {log.object_id ? `#${log.object_id.slice(0, 8)}` : 'SYS'}
                                        </code>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <Info className="h-12 w-12 text-slate-100 mb-4" />
                                        <p className="text-slate-400 font-bold italic">No activity logs found matching your criteria.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile View: Cards */}
                <div className="md:hidden space-y-4 px-6 pb-6">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-24 w-full bg-slate-50 animate-pulse rounded-xl" />
                        ))
                    ) : logs.length > 0 ? (
                        logs.map((log) => (
                            <div 
                              key={log.id} 
                              onClick={() => setSelectedLog(log)}
                              className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm space-y-3 cursor-pointer"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                            <UserIcon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <span className="text-sm font-black text-slate-700">{log.user_name}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400">{format(parseISO(log.timestamp), 'dd MMM, HH:mm')}</p>
                                        <div className="mt-1">{getActionBadge(log.action)}</div>
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50/50 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter h-4 bg-white">
                                            {log.model_name}
                                        </Badge>
                                        <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{log.object_name || 'N/A'}</span>
                                    </div>
                                    <code className="text-[9px] font-mono text-slate-400">
                                        {log.object_id ? `#${log.object_id.slice(0, 8)}` : 'SYS'}
                                    </code>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-10 text-center">
                            <Info className="h-10 w-10 text-slate-100 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm font-bold">No results found.</p>
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t">
                  <FunctionalPagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    isLoading={loading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <AuditLogDetailDialog 
        log={selectedLog} 
        open={!!selectedLog} 
        onOpenChange={(open) => !open && setSelectedLog(null)} 
      />
    </div>
  );
}
