import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { useMembers, MemberStatus, Member, NewMemberData } from '@/hooks/useMembers';
import { useAttendance, ServiceType } from '@/hooks/useAttendance';
import { useOfflineAttendance } from '@/hooks/useOfflineAttendance';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { FunctionalPagination } from '@/components/common/FunctionalPagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useDepartments } from '@/hooks/useDepartments';
import { MemberDetailsSheet } from '@/components/members/MemberDetailsSheet';
import { PublicRegistrationLink } from '@/components/members/PublicRegistrationLink';
import { MetaManager } from '@/components/common/MetaManager';
import { useWindowSize } from '@/hooks/useWindowSize';
import { Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

interface MemberCardProps {
  member: Member;
  index: number;
  onView: (m: Member) => void;
  onEdit: (m: Member) => void;
  onQR: (name: string, code: string) => void;
}

function MemberCard({ member, index, onView, onEdit, onQR }: MemberCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02 }}
      className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
    >
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-slate-50">
              <AvatarFallback className="bg-primary/5 text-primary font-black text-xs">
                {getInitials(member.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-black text-slate-800 leading-tight">{member.surname}, {member.firstname}</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{member.phone}</p>
            </div>
          </div>
          <Badge variant="outline" className={member.status === 'active' ? 'badge-active h-5 text-[9px]' : member.status === 'first_timer' ? 'badge-first-timer h-5 text-[9px]' : 'badge-inactive h-5 text-[9px]'}>
             {member.status === 'first_timer' ? 'FT' : member.status}
          </Badge>
        </div>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="mt-4">
          <CollapsibleContent className="space-y-3 pt-3 border-t border-slate-50">
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="col-span-2">
                <p className="text-slate-400 font-bold uppercase">Email</p>
                <p className="text-slate-700 truncate">{member.email || '-'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Gender</p>
                <p className="text-slate-700 capitalize">{member.gender}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Marital</p>
                <p className="text-slate-700 capitalize">{member.marital_status}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">RCCG Join</p>
                <p className="text-slate-700">{member.year_joined || '-'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Workforce</p>
                <p className="text-slate-700">{member.year_joined_workforce || '-'}</p>
              </div>
            </div>
            {member.is_ordained && (
              <div className="bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/50">
                 <p className="text-[9px] font-black text-indigo-700 uppercase leading-none">Ordained: {member.ordained_as?.replace('_', ' ')}</p>
                 <p className="text-[8px] text-indigo-400 mt-1">{member.year_ordination}</p>
              </div>
            )}
          </CollapsibleContent>
          
          <div className="flex items-center gap-2 mt-4 text-left">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-[10px] font-black uppercase text-slate-400 gap-1 hover:text-primary transition-colors p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {isExpanded ? 'Hide' : 'Expand'}
            </Button>
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-slate-50 hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => window.location.href = `tel:${member.phone}`}
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-slate-50 hover:bg-green-50 hover:text-green-600 transition-colors"
                onClick={() => window.open(`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}`, '_blank')}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(member)}>View Full Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(member)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onQR(member.full_name, member.qr_code || '')}>QR Code</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Collapsible>
      </div>
    </motion.div>
  );
}

