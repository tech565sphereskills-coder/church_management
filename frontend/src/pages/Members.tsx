import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Plus, MoreVertical, Phone, Calendar, Trash2,
  Users as UsersIcon, QrCode, ChevronLeft, ChevronRight, Pencil, MessageSquare,
  FileUp, FileDown, PieChart, TrendingUp, ChevronDown, ChevronUp, LayoutGrid, List, SearchX
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { NewMemberDialog } from '@/components/members/NewMemberDialog';
import { EditMemberDialog } from '@/components/members/EditMemberDialog';
import { DeleteMemberDialog } from '@/components/members/DeleteMemberDialog';
import { BulkActionsBar } from '@/components/members/BulkActionsBar';
import { QRCodeDisplay } from '@/components/qr/QRCodeDisplay';
import { SendSMSDialog } from '@/components/sms/SendSMSDialog';
import { CSVImportDialog } from '@/components/members/CSVImportDialog';
import { useMembers, MemberStatus, Member } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
import { NewMemberData } from '@/components/members/NewMemberDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useDepartments } from '@/hooks/useDepartments';
import { MemberDetailsSheet } from '@/components/members/MemberDetailsSheet';

const PAGE_SIZE = 20;


export default function Members() {
  const navigate = useNavigate();
  const { members, loading, createMember, updateMember, deleteMember, fetchMembers } = useMembers();
  const { departments, loading: deptsLoading } = useDepartments();
  const { canManageAttendance, isAdmin } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [dateJoinedFilter, setDateJoinedFilter] = useState<string>('all');
  const [isNewMemberOpen, setIsNewMemberOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [selectedMemberQR, setSelectedMemberQR] = useState<{ name: string; qrCode: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [smsRecipients, setSmsRecipients] = useState<{ id: string | null; phone: string; name: string }[] | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

  const filteredMembers = useMemo(() => {
    return members
      .filter((member) => {
        const matchesSearch =
          member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.phone.includes(searchQuery) ||
          member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.address?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
        const matchesDepartment = departmentFilter === 'all' || member.departments?.includes(departmentFilter);
        const matchesGender = genderFilter === 'all' || member.gender === genderFilter;
        
        let matchesDate = true;
        if (dateJoinedFilter !== 'all') {
          const joinedDate = new Date(member.date_joined);
          const now = new Date();
          if (dateJoinedFilter === 'last_30_days') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            matchesDate = joinedDate >= thirtyDaysAgo;
          } else if (dateJoinedFilter === 'this_year') {
            matchesDate = joinedDate.getFullYear() === now.getFullYear();
          }
        }

        return matchesSearch && matchesStatus && matchesDepartment && matchesGender && matchesDate;
      })
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [members, searchQuery, statusFilter, departmentFilter, genderFilter, dateJoinedFilter]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, departmentFilter, genderFilter, dateJoinedFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = useMemo(() => ({
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    firstTimers: members.filter(m => m.status === 'first_timer').length,
  }), [members]);

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleMemberCreated = async (memberData: NewMemberData) => {
    const member = await createMember(memberData);
    if (member) setIsNewMemberOpen(false);
  };

  const handleStatusChange = async (memberId: string, newStatus: MemberStatus) => {
    await updateMember(memberId, { status: newStatus });
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await deleteMember(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // Bulk actions
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedMembers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedMembers.map(m => m.id)));
    }
  };

  const handleBulkDepartment = async (dept: string) => {
    const promises = Array.from(selectedIds).map(id => {
      const member = members.find(m => m.id === id);
      const currentDepts = member?.departments || [];
      const nextDepts = [...new Set([...currentDepts, dept])];
      return updateMember(id, { departments: nextDepts });
    });
    await Promise.all(promises);
    toast({ title: 'Department Updated', description: `${selectedIds.size} member(s) assigned to ${dept}` });
    setSelectedIds(new Set());
  };

  const handleBulkStatus = async (status: MemberStatus) => {
    const promises = Array.from(selectedIds).map(id => updateMember(id, { status }));
    await Promise.all(promises);
    toast({ title: 'Status Updated', description: `${selectedIds.size} member(s) updated` });
    setSelectedIds(new Set());
  };

  const handleBulkSMS = () => {
    const selected = members.filter(m => selectedIds.has(m.id));
    setSmsRecipients(selected.map(m => ({ id: m.id, phone: m.phone, name: m.full_name })));
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/members/export_excel/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'members_export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ title: 'Export Successful', description: 'Your member list has been exported to Excel.' });
    } catch (error) {
      toast({ title: 'Export Failed', description: 'Failed to export member list.', variant: 'destructive' });
    }
  };

  if (loading || deptsLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Members" subtitle="Manage your church members" />
        <div className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Members" subtitle="Manage your church members" />

      <div className="p-6">
        {/* Stats Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <UsersIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Members</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
              <UsersIcon className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 sm:col-span-2 lg:col-span-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <UsersIcon className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.firstTimers}</p>
              <p className="text-sm text-muted-foreground">First Timers</p>
            </div>
          </div>
        </motion.div>

        {/* Insights Section */}
        <Collapsible open={isInsightsOpen} onOpenChange={setIsInsightsOpen} className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Membership Insights</h3>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-2 text-primary font-bold">
                {isInsightsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {isInsightsOpen ? 'Hide Analysis' : 'Show Analysis'}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
              <div className="p-6 rounded-2xl bg-slate-900 text-white relative overflow-hidden">
                <TrendingUp className="h-12 w-12 absolute -right-2 -bottom-2 text-white/10 rotate-12" />
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">Growth this year</p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-3xl font-black">+12%</h4>
                  <span className="text-xs text-primary font-bold">New Registrations</span>
                </div>
              </div>
              <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Top Department</p>
                   <PieChart className="h-4 w-4 text-primary" />
                </div>
                <div>
                   <h4 className="text-xl font-black text-slate-800">Choir</h4>
                   <p className="text-xs text-slate-500">24% of total membership</p>
                </div>
              </div>
              <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Gender Ratio</p>
                <div className="space-y-2 mt-4">
                   <div className="flex justify-between text-[10px] font-black uppercase">
                      <span>Female</span>
                      <span>58%</span>
                   </div>
                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[58%] rounded-full shadow-[0_0_10px_rgba(var(--primary),0.2)]"></div>
                   </div>
                   <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                      <span>Male</span>
                      <span>42%</span>
                   </div>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col justify-between">
                <p className="text-[10px] font-black text-primary uppercase">Active Rate</p>
                <div className="flex items-center gap-4 mt-4">
                   <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin-slow"></div>
                   <div>
                      <h4 className="text-2xl font-black text-slate-800">92%</h4>
                      <p className="text-[10px] text-slate-500 font-bold">ENGAGEMENT INDEX</p>
                   </div>
                </div>
              </div>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>

        {/* Bulk Actions */}
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onClear={() => setSelectedIds(new Set())}
          onAssignDepartment={handleBulkDepartment}
          onChangeStatus={handleBulkStatus}
        />

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }} 
          className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="text" placeholder="Search members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="first_timer">First Timer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                 <SelectTrigger className="w-[150px]"><SelectValue placeholder="Department" /></SelectTrigger>
                 <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
                  </SelectContent>
               </Select>
               <Select value={genderFilter} onValueChange={setGenderFilter}>
                 <SelectTrigger className="w-[120px]"><SelectValue placeholder="Gender" /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Genders</SelectItem>
                   <SelectItem value="male">Male</SelectItem>
                   <SelectItem value="female">Female</SelectItem>
                 </SelectContent>
               </Select>
               <Select value={dateJoinedFilter} onValueChange={setDateJoinedFilter}>
                 <SelectTrigger className="w-[150px]"><SelectValue placeholder="Joined" /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Any Time</SelectItem>
                   <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                   <SelectItem value="this_year">This Year</SelectItem>
                 </SelectContent>
               </Select>
            </div>
           </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex border rounded-lg overflow-hidden bg-background">
              <Button 
                variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                size="icon" 
                onClick={() => setViewMode('table')}
                className="rounded-none h-10 w-10"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="icon" 
                onClick={() => setViewMode('grid')}
                className="rounded-none h-10 w-10"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            {selectedIds.size > 0 && (
              <Button variant="outline" onClick={handleBulkSMS}>
                <MessageSquare className="mr-2 h-4 w-4" /> SMS Selected
              </Button>
            )}
            {canManageAttendance && (
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={() => setIsImportOpen(true)} className="flex-1 sm:flex-none">
                  <FileUp className="mr-2 h-4 w-4" /> Import
                </Button>
                <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-none">
                  <FileDown className="mr-2 h-4 w-4" /> Export
                </Button>
                <Button onClick={() => setIsNewMemberOpen(true)} className="btn-gold flex-1 sm:flex-none">
                  <Plus className="mr-2 h-4 w-4" /> Add Member
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* View Layout Toggle */}
        {viewMode === 'table' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={paginatedMembers.length > 0 && selectedIds.size === paginatedMembers.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Surname</TableHead>
                    <TableHead className="whitespace-nowrap">First Name</TableHead>
                    <TableHead className="whitespace-nowrap">Other Name</TableHead>
                    <TableHead className="whitespace-nowrap">Phone</TableHead>
                    <TableHead className="whitespace-nowrap">Email</TableHead>
                    <TableHead className="whitespace-nowrap">Gender</TableHead>
                    <TableHead className="whitespace-nowrap">Marital Status</TableHead>
                    <TableHead className="whitespace-nowrap">Membership</TableHead>
                    <TableHead className="whitespace-nowrap">Dept & Post</TableHead>
                    <TableHead className="whitespace-nowrap">Year Joined</TableHead>
                    <TableHead className="whitespace-nowrap">Ordination</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="w-12 text-center">QR</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMembers.map((member, index) => (
                    <motion.tr key={member.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="group transition-colors hover:bg-muted/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(member.id)}
                          onCheckedChange={() => toggleSelect(member.id)}
                        />
                      </TableCell>
                      <TableCell className="font-bold whitespace-nowrap">{member.surname}</TableCell>
                      <TableCell className="font-bold whitespace-nowrap">{member.firstname}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{member.other_name || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {member.phone}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{member.email || '-'}</TableCell>
                      <TableCell className="capitalize whitespace-nowrap">{member.gender}</TableCell>
                      <TableCell className="capitalize whitespace-nowrap">{member.marital_status}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {member.church_membership ? (
                          <Badge variant="outline" className="text-[10px] h-5 bg-blue-50 text-blue-700 border-blue-100 capitalize">
                            {member.church_membership}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 min-w-[120px]">
                          <div className="flex flex-wrap gap-1">
                            {member.department_names?.length ? (
                              member.department_names.map(name => (
                                <Badge key={name} variant="secondary" className="text-[9px] py-0 px-1 inline-flex items-center bg-slate-100 text-slate-600 font-medium">
                                  {name}
                                </Badge>
                              ))
                            ) : null}
                            {departments.some(d => d.head_of_department === member.id) && (
                              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter h-4 bg-indigo-50 text-indigo-700 border-indigo-100">
                                HOD
                              </Badge>
                            )}
                          </div>
                          {member.department_post && (
                            <p className="text-[10px] text-muted-foreground truncate italic">{member.department_post}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center">{member.year_joined || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {member.ordained_as ? (
                          <div className="text-[11px]">
                            <p className="font-bold text-indigo-600 capitalize">{member.ordained_as.replace('_', ' ')}</p>
                            {member.year_ordination && <p className="text-[9px] text-muted-foreground">{member.year_ordination}</p>}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={member.status === 'active' ? 'badge-active' : member.status === 'first_timer' ? 'badge-first-timer' : 'badge-inactive'}>
                          {member.status === 'first_timer' ? 'First Timer' : member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedMemberQR({ name: member.full_name, qrCode: member.qr_code || '' })}>
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        {canManageAttendance && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewingMember(member)}>
                                <Search className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditTarget(member)}>
                                <Pencil className="h-4 w-4 mr-2" /> Edit Member
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSmsRecipients([{ id: member.id, phone: member.phone, name: member.full_name }])}>
                                <MessageSquare className="h-4 w-4 mr-2" /> Send SMS
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(member.id, 'active')}>Mark Active</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(member.id, 'inactive')}>Mark Inactive</DropdownMenuItem>
                              {isAdmin && (
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget({ id: member.id, name: member.full_name })}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete Member
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredMembers.length === 0 && (
              <div className="py-16 text-center flex flex-col items-center justify-center space-y-4">
                <div className="h-20 w-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-2 shadow-sm">
                   <SearchX className="h-10 w-10 text-slate-300" />
                </div>
                <div>
                   <h3 className="text-lg font-black tracking-tight text-slate-800">No Members Found</h3>
                   <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">We couldn't find any members matching your current filters. Try adjusting your search or clearing your filters.</p>
                </div>
                <div className="flex gap-2 mt-2">
                   <Button variant="outline" onClick={() => {
                        setSearchQuery(''); setStatusFilter('all'); setDepartmentFilter('all'); setGenderFilter('all'); setDateJoinedFilter('all');
                   }}>
                      Clear Filters
                   </Button>
                   {canManageAttendance && (
                     <Button className="btn-gold" onClick={() => setIsNewMemberOpen(true)}>
                       <Plus className="mr-2 h-4 w-4" /> Add Member
                     </Button>
                   )}
                </div>
              </div>
            )}
            {/* Pagination for Table */}
            {filteredMembers.length > 0 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
                <span>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredMembers.length)} of {filteredMembers.length} members
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedMembers.map((member, index) => {
                const joinedDate = new Date(member.date_joined);
                const isNew = joinedDate >= new Date(new Date().setDate(new Date().getDate() - 30));
                const hodDept = departments.find(d => d.head_of_department === member.id);

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-end gap-1">
                         <Badge variant="outline" className={member.status === 'active' ? 'badge-active' : member.status === 'first_timer' ? 'badge-first-timer' : 'badge-inactive'}>
                            {member.status === 'first_timer' ? 'First Timer' : member.status}
                         </Badge>
                         {isNew && <Badge className="bg-amber-50 text-amber-600 border-amber-100 px-1.5 h-5 text-[9px] font-black uppercase tracking-tighter shadow-none">New</Badge>}
                      </div>
                    </div>
                    
                    <div className="mb-4 text-left">
                      <h4 className="font-black text-slate-800 tracking-tight group-hover:text-primary transition-colors cursor-pointer" onClick={() => setViewingMember(member)}>
                        {member.full_name}
                      </h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                         {member.department_names?.length ? (
                           member.department_names.map(name => (
                             <Badge key={name} variant="secondary" className="text-[9px] h-4 px-1 bg-slate-50 text-slate-500 border-none shadow-none font-bold">
                               {name}
                             </Badge>
                           ))
                         ) : (
                           <span className="text-[10px] text-slate-400">No Department</span>
                         )}
                      </div>
                      {hodDept && (
                        <Badge className="mt-2 bg-indigo-50 text-indigo-700 border-indigo-100 h-5 px-1.5 text-[9px] font-black uppercase tracking-tighter shadow-none">
                          HOD: {hodDept.name}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-slate-50" onClick={() => window.location.href = `tel:${member.phone}`}>
                        <Phone className="h-4 w-4 text-slate-400" />
                      </Button>
                      <div className="flex-1"></div>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedMemberQR({ name: member.full_name, qrCode: member.qr_code || '' })}>
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filteredMembers.length === 0 && (
              <div className="py-24 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center space-y-4">
                <div className="h-20 w-20 bg-white border border-slate-100 rounded-full flex items-center justify-center mb-2 shadow-sm">
                   <UsersIcon className="h-10 w-10 text-slate-300" />
                </div>
                <div>
                   <h3 className="text-lg font-black tracking-tight text-slate-800">Your Sanctuary is Empty</h3>
                   <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">There are no member records available to display in this view format.</p>
                </div>
              </div>
            )}

            {/* Pagination for Grid */}
            {filteredMembers.length > 0 && (
              <div className="flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
                <span>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredMembers.length)} of {filteredMembers.length} members
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <MemberDetailsSheet
        open={!!viewingMember}
        onOpenChange={(open) => !open && setViewingMember(null)}
        member={viewingMember}
        departments={departments}
      />

      <NewMemberDialog open={isNewMemberOpen} onOpenChange={setIsNewMemberOpen} onMemberCreated={handleMemberCreated} />

      <EditMemberDialog
        open={!!editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
        member={editTarget}
        onSave={updateMember}
      />

      {selectedMemberQR && (
        <QRCodeDisplay open={!!selectedMemberQR} onOpenChange={() => setSelectedMemberQR(null)} memberName={selectedMemberQR.name} qrCode={selectedMemberQR.qrCode} />
      )}

      <DeleteMemberDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        memberName={deleteTarget?.name || ''}
        onConfirm={handleDeleteConfirm}
      />

      {smsRecipients && (
        <SendSMSDialog
          open={!!smsRecipients}
          onOpenChange={(open) => { if (!open) setSmsRecipients(null); }}
          recipients={smsRecipients}
        />
      )}

      <CSVImportDialog 
        open={isImportOpen} 
        onOpenChange={setIsImportOpen} 
        onImportComplete={fetchMembers}
      />
    </div>
  );
}
