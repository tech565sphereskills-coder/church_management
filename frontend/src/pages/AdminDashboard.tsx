import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, UserPlus, TrendingUp, AlertTriangle, UserX, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { AttendanceChart } from '@/components/dashboard/AttendanceChart';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { ServiceComparisonChart } from '@/components/dashboard/ServiceComparisonChart';
import { MostConsistentMembers } from '@/components/dashboard/MostConsistentMembers';
import { BirthdayCelebrants } from '@/components/dashboard/BirthdayCelebrants';
import { useAuth } from '@/hooks/useAuth';
import { useFollowUp } from '@/hooks/useFollowUp';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DepartmentDistribution } from '@/components/dashboard/DepartmentDistribution';
import { ActivityStream } from '@/components/dashboard/ActivityStream';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { followUpList } = useFollowUp();
  
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await api.get('/stats/quick_stats/');
      const qStats = response.data;
      return {
        todayAttendance: qStats.todayAttendance || 0,
        totalMembers: qStats.totalMembers,
        activeMembers: qStats.activeMembers,
        newThisMonth: qStats.firstTimers,
        inactiveMembers: qStats.inactiveMembers,
        totalTithes: qStats.totalTithes,
        totalOfferings: qStats.totalOfferings,
      };
    },
    enabled: !!user,
  });

  const { data: deptData = [], isLoading: deptLoading } = useQuery({
    queryKey: ['stats', 'departments'],
    queryFn: async () => {
      const response = await api.get('/stats/department_distribution/');
      return response.data;
    },
    enabled: !!user,
  });

  const { data: weeklyData = [] } = useQuery({
    queryKey: ['attendance', 'weekly'],
    queryFn: async () => {
      const response = await api.get('/attendance/weekly/');
      return response.data;
    },
    enabled: !!user,
  });

  const { data: recentAttendance = [] } = useQuery({
    queryKey: ['attendance', 'recent'],
    queryFn: async () => {
      const response = await api.get('/attendance/recent/');
      return response.data;
    },
    enabled: !!user,
  });

  const stats = dashboardStats || {
    todayAttendance: 0,
    totalMembers: 0,
    activeMembers: 0,
    newThisMonth: 0,
    inactiveMembers: 0,
    totalTithes: 0,
    totalOfferings: 0,
  };

  const loading = statsLoading || deptLoading;
  const isInitialLoading = loading && !dashboardStats;

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Dashboard" subtitle="Loading..." />
        <div className="p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!dashboardStats && statsLoading === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <Card className="max-w-md w-full border-red-100 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-900">Connection Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-slate-600">
              We couldn't load the church statistics. This could be due to a server connection issue or an expired session.
            </p>
            <div className="pt-2">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Refresh Dashboard
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Dashboard"
        subtitle={`Welcome back${role ? `, ${role.replace('_', ' ')}` : ''}. Here's your church overview.`}
      />

      <div className="flex-1 p-4 md:p-8 space-y-10 max-w-7xl mx-auto w-full">
        <WelcomeCard />
        
        {/* Stats Grid — Optimized for Mobile Density (2 cols on xs) */}
        <div className="grid gap-4 md:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard title="Total Members" value={stats.totalMembers} icon={Users} delay={0} />
          <StatCard title="Active Members" value={stats.activeMembers} icon={UserCheck} variant="primary" delay={0.1} />
          <div className="relative group">
            <StatCard title="Live Attendance" value={stats.todayAttendance} icon={TrendingUp} delay={0.2} />
            {stats.todayAttendance > 0 && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 z-20">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Live</span>
              </div>
            )}
          </div>
          <StatCard title="New This Month" value={stats.newThisMonth} icon={UserPlus} variant="accent" delay={0.3} />
          <StatCard title="Inactive Members" value={stats.inactiveMembers} icon={UserX} delay={0.4} />
        </div>

        {/* Financial Summary Stats */}
        <div className="mt-8 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
          <StatCard 
            title="Total Tithes (Current Month)" 
            value={`\u20a6${stats.totalTithes?.toLocaleString() || '0'}`} 
            icon={TrendingUp} 
            variant="primary"
            delay={0.5} 
          />
          <StatCard 
            title="Total Offerings (Current Month)" 
            value={`\u20a6${stats.totalOfferings?.toLocaleString() || '0'}`} 
            icon={TrendingUp} 
            variant="accent"
            delay={0.6} 
          />
        </div>

        {/* Follow-up Alert */}
        {followUpList.length > 0 && (
          <div 
            className="mt-6 flex cursor-pointer items-center gap-4 rounded-xl border border-warning/30 bg-warning/10 p-4 transition-colors hover:bg-warning/20"
            onClick={() => navigate('/follow-up')}
          >
            <AlertTriangle className="h-6 w-6 text-warning" />
            <div>
              <p className="font-semibold text-warning">
                {followUpList.length} member{followUpList.length !== 1 ? 's' : ''} need{followUpList.length === 1 ? 's' : ''} follow-up
              </p>
              <p className="text-sm text-muted-foreground">
                Click to view members who missed 2+ consecutive services
              </p>
            </div>
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AttendanceChart data={weeklyData} title="Weekly Attendance Trend" />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>

        {/* Charts Row 2 — Service Comparison + Distribution */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <ServiceComparisonChart />
          <DepartmentDistribution data={deptData} />
        </div>

        {/* Third Row — Consistent Members + Birthdays */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
             <MostConsistentMembers />
          </div>
          <div className="space-y-6">
            <BirthdayCelebrants />
          </div>
        </div>

        {/* Recent Activity Stream */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ActivityStream />
          </div>
          <div className="space-y-6">
            <Card className="border-slate-100 shadow-premium overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming Services
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {[
                    { day: 'Sunday', time: '8:00 AM', name: 'First Service', type: 'Full' },
                    { day: 'Sunday', time: '10:30 AM', name: 'Second Service', type: 'Full' },
                    { day: 'Wednesday', time: '6:00 PM', name: 'Midweek Service', type: 'Interactive' },
                  ].map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors group">
                      <div>
                        <p className="font-bold text-slate-800 group-hover:text-primary transition-colors">{service.name}</p>
                        <p className="text-xs font-medium text-slate-400 capitalize">{service.day} at {service.time}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-black border-slate-200 text-slate-500">{service.type}</Badge>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-primary/5">
                   <p className="text-[10px] font-black text-primary uppercase tracking-widest text-center">Sanctuary Doors Open 30m Prior</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
