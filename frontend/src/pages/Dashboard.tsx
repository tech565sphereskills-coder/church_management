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
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { members, loading: membersLoading } = useMembers();
  const { getAttendanceStats } = useAttendance();
  const { followUpList } = useFollowUp();
  
  const [stats, setStats] = useState({
    todayAttendance: 0,
    totalMembers: 0,
    activeMembers: 0,
    newThisMonth: 0,
    inactiveMembers: 0,
  });
  const [weeklyData, setWeeklyData] = useState<{ date: string; attendance: number }[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<{
    id: string;
    marked_at: string;
    members: {
      id: string;
      full_name: string;
      department: string | null;
    };
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        const attendanceStats = await getAttendanceStats();
        
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const newThisMonth = members.filter(m => 
          new Date(m.created_at) >= startOfMonth
        ).length;

        const inactiveMembers = members.filter(m => m.status === 'inactive').length;

        setStats({
          ...attendanceStats,
          newThisMonth,
          inactiveMembers,
        });

        // Fetch weekly attendance data from backend
        const weeklyResponse = await api.get('/attendance/weekly/');
        setWeeklyData(weeklyResponse.data);

        // Fetch recent attendance from backend
        const recentResponse = await api.get('/attendance/recent/');
        setRecentAttendance(recentResponse.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!membersLoading) {
      fetchDashboardData();
    }
  }, [user, members, membersLoading, getAttendanceStats]);

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading || membersLoading) {
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

  return (
    <div className="min-h-screen">
      <Header
        title="Dashboard"
        subtitle={`Welcome back${role ? `, ${role.replace('_', ' ')}` : ''}. Here's your church overview.`}
      />

      <div className="p-6">
        <WelcomeCard />
        
        {/* Stats Grid — 5 cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Total Members" value={stats.totalMembers} icon={Users} delay={0} />
          <StatCard title="Active Members" value={stats.activeMembers} icon={UserCheck} variant="primary" delay={0.1} />
          <StatCard title="Today's Attendance" value={stats.todayAttendance} icon={TrendingUp} delay={0.2} />
          <StatCard title="New This Month" value={stats.newThisMonth} icon={UserPlus} variant="accent" delay={0.3} />
          <StatCard title="Inactive Members" value={stats.inactiveMembers} icon={UserX} delay={0.4} />
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

        {/* Charts Row 2 — Service Comparison + Most Consistent */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ServiceComparisonChart />
          </div>
          <div className="space-y-6">
            <BirthdayCelebrants />
            <MostConsistentMembers />
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
