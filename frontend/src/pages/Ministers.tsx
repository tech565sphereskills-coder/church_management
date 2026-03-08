import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Crown, 
  MoreVertical, 
  Trash2,
  ShieldCheck,
  UserCircle2,
  Settings2,
  Eye
} from 'lucide-react';
import { useDepartments } from '@/hooks/useDepartments';
import { useMembers, Member } from '@/hooks/useMembers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { MemberDetailsDialog } from '@/components/members/MemberDetailsDialog';

export default function Ministers() {
  const { departments, updateDepartment, loading: deptsLoading } = useDepartments();
  const { members, loading: membersLoading } = useMembers();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For View Details
  const [selectedLeader, setSelectedLeader] = useState<Member | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const leaders = useMemo(() => {
    const leaderList: any[] = [];
    
    departments.forEach(dept => {
      if (dept.head_of_department) {
        const member = members.find(m => m.id === dept.head_of_department);
        if (member) {
          leaderList.push({
            ...member,
            leadingDeptName: dept.name,
            deptId: dept.id
          });
        }
      }
    });
    
    return leaderList.filter(l => 
      l.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.leadingDeptName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [departments, members, searchQuery]);

  const handleAssignLeader = async () => {
    if (!selectedDeptId || !selectedMemberId) {
      toast({ title: 'Error', description: 'Please select both a department and a member.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Rule: A member can only be HOD for ONE department.
      // If the selected member is already an HOD elsewhere, vacate that department first.
      const existingLeadership = departments.find(d => d.head_of_department === selectedMemberId);
      
      if (existingLeadership && existingLeadership.id !== selectedDeptId) {
        // Vacate previous position
        await updateDepartment(existingLeadership.id, { 
          ...existingLeadership, 
          head_of_department: null 
        });
        toast({ title: 'Role Shifted', description: `${members.find(m => m.id === selectedMemberId)?.full_name} moved to the new department.` });
      }

      const dept = departments.find(d => d.id === selectedDeptId);
      if (dept) {
        await updateDepartment(selectedDeptId, { 
          ...dept, 
          head_of_department: selectedMemberId === 'none' ? null : selectedMemberId 
        });
        toast({ title: 'Success', description: 'Leadership assigned successfully.' });
        setIsAssignDialogOpen(false);
        setSelectedDeptId('');
        setSelectedMemberId('');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to assign leadership.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (deptsLoading || membersLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Leadership Board" subtitle="Loading..." />
        <div className="p-6 space-y-6">
          <Skeleton className="h-12 w-full max-w-md rounded-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header 
        title="Ministers Board" 
        subtitle="Manage Church Ministers and Heads of Departments." 
      />

      <div className="p-6 space-y-8">
        {/* Quick Stats Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
           <Card className="rounded-3xl border-none shadow-sm bg-amber-50/50 border-l-4 border-amber-500">
              <CardHeader className="pb-2">
                <CardDescription className="text-amber-600 font-bold uppercase text-[10px] tracking-widest">Ministers Count</CardDescription>
                <CardTitle className="text-3xl font-black">{leaders.length}</CardTitle>
              </CardHeader>
           </Card>
           <Card className="rounded-3xl border-none shadow-sm bg-indigo-50/50 border-l-4 border-indigo-500">
              <CardHeader className="pb-2">
                <CardDescription className="text-indigo-600 font-bold uppercase text-[10px] tracking-widest">Assigned Depts</CardDescription>
                <CardTitle className="text-3xl font-black">{departments.filter(d => d.head_of_department).length}</CardTitle>
              </CardHeader>
           </Card>
           <Card className="rounded-3xl border-none shadow-sm bg-emerald-50/50 border-l-4 border-emerald-500">
              <CardHeader className="pb-2">
                <CardDescription className="text-emerald-600 font-bold uppercase text-[10px] tracking-widest">Ministers Coverage</CardDescription>
                <CardTitle className="text-3xl font-black">{Math.round((leaders.length / (departments.length || 1)) * 100)}%</CardTitle>
              </CardHeader>
           </Card>
        </div>

        {/* Global Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/50 backdrop-blur-xl p-4 rounded-[2rem] border border-white shadow-xl shadow-slate-200/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Search ministers or departments..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-2xl bg-slate-100/50 border-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <Button 
              onClick={() => setIsAssignDialogOpen(true)}
              className="flex-1 md:flex-none btn-gold rounded-2xl px-6 h-12 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Users className="mr-2 h-5 w-5" />
              Assign HOD
            </Button>
          </div>
        </div>

        {/* Leadership Board */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Crown className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Active Ministers</h2>
              <p className="text-xs font-medium text-slate-500">Current Church Ministers and HODs</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode='popLayout'>
              {leaders.map((leader, index) => (
                <motion.div
                  key={leader.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card className="rounded-[2.5rem] border-none shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden group bg-white">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex gap-4">
                            <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
                              {leader.photo_url ? (
                                <img src={leader.photo_url} alt={leader.full_name} className="h-full w-full object-cover" />
                              ) : (
                                <UserCircle2 className="h-10 w-10 text-slate-300" />
                              )}
                            </div>
                            <div className="pt-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-extrabold text-slate-900 tracking-tight text-lg leading-tight">
                                  {leader.full_name}
                                </h3>
                              </div>
                              <Badge className="bg-primary/10 text-primary border-none text-[10px] uppercase tracking-wider font-black px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
                                <ShieldCheck className="h-3 w-3" />
                                Head of {leader.leadingDeptName}
                              </Badge>
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl text-slate-300 hover:text-slate-600 hover:bg-slate-50">
                                <MoreVertical className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-2xl p-2">
                              <DropdownMenuItem onClick={() => {
                                setSelectedMemberId(leader.id);
                                setSelectedDeptId(leader.deptId);
                                setIsAssignDialogOpen(true);
                              }} className="rounded-xl px-4 py-3 cursor-pointer">
                                <Settings2 className="mr-3 h-5 w-5 text-slate-400" /> 
                                <span className="font-bold text-slate-700">Change Role</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="pt-4 border-t border-slate-50">
                           <Button 
                             onClick={() => {
                               setSelectedLeader(leader);
                               setIsDetailsOpen(true);
                             }}
                             className="w-full rounded-2xl h-11 bg-slate-50 text-slate-600 hover:bg-primary/10 hover:text-primary transition-all font-bold gap-2 group/btn"
                           >
                            <Eye className="h-4 w-4 group-hover/btn:scale-110 transition-transform" /> 
                            View Profile Details
                           </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Empty State */}
        {leaders.length === 0 && !deptsLoading && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100 italic text-slate-400">
            <div className="flex justify-center mb-4">
              <ShieldCheck className="h-12 w-12 opacity-20" />
            </div>
            <p>No church leaders found matching your search.</p>
            <Button variant="link" onClick={() => setSearchQuery('')}>Clear Search</Button>
          </div>
        )}
      </div>

      {/* Designation Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] border-none shadow-2xl p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-black tracking-tight text-slate-900">Appoint Minister</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium mt-2">
              Designate a member as a Minister or Head of Department. A member can only head one department at a time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-black text-slate-800 uppercase tracking-widest ml-1">Ministry / Dept</label>
              <Select onValueChange={setSelectedDeptId} value={selectedDeptId}>
                <SelectTrigger className="rounded-2xl h-14 bg-slate-50 border-none px-6 text-lg font-bold">
                  <SelectValue placeholder="Which ministry?" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id} className="rounded-xl py-3 font-bold">
                      {dept.name} {dept.head_of_department ? '✓' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-black text-slate-800 uppercase tracking-widest ml-1">Proposed Head</label>
              <Select onValueChange={setSelectedMemberId} value={selectedMemberId}>
                <SelectTrigger className="rounded-2xl h-14 bg-slate-50 border-none px-6 text-lg font-bold">
                  <SelectValue placeholder="Pick a member" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                  <SelectItem value="none" className="rounded-xl py-3 italic">-- Vacate Position --</SelectItem>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id} className="rounded-xl py-3 font-bold">
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-10 flex flex-col sm:flex-row gap-3">
            <Button variant="ghost" onClick={() => setIsAssignDialogOpen(false)} className="rounded-2xl h-14 font-bold flex-1">Maybe later</Button>
            <Button 
              onClick={handleAssignLeader} 
              disabled={isSubmitting} 
              className="btn-gold rounded-2xl h-14 font-black text-lg flex-[1.5] shadow-xl shadow-primary/20"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Details Dialog */}
      <MemberDetailsDialog 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen} 
        member={selectedLeader}
        leadingDeptName={selectedLeader?.leadingDeptName}
      />
    </div>
  );
}
