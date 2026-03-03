import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import {
  useMonthlyAttendanceData, useMemberGrowthData, useDepartmentDistribution, useQuickStats,
} from '@/hooks/useAttendanceHistory';
import { Download, FileSpreadsheet, Loader2, Printer, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const COLORS = [
  'hsl(210, 80%, 35%)',
  'hsl(145, 70%, 35%)',
  'hsl(0, 75%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(210, 70%, 50%)',
];

export default function Reports() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState<string | null>(null);
  
  const { data: monthlyData, loading: monthlyLoading } = useMonthlyAttendanceData();
  const { data: growthData, loading: growthLoading } = useMemberGrowthData();
  const { data: departmentData, loading: departmentLoading } = useDepartmentDistribution();
  const { stats, loading: statsLoading } = useQuickStats();

  const exportAttendanceCSV = async () => {
    try {
      setExporting('attendance');
      const response = await api.get('/attendance/export/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      toast({ title: 'Export Complete', description: `Attendance records exported successfully.` });
    } catch (error: any) {
      toast({ title: 'Export Failed', description: 'Failed to export attendance records', variant: 'destructive' });
    } finally { setExporting(null); }
  };

  const exportMembersCSV = async () => {
    try {
      setExporting('members');
      const response = await api.get('/members/export/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `members-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      toast({ title: 'Export Complete', description: `Members exported successfully.` });
    } catch (error: any) {
      toast({ title: 'Export Failed', description: 'Failed to export members', variant: 'destructive' });
    } finally { setExporting(null); }
  };

  const exportPDF = () => {
    toast({ title: 'Generating PDF', description: 'Opening print dialog for PDF export...' });
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="min-h-screen">
      <Header title="Reports & Analytics" subtitle="Church growth and attendance insights" />

      <div className="p-6">
        {/* Export Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap gap-3">
          <Button variant="outline" onClick={exportAttendanceCSV} disabled={exporting !== null}>
            {exporting === 'attendance' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
            Export Attendance CSV
          </Button>
          <Button variant="outline" onClick={exportMembersCSV} disabled={exporting !== null}>
            {exporting === 'members' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export Members CSV
          </Button>
          <Button variant="outline" onClick={exportPDF} className="print:hidden">
            <FileText className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="print:hidden">
            <Printer className="mr-2 h-4 w-4" /> Print Report
          </Button>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Attendance */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="chart-container">
            <h3 className="mb-4 text-lg font-semibold">Monthly Attendance</h3>
            <div className="h-72">
              {monthlyLoading ? (
                <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="attendance" fill="hsl(210, 80%, 35%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Member Growth with New vs Returning */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="chart-container">
            <h3 className="mb-4 text-lg font-semibold">Member Growth (New vs Returning)</h3>
            <div className="h-72">
              {growthLoading ? (
                <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="totalMembers" stroke="hsl(210, 80%, 35%)" strokeWidth={2} dot={{ fill: 'hsl(210, 80%, 35%)' }} name="Total Members" />
                    <Line type="monotone" dataKey="newMembers" stroke="hsl(145, 70%, 35%)" strokeWidth={2} dot={{ fill: 'hsl(145, 70%, 35%)' }} name="New Members" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Department Distribution */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="chart-container">
            <h3 className="mb-4 text-lg font-semibold">Members by Department</h3>
            <div className="h-72">
              {departmentLoading ? (
                <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : departmentData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">No department data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={departmentData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {departmentData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="chart-container">
            <h3 className="mb-4 text-lg font-semibold">Quick Insights</h3>
            {statsLoading ? (
              <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <span className="text-muted-foreground">Average Attendance</span>
                  <span className="text-2xl font-bold">{stats.averageAttendance}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <span className="text-muted-foreground">Retention Rate</span>
                  <span className="text-2xl font-bold text-rccg-green">{stats.retentionRate}%</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <span className="text-muted-foreground">First Timer Conversion</span>
                  <span className="text-2xl font-bold text-primary">{stats.firstTimerConversion}%</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <span className="text-muted-foreground">Inactive Members</span>
                  <span className="text-2xl font-bold text-destructive">{stats.inactiveMembers}</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
