import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, TrendingUp, Calendar, MessageSquare, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function HODDashboard() {
  const navigate = useNavigate();
  const { hodDepartments } = useAuth();
  
  const departmentName = hodDepartments[0]?.name || 'Department';

  const { data: hodStats, isLoading } = useQuery({
    queryKey: ['hod-stats'],
    queryFn: async () => {
      // For now, since backend get_queryset filters by dept for HOD, 
      // we can call the standard stats and it will be filtered.
      const response = await api.get('/stats/quick_stats/');
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title={`${departmentName} Dashboard`} subtitle="Loading..." />
        <div className="p-6 space-y-6">
          <Skeleton className="h-64 rounded-2xl" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title={`${departmentName} Portal`}
        subtitle="Manage your team and track departmental growth."
      />

      <div className="flex-1 p-4 md:p-6 space-y-8 max-w-7xl mx-auto w-full">
        <WelcomeCard />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Team Members" value={hodStats?.totalMembers || 0} icon={Users} delay={0.1} />
          <StatCard title="Active Today" value={hodStats?.todayAttendance || 0} icon={UserCheck} variant="primary" delay={0.2} />
          <StatCard title="New Joiners" value={hodStats?.firstTimers || 0} icon={TrendingUp} variant="accent" delay={0.3} />
          <StatCard title="Avg. Attendance" value={hodStats?.averageAttendance || 0} icon={Calendar} delay={0.4} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mt-8">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Department Roster</CardTitle>
                <CardDescription>Quick overview of your team members.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/members')}>
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {/* Quick List Placeholder */}
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
                  Use the "Members" page for full roster management.
                </p>
                <Button className="w-full bg-primary/10 text-primary hover:bg-primary/20" onClick={() => navigate('/members')}>
                  Go to Member List
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-200">
              <CardHeader>
                <CardTitle className="text-lg">Broadcast Message</CardTitle>
                <CardDescription>Send an update to your whole team instantly.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => navigate('/messaging')}>
                  <MessageSquare className="mr-2 h-4 w-4" /> Message Department
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Follow-up Needed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Check members who missed recent services.
                </p>
                <Button className="w-full variant-outline" onClick={() => navigate('/follow-up')}>
                  Open Follow-up List
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
