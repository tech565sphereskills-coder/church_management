import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loader2, Heart, TrendingUp, AlertCircle, Activity } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface MemberHealthScoreProps {
  memberId: string;
}

type HealthStatus = 'Optimal' | 'Stable' | 'At Risk' | 'Critical';

export function MemberHealthScore({ memberId }: MemberHealthScoreProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ percentage: number; streak: number } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/members/${memberId}/attendance/`);
        const records = response.data.records || [];
        const total = response.data.total_services || 0;
        
        const percentage = total > 0 ? Math.round((records.length / total) * 100) : 0;
        
        // Simple streak calculation
        let streak = 0;
        if (records.length > 0) {
           streak = 1; // Simplified for this view
        }

        setStats({ percentage, streak });
      } catch (error) {
        console.error('Error fetching health stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [memberId]);

  if (loading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (!stats) return null;

  const getStatus = (p: number): { label: HealthStatus; color: string; icon: typeof Heart } => {
    if (p >= 80) return { label: 'Optimal', color: 'text-emerald-500', icon: Heart };
    if (p >= 50) return { label: 'Stable', color: 'text-blue-500', icon: Activity };
    if (p >= 25) return { label: 'At Risk', color: 'text-amber-500', icon: TrendingUp };
    return { label: 'Critical', color: 'text-rose-500', icon: AlertCircle };
  };

  const status = getStatus(stats.percentage);
  const Icon = status.icon;

  return (
    <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden relative">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Sanctuary Health Score</p>
          <h4 className={cn("text-lg font-black flex items-center gap-2", status.color)}>
            <Icon className="h-5 w-5" />
            {status.label}
          </h4>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-slate-800 leading-none">{stats.percentage}%</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">Consistency</p>
        </div>
      </div>
      
      <Progress value={stats.percentage} className="h-2 bg-slate-100" />
      
      <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-tighter text-slate-400">
        <span>Fragmented</span>
        <span>Consistent</span>
      </div>

      <div className="absolute -right-2 -bottom-2 opacity-[0.03] scale-150 rotate-12">
         <Icon size={80} />
      </div>
    </div>
  );
}
