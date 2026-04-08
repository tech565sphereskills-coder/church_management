import { formatDistanceToNow } from 'date-fns';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { 
  UserPlus, 
  UserMinus, 
  UserCheck, 
  LogIn, 
  FileUp, 
  Settings, 
  Activity,
  History,
  LucideIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const actionIcons: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  create: { icon: UserPlus, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  delete: { icon: UserMinus, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  update: { icon: UserCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  login: { icon: LogIn, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  export: { icon: FileUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
};

export function ActivityStream() {
  const { data, isLoading } = useAuditLogs(1); // Get first page

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const logs = data?.results || [];

  return (
    <Card className="border-slate-100 shadow-premium overflow-hidden h-full">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
        <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Real-time Activity
        </CardTitle>
        <Badge variant="outline" className="text-[10px] font-black border-slate-200 text-slate-400">Live</Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-50">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground italic">No activity recorded yet</div>
          ) : (
            logs.slice(0, 10).map((log) => {
              const meta = actionIcons[log.action] || { icon: Settings, color: 'text-slate-400', bg: 'bg-slate-100' };
              const Icon = meta.icon;
              
              return (
                <div key={log.id} className="p-4 hover:bg-slate-50/50 transition-all flex gap-3 group">
                  <div className={`h-10 w-10 min-w-[40px] rounded-xl ${meta.bg} flex items-center justify-center transition-transform group-hover:scale-105`}>
                    <Icon className={`h-5 w-5 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                       <p className="text-sm font-bold text-slate-800 line-clamp-1">{log.user_name || 'System'}</p>
                       <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-2">
                         {formatDistanceToNow(new Date(log.timestamp))} ago
                       </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                      {log.action.charAt(0).toUpperCase() + log.action.slice(1)}d {log.model_name.toLowerCase()} 
                      <span className="font-semibold text-slate-700 ml-1">"{log.object_name || log.object_id.substring(0, 8)}"</span>
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {logs.length > 0 && (
           <div className="p-4 bg-muted/5 text-center">
              <button 
                onClick={() => window.location.href = '/audit-logs'}
                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
              >
                View Professional Audit History
              </button>
           </div>
        )}
      </CardContent>
    </Card>
  );
}
