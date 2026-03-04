import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Users, UserCheck, UserPlus, TrendingUp, AlertTriangle, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { AttendanceChart } from '@/components/dashboard/AttendanceChart';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { ServiceComparisonChart } from '@/components/dashboard/ServiceComparisonChart';
import { MostConsistentMembers } from '@/components/dashboard/MostConsistentMembers';
import { BirthdayCelebrants } from '@/components/dashboard/BirthdayCelebrants';
import { useAttendance } from '@/hooks/useAttendance';
import { useMembers } from '@/hooks/useMembers';
import { useFollowUp } from '@/hooks/useFollowUp';
import { useAuth } from '@/hooks/useAuth';
import { useFinancials } from '@/hooks/useFinancials';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DepartmentDistribution } from '@/components/dashboard/DepartmentDistribution';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { getAttendanceStats } = useAttendance();
  const { followUpList } = useFollowUp();
  
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      try {
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
      } catch (error) {
        console.error('Dashboard Stats Error:', error);
        throw error;
      }
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

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
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

      <div className="flex-1 p-4 md:p-6 space-y-8 max-w-7xl mx-auto w-full">
        <WelcomeCard />
        
        {/* Stats Grid — 5 cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Total Members" value={stats.totalMembers} icon={Users} delay={0} />
          <StatCard title="Active Members" value={stats.activeMembers} icon={UserCheck} variant="primary" delay={0.1} />
          <StatCard title="Today's Attendance" value={stats.todayAttendance} icon={TrendingUp} delay={0.2} />
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

        {/* Recent Activity */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {recentAttendance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No attendance records yet</p>
              ) : (
                <div className="space-y-4">
                  {recentAttendance.map((record) => (
                    <div key={record.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(record.members?.full_name || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{record.members?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{record.members?.department || 'General'}</p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(record.marked_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { day: 'Sunday', time: '8:00 AM', name: 'First Service' },
                  { day: 'Sunday', time: '10:30 AM', name: 'Second Service' },
                  { day: 'Wednesday', time: '6:00 PM', name: 'Midweek Service' },
                ].map((service, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">{service.day} at {service.time}</p>
                    </div>
                    <div className="h-3 w-3 rounded-full bg-accent animate-pulse-glow" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
