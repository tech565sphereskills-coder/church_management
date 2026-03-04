import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Plus, MoreVertical, Phone, Calendar,
  Users as UsersIcon, QrCode, ChevronLeft, ChevronRight, Pencil, MessageSquare,
  FileUp, FileDown
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

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.phone.includes(searchQuery) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.address?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
      const matchesDepartment = departmentFilter === 'all' || member.department === departmentFilter;
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
    });
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
    const promises = Array.from(selectedIds).map(id => updateMember(id, { department: dept }));
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 grid gap-4 sm:grid-cols-3">
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
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <UsersIcon className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.firstTimers}</p>
              <p className="text-sm text-muted-foreground">First Timers</p>
            </div>
          </div>
        </motion.div>

        {/* Bulk Actions */}
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onClear={() => setSelectedIds(new Set())}
          onAssignDepartment={handleBulkDepartment}
          onChangeStatus={handleBulkStatus}
        />

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="text" placeholder="Search members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="first_timer">First Timer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
               <SelectTrigger className="w-40"><SelectValue placeholder="Department" /></SelectTrigger>
               <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
                </SelectContent>
             </Select>
             <Select value={genderFilter} onValueChange={setGenderFilter}>
               <SelectTrigger className="w-32"><SelectValue placeholder="Gender" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Genders</SelectItem>
                 <SelectItem value="male">Male</SelectItem>
                 <SelectItem value="female">Female</SelectItem>
               </SelectContent>
             </Select>
             <Select value={dateJoinedFilter} onValueChange={setDateJoinedFilter}>
               <SelectTrigger className="w-44"><SelectValue placeholder="Joined" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Any Time</SelectItem>
                 <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                 <SelectItem value="this_year">This Year</SelectItem>
               </SelectContent>
             </Select>
           </div>
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <Button variant="outline" onClick={handleBulkSMS}>
                <MessageSquare className="mr-2 h-4 w-4" /> SMS Selected
              </Button>
            )}
            {canManageAttendance && (
              <>
                <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                  <FileUp className="mr-2 h-4 w-4" /> Import
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <FileDown className="mr-2 h-4 w-4" /> Export
                </Button>
                <Button onClick={() => setIsNewMemberOpen(true)} className="btn-gold">
                  <Plus className="mr-2 h-4 w-4" /> Add Member
                </Button>
              </>
            )}
          </div>
        </motion.div>

        {/* Members Table */}
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
                <TableHead>Member</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">QR</TableHead>
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
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar><AvatarFallback className="bg-primary/10 text-primary">{getInitials(member.full_name)}</AvatarFallback></Avatar>
                      <div>
                        <button onClick={() => navigate(`/members/${member.id}`)} className="font-medium hover:text-primary hover:underline transition-colors text-left">{member.full_name}</button>
                        <p className="text-xs text-muted-foreground capitalize">{member.gender}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><div className="flex items-center gap-2"><Phone className="h-3 w-3 text-muted-foreground" />{member.phone}</div></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {member.department_name || '-'}
                      {departments.some(d => d.head_of_department === member.id) && (
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter h-5 bg-indigo-50 text-indigo-700 border-indigo-100">
                          HOD
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {new Date(member.date_joined).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={member.status === 'active' ? 'badge-active' : member.status === 'first_timer' ? 'badge-first-timer' : 'badge-inactive'}>
                      {member.status === 'first_timer' ? 'First Timer' : member.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
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
                              Delete Member
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
            <div className="py-12 text-center"><p className="text-muted-foreground">No members found</p></div>
          )}

          {/* Pagination */}
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
      </div>

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
