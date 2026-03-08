import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  UserCircle2, 
  TrendingUp, 
  PieChart as PieChartIcon,
  Search,
  Download,
  Mail,
  Phone
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useDepartments } from '@/hooks/useDepartments';
import { useMembers } from '@/hooks/useMembers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = [
  'hsl(210, 80%, 35%)',
  'hsl(145, 70%, 35%)',
  'hsl(0, 75%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(210, 70%, 50%)',
  'hsl(280, 60%, 45%)',
];

export default function DepartmentReports() {
  const { departments, loading: deptsLoading } = useDepartments();
  const { members, loading: membersLoading } = useMembers();
  const [searchQuery, setSearchQuery] = useState('');

  const chartData = useMemo(() => {
    return departments.map(d => ({
      name: d.name,
      value: d.member_count || 0
    })).sort((a, b) => b.value - a.value);
  }, [departments]);

  const filteredDepts = useMemo(() => {
    return departments.filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.hod_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [departments, searchQuery]);

  const totalMembers = useMemo(() => members.length, [members]);

  if (deptsLoading || membersLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Departmental Reports" subtitle="Detailed breakdown of church ministries" />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <Header title="Departmental Reports" subtitle="Detailed breakdown of church ministries" />

      <div className="p-6 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="rounded-2xl border-none shadow-sm bg-blue-50/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-blue-600 font-bold uppercase text-[10px] tracking-widest">Total Departments</CardDescription>
              <CardTitle className="text-3xl font-black text-blue-900">{departments.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-blue-600/70 font-medium">
                <Building2 className="h-3 w-3 mr-1" />
                Active Ministries
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm bg-green-50/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-green-600 font-bold uppercase text-[10px] tracking-widest">Total Assigned Members</CardDescription>
              <CardTitle className="text-3xl font-black text-green-900">
                {departments.reduce((acc, d) => acc + (d.member_count || 0), 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-green-600/70 font-medium">
                <Users className="h-3 w-3 mr-1" />
                Includes multiple assignments
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm bg-amber-50/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-amber-600 font-bold uppercase text-[10px] tracking-widest">HOD Assigned</CardDescription>
              <CardTitle className="text-3xl font-black text-amber-900">
                {departments.filter(d => d.head_of_department).length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-amber-600/70 font-medium">
                <UserCircle2 className="h-3 w-3 mr-1" />
                Of {departments.length} Departments
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm bg-indigo-50/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-indigo-600 font-bold uppercase text-[10px] tracking-widest">Growth Rate</CardDescription>
              <CardTitle className="text-3xl font-black text-indigo-900">12%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-indigo-600/70 font-medium">
                <TrendingUp className="h-3 w-3 mr-1" />
                Average monthly increase
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="rounded-2xl shadow-sm border-slate-100 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 italic">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-primary" />
                    Member Distribution
                  </CardTitle>
                  <CardDescription>Size of each department relative to church</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={chartData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={80} 
                      outerRadius={120} 
                      paddingAngle={5} 
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm border-slate-100 overflow-hidden">
             <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Departmental Strength
                  </CardTitle>
                  <CardDescription>Absolute member count per department</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} fontSize={11} fontWeight="bold" stroke="#64748b" />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed HOD & Stats Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Ministry Leadership & Stats</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Search leadership..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 rounded-full bg-white border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDepts.map((dept) => {
              const hod = members.find(m => m.id === dept.head_of_department);
              return (
                <motion.div 
                  key={dept.id}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="bg-slate-50 text-slate-500 font-bold text-[10px]">
                      {dept.member_count} Members
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-black text-slate-800 group-hover:text-primary transition-colors">{dept.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{dept.description || 'Dedicated church ministry.'}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden">
                         {hod?.photo ? (
                           <img src={hod.photo} className="h-full w-full object-cover" alt={hod.full_name} />
                         ) : (
                           <UserCircle2 className="h-5 w-5 text-indigo-400" />
                         )}
                       </div>
                       <div className="flex flex-col">
                         <span className="text-[10px] font-black uppercase text-indigo-400 leading-none">HOD</span>
                         <span className="text-sm font-bold text-slate-700 leading-tight">{dept.hod_name || 'Unassigned'}</span>
                       </div>
                    </div>
                    {hod && (
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-green-50 hover:text-green-600 transition-colors">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Global Action */}
        <div className="flex justify-center mt-12">
           <Button className="btn-gold rounded-full px-8 py-6 h-auto text-lg shadow-xl hover:scale-105 transition-transform">
             <Download className="mr-2 h-5 w-5" />
             Download Full Departmental Audit
           </Button>
        </div>
      </div>
    </div>
  );
}
