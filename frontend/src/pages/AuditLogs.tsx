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

interface AuditLog {
  id: string;
  user_name: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'export';
  model_name: string;
  object_id: string;
  object_name: string;
  details: Record<string, any>;
  timestamp: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/audit-logs/');
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.object_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.model_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'create': return <Badge className="bg-emerald-500 hover:bg-emerald-600 font-bold uppercase tracking-tighter">Created</Badge>;
      case 'update': return <Badge className="bg-blue-500 hover:bg-blue-600 font-bold uppercase tracking-tighter">Updated</Badge>;
      case 'delete': return <Badge className="bg-rose-500 hover:bg-rose-600 font-bold uppercase tracking-tighter">Deleted</Badge>;
      case 'export': return <Badge className="bg-amber-500 hover:bg-amber-600 font-bold uppercase tracking-tighter">Export</Badge>;
      case 'login': return <Badge className="bg-indigo-500 hover:bg-indigo-600 font-bold uppercase tracking-tighter">Login</Badge>;
      default: return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50/50 dark:bg-slate-950">
      <Header title="Administrative Audit Logs" />
      
      <main className="flex-1 p-4 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-none shadow-lg shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none bg-indigo-600 text-white overflow-hidden relative">
                <CardContent className="p-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-indigo-100 mb-1">Total Logs</p>
                            <h2 className="text-3xl font-black">{logs.length}</h2>
                        </div>
                    </div>
                </CardContent>
                <div className="absolute -bottom-8 -right-8 h-32 w-32 bg-white/10 rounded-full blur-3xl" />
            </Card>

            <Card className="border-none shadow-lg shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none bg-white">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Actions Today</p>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                                {logs.filter(l => format(parseISO(l.timestamp), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length}
                            </h2>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-lg shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none bg-white">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <RefreshCcw className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Status</p>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Active</h2>
                        </div>
                    </div>
                </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden border-none shadow-xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none bg-white lg:p-4">
            <CardContent className="p-0">
              <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between border-b border-slate-50 dark:border-slate-800">
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

                  <Button variant="outline" size="icon" onClick={fetchLogs} className="h-11 w-11 rounded-xl border-slate-200">
                    <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
                  </Button>
                </div>
              </div>

              <div className="px-6 py-2">
                <div className="overflow-x-auto">
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
                        ) : filteredLogs.length > 0 ? (
                            filteredLogs.map((log) => (
                                <TableRow key={log.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                {format(parseISO(log.timestamp), 'h:mm a')}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {format(parseISO(log.timestamp), 'dd MMM yyyy')}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                <UserIcon className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <span className="text-sm font-black text-slate-700 dark:text-slate-300">{log.user_name}</span>
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
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{log.object_name || 'N/A'}</span>
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
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