export default function Members() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [dateJoinedFilter, setDateJoinedFilter] = useState<string>('all');
  
  const { 
    members, 
    totalCount, 
    totalPages, 
    loading, 
    createMember, 
    updateMember, 
    deleteMember, 
    fetchMembers,
    exportMembers,
    importMembers
  } = useMembers(currentPage, debouncedSearch, statusFilter);
  
  const { departments, loading: deptsLoading } = useDepartments();
  const { canManageAttendance, isAdmin } = useAuth();
  const { toast } = useToast();

  const [isNewMemberOpen, setIsNewMemberOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [selectedMemberQR, setSelectedMemberQR] = useState<{ name: string; qrCode: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [smsRecipients, setSmsRecipients] = useState<{ id: string | null; phone: string; name: string }[] | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isShareLinkOpen, setIsShareLinkOpen] = useState(false);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

  const { isMobile, isTablet } = useWindowSize();
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    // Dynamically switch view based on screen size
    if (isMobile) {
      setViewMode('grid');
    } else {
      setViewMode('table');
    }
  }, [isMobile]);

  useEffect(() => { 
    setCurrentPage(1); 
  }, [debouncedSearch, statusFilter]);

  const stats = useMemo(() => ({
    total: totalCount,
    active: statusFilter === 'active' ? totalCount : members.filter(m => m.status === 'active').length,
    firstTimers: statusFilter === 'first_timer' ? totalCount : members.filter(m => m.status === 'first_timer').length,
  }), [members, totalCount, statusFilter]);

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
    if (selectedIds.size === members.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(members.map(m => m.id)));
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const success = await importMembers(file);
      if (success) {
        // Clear input
        e.target.value = '';
      }
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
    await exportMembers();
  };

  if (loading || deptsLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <Header title="Church Directory" subtitle="Manage and track your congregation" />
        <div className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
          </div>
          <Skeleton className="h-14 w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/50">
      <MetaManager title="Church Directory" description="Manage and track your sanctuary congregation with professional tools." />
      <Header title="Church Directory" subtitle="Manage and track your congregation" />

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        {/* Stats Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 mb-4">
              <UsersIcon className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-black text-slate-800">{stats.total}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Total Members</p>
          </div>
          <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 mb-4">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-black text-slate-800">{members.filter(m => m.church_membership === 'worker').length}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Workforce (Workers)</p>
          </div>
          <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 mb-4">
              <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-indigo-600 text-white rounded-full">M</Badge>
            </div>
            <p className="text-3xl font-black text-slate-800">{members.filter(m => m.church_membership === 'minister').length}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Ministers</p>
          </div>
          <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 mb-4">
              <UsersIcon className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-3xl font-black text-slate-800">{stats.firstTimers}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">First Timers</p>
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
              <div className="p-6 rounded-2xl bg-slate-900 text-white relative overflow-hidden shadow-lg">
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
          className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-card p-4 rounded-2xl border border-border shadow-sm"
        >
          <div className="flex flex-col sm:flex-row flex-1 items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="text" placeholder="Search members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 rounded-xl w-full border-border bg-background focus:ring-primary shadow-none" />
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1 sm:w-[130px] h-11 rounded-xl bg-background border-border shadow-none font-bold"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="first_timer">First Timer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                 <SelectTrigger className="flex-1 sm:w-[150px] h-11 rounded-xl bg-background border-border shadow-none font-bold"><SelectValue placeholder="Dept" /></SelectTrigger>
                 <SelectContent>
                    <SelectItem value="all">All Depts</SelectItem>
                    {departments.map((dept) => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
                  </SelectContent>
               </Select>
               {!isMobile && (
                 <Select value={genderFilter} onValueChange={setGenderFilter}>
                   <SelectTrigger className="flex-1 sm:w-[100px] h-11 rounded-xl bg-background border-border shadow-none font-bold"><SelectValue placeholder="Gender" /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Gender</SelectItem>
                     <SelectItem value="male">Male</SelectItem>
                     <SelectItem value="female">Female</SelectItem>
                   </SelectContent>
                 </Select>
               )}
            </div>
           </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex border border-border rounded-xl overflow-hidden bg-background h-11">
              <Button 
                variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                size="icon" 
                onClick={() => setViewMode('table')}
                className="rounded-none h-full w-11"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="icon" 
                onClick={() => setViewMode('grid')}
                className="rounded-none h-full w-11"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            {selectedIds.size > 0 && (
              <Button variant="outline" onClick={handleBulkSMS} className="h-11 rounded-xl border-border">
                <MessageSquare className="mr-2 h-4 w-4" /> {isMobile ? '' : 'SMS Selected'}
              </Button>
            )}
            {canManageAttendance && (
              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                <input
                  type="file"
                  id="member-import-input"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImport}
                />
                {!isMobile && (
                  <>
                    <Button variant="outline" onClick={() => document.getElementById('member-import-input')?.click()} className="flex-1 sm:flex-none h-11 rounded-xl border-border">
                      <FileUp className="mr-2 h-4 w-4" /> Import
                    </Button>
                    <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-none h-11 rounded-xl border-border">
                      <FileDown className="mr-2 h-4 w-4" /> Export
                    </Button>
                  </>
                )}
                <Button 
                   variant="outline" 
                   onClick={() => setIsShareLinkOpen(true)} 
                   className="flex-1 sm:flex-none h-11 rounded-xl gap-2 text-primary border-primary/20 hover:bg-primary/5 transition-all"
                >
                  <Share2 className="h-4 w-4" /> {isMobile ? '' : 'Share'}
                </Button>
                <Button onClick={() => navigate('/members/add')} className="btn-gold flex-1 sm:flex-none h-11 rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">
                  <Plus className="mr-2 h-4 w-4" /> Add Member
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* View Layout Toggle */}
        {viewMode === 'table' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                    <TableHead className="w-12 sticky left-0 bg-slate-50 z-20">
                      <Checkbox
                        checked={members.length > 0 && selectedIds.size === members.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-black text-[10px] uppercase tracking-wider sticky left-12 bg-slate-50 z-20 border-r border-slate-100">Surname</TableHead>
                    <TableHead className="whitespace-nowrap font-black text-[10px] uppercase tracking-wider">First Name</TableHead>
                    <TableHead className="whitespace-nowrap font-black text-[10px] uppercase tracking-wider">Status</TableHead>
                    {isTablet || !isMobile && <TableHead className="whitespace-nowrap font-black text-[10px] uppercase tracking-wider">Phone</TableHead>}
                    {isTablet || !isMobile && <TableHead className="whitespace-nowrap font-black text-[10px] uppercase tracking-wider">Level</TableHead>}
                    {!isMobile && !isTablet && <TableHead className="whitespace-nowrap font-black text-[10px] uppercase tracking-wider">Email</TableHead>}
                    {isTablet || !isMobile && <TableHead className="whitespace-nowrap font-black text-[10px] uppercase tracking-wider">Family</TableHead>}
                    {!isMobile && !isTablet && <TableHead className="whitespace-nowrap font-black text-[10px] uppercase tracking-wider text-center">RCCG Join</TableHead>}
                    <TableHead className="w-12 sticky right-0 bg-slate-50 z-20 shadow-[-4px_0_12px_rgba(0,0,0,0.02)] border-l border-slate-100"></TableHead>
                  </TableRow>
                </TableHeader>
                 <TableBody>
                   {members.map((member, index) => (
                     <motion.tr key={member.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="group transition-colors hover:bg-muted/50 border-b border-slate-50">
                       <TableCell className="sticky left-0 bg-white z-10 group-hover:bg-muted/50 transition-colors">
                         <Checkbox
                           checked={selectedIds.has(member.id)}
                           onCheckedChange={() => toggleSelect(member.id)}
                         />
                       </TableCell>
                       <TableCell className="font-black text-slate-800 whitespace-nowrap sticky left-12 bg-white z-10 group-hover:bg-muted/50 transition-colors border-r border-slate-50">
                         {member.surname}
                       </TableCell>
                       <TableCell className="whitespace-nowrap">
                         <span className="font-bold text-slate-700">{member.firstname}</span>
                         {!isMobile && <span className="text-slate-400 ml-1 italic">{member.other_name || ''}</span>}
                       </TableCell>
                       <TableCell className="whitespace-nowrap">
                         <Badge variant="outline" className={cn(
                           "text-[9px] h-5 font-black uppercase tracking-tighter",
                           member.status === 'active' ? 'badge-active' : member.status === 'first_timer' ? 'badge-first-timer' : 'badge-inactive'
                         )}>
                           {member.status === 'first_timer' ? 'FT' : member.status}
                         </Badge>
                       </TableCell>
                       {(isTablet || !isMobile) && <TableCell className="whitespace-nowrap font-bold text-xs">{member.phone}</TableCell>}
                       {(isTablet || !isMobile) && (
                         <TableCell className="whitespace-nowrap">
                            <Badge variant="outline" className="capitalize text-[10px] h-5 bg-blue-50 text-blue-700 border-blue-100">
                             {member.church_membership || 'member'}
                           </Badge>
                         </TableCell>
                       )}
                       {!isMobile && !isTablet && <TableCell className="whitespace-nowrap text-xs text-blue-600 truncate max-w-[120px]">{member.email || '-'}</TableCell>}
                       {(isTablet || !isMobile) && <TableCell className="whitespace-nowrap text-xs font-bold text-slate-600">{member.family_name || '-'}</TableCell>}
                       {!isMobile && !isTablet && <TableCell className="whitespace-nowrap text-center text-xs font-black">{member.year_joined || '-'}</TableCell>}
                       <TableCell className="sticky right-0 bg-white z-10 group-hover:bg-muted/50 transition-colors border-l border-slate-50 shadow-[-4px_0_12px_rgba(0,0,0,0.02)]">
                         {canManageAttendance && (
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end" className="w-52 p-2">
                               <div className="px-2 py-1.5 mb-1 bg-slate-50 rounded text-[10px] font-black uppercase text-slate-400 tracking-widest">Row Actions</div>
                               <DropdownMenuItem onClick={() => setViewingMember(member)} className="rounded-lg mb-0.5">
                                 <Search className="h-4 w-4 mr-2 text-slate-400" /> View Profile
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => setEditTarget(member)} className="rounded-lg mb-0.5">
                                 <Pencil className="h-4 w-4 mr-2 text-slate-400" /> Edit Member
                               </DropdownMenuItem>
                               <div className="h-px bg-slate-100 my-1" />
                               <DropdownMenuItem onClick={() => window.location.href = `tel:${member.phone}`} className="rounded-lg mb-0.5">
                                 <Phone className="h-4 w-4 mr-2 text-primary" /> Call Member
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => window.open(`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}`, '_blank')} className="rounded-lg mb-0.5">
                                 <MessageSquare className="h-4 w-4 mr-2 text-green-600" /> WhatsApp
                               </DropdownMenuItem>
                               <div className="h-px bg-slate-100 my-1" />
                               <DropdownMenuItem className="text-destructive font-black rounded-lg" onClick={() => setDeleteTarget({ id: member.id, name: member.full_name })}>
                                 <Trash2 className="h-4 w-4 mr-2" /> Delete Member
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
                         )}
                       </TableCell>
                     </motion.tr>
                   ))}
                 </TableBody>
               </Table>
             </div>
             {members.length === 0 && (
               <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
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
                    }} className="h-10 rounded-xl px-6">
                       Clear Filters
                    </Button>
                    {canManageAttendance && (
                      <Button className="btn-gold h-10 rounded-xl px-6" onClick={() => navigate('/members/add')}>
                        <Plus className="mr-2 h-4 w-4" /> Add Member
                      </Button>
                    )}
                 </div>
               </div>
             )}
             <div className="p-4 border-t border-slate-100 bg-slate-50/30">
               <FunctionalPagination 
                 currentPage={currentPage}
                 totalPages={totalPages}
                 onPageChange={setCurrentPage}
                 isLoading={loading}
               />
             </div>
           </motion.div>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {members.map((member, index) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  index={index}
                  onView={setViewingMember}
                  onEdit={setEditTarget}
                  onQR={(name, code) => setSelectedMemberQR({ name, qrCode: code })}
                />
              ))}
            </div>

            {members.length === 0 && (
              <div className="py-24 text-center rounded-3xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center space-y-4">
                <div className="h-20 w-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-2 shadow-sm">
                   <UsersIcon className="h-10 w-10 text-slate-300" />
                 </div>
                 <div>
                    <h3 className="text-lg font-black tracking-tight text-slate-800">Your Sanctuary is Empty</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">There are no member records available to display in this view format.</p>
                 </div>
              </div>
            )}

            <div className="pt-4">
              <FunctionalPagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isLoading={loading}
              />
            </div>
          </div>
        )}
      </div>

      <MemberDetailsSheet
        open={!!viewingMember}
        onOpenChange={(open) => !open && setViewingMember(null)}
        member={viewingMember}
        departments={departments}
      />

      <NewMemberDialog open={isNewMemberOpen} onOpenChange={setIsNewMemberOpen} onMemberCreated={fetchMembers} />
      <PublicRegistrationLink isOpen={isShareLinkOpen} onOpenChange={setIsShareLinkOpen} />

      <EditMemberDialog
        open={!!editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
        member={editTarget}
        onSave={async (id, data) => {
          const success = await updateMember(id, data);
          if (success) setEditTarget(null);
          return success;
        }}
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
