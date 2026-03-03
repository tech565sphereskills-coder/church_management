import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, UserPlus, Calendar, QrCode, Camera, Users, Filter } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useMembers, Member } from '@/hooks/useMembers';
import { useAttendance, ServiceType } from '@/hooks/useAttendance';
import { useOfflineAttendance } from '@/hooks/useOfflineAttendance';
import { NewMemberData } from '@/components/members/NewMemberDialog';

interface LocationState {
  serviceType?: ServiceType;
}
import { useAuth } from '@/hooks/useAuth';
import { NewMemberDialog } from '@/components/members/NewMemberDialog';
import { QRScanner } from '@/components/qr/QRScanner';
import { QRCodeDisplay } from '@/components/qr/QRCodeDisplay';
import { OfflineIndicator } from '@/components/attendance/OfflineIndicator';
import { Skeleton } from '@/components/ui/skeleton';

const serviceTypes = [
  { value: 'sunday_service', label: 'Sunday Service' },
  { value: 'midweek_service', label: 'Midweek Service' },
  { value: 'special_program', label: 'Special Program' },
];

export default function Attendance() {
  const { toast } = useToast();
  const { canManageAttendance } = useAuth();
  const { searchMembers, searchByQRCode, createMember } = useMembers();
  const { 
    todayService, 
    todayAttendance, 
    loading: attendanceLoading,
    getOrCreateTodayService, 
    fetchTodayAttendance, 
    markAttendance,
    setLoading 
  } = useAttendance();
  const { isOnline, addOfflineRecord, pendingRecords } = useOfflineAttendance();

  const location = useLocation();
  const state = location.state as LocationState;
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>(
    state?.serviceType || 'sunday_service'
  );
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isNewMemberOpen, setIsNewMemberOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [offlineMarkedIds, setOfflineMarkedIds] = useState<string[]>([]);
  const [selectedMemberQR, setSelectedMemberQR] = useState<{ name: string; qrCode: string } | null>(null);
  const [activeTab, setActiveTab] = useState('search');
  const [deptFilter, setDeptFilter] = useState('all');

  const { members } = useMembers(); // Get all members for browsing

  // Track offline marked members
  useEffect(() => {
    const offlineIds = pendingRecords.map(r => r.memberId);
    setOfflineMarkedIds(offlineIds);
  }, [pendingRecords]);

  const today = new Date().toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Initialize service on mount
  useEffect(() => {
    const initService = async () => {
      const service = await getOrCreateTodayService(serviceType);
      if (service) {
        await fetchTodayAttendance(service.id);
      }
      setLoading(false);
    };
    initService();
  }, [serviceType, getOrCreateTodayService, fetchTodayAttendance, setLoading]);

  // Search members when query changes
  useEffect(() => {
    const search = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      const results = await searchMembers(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, searchMembers]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleMarkAttendance = async (member: Member) => {
    if (!todayService) {
      toast({
        title: 'Error',
        description: 'Service not initialized. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    // Check if already marked (online or offline)
    const isAlreadyMarked = todayAttendance.includes(member.id) || offlineMarkedIds.includes(member.id);
    if (isAlreadyMarked) {
      toast({
        title: 'Already marked',
        description: `${member.full_name} has already been marked present.`,
        variant: 'destructive',
      });
      return;
    }

    // If offline, save locally
    if (!isOnline) {
      addOfflineRecord(
        member.id,
        member.full_name,
        todayService.id,
        serviceType
      );
      return;
    }

    // If online, save to database
    const success = await markAttendance(member.id, todayService.id);
    if (success) {
      toast({
        title: 'Attendance marked!',
        description: `${member.full_name} has been marked present.`,
      });
    }
  };

  const handleQRScan = async (qrCode: string) => {
    const member = await searchByQRCode(qrCode);
    
    if (!member) {
      toast({
        title: 'Member not found',
        description: 'No member found with this QR code.',
        variant: 'destructive',
      });
      return;
    }

    await handleMarkAttendance(member);
  };

  const handleNewMemberRegistered = async (memberData: NewMemberData) => {
    const member = await createMember(memberData);
    
    if (member && todayService) {
      await markAttendance(member.id, todayService.id);
      setIsNewMemberOpen(false);
      setSearchQuery('');
      toast({
        title: 'Member registered & marked!',
        description: `${member.full_name} has been registered and marked present.`,
      });
    }
  };

  const filteredBrowseMembers = useMemo(() => {
    return members.filter(m => {
      const matchesDept = deptFilter === 'all' || m.department === deptFilter;
      const isSearchMatch = !searchQuery || m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || m.phone.includes(searchQuery);
      return matchesDept && isSearchMatch && m.status !== 'inactive';
    });
  }, [members, deptFilter, searchQuery]);

  const departments = useMemo(() => {
    const depts = new Set(members.map(m => m.department).filter(Boolean));
    return ['all', ...Array.from(depts)];
  }, [members]);

  const showNoResults = searchQuery.trim() && !isSearching && searchResults.length === 0;

  if (attendanceLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Mark Attendance" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Mark Attendance" />

      <div className="p-6">
        {/* Offline Indicator */}
        <OfflineIndicator className="mb-4" />
        {/* Service Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-xl bg-primary p-6 text-primary-foreground"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary-foreground/80">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{today}</span>
              </div>
              <h2 className="mt-2 text-2xl font-bold">
                {serviceTypes.find((s) => s.value === serviceType)?.label}
              </h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
              <p className="text-sm text-primary-foreground/80">Marked Present</p>
              <p className="text-3xl font-bold">{todayAttendance.length + offlineMarkedIds.length}</p>
              </div>
              <Select
                value={serviceType}
                onValueChange={(v) => setServiceType(v as ServiceType)}
              >
                <SelectTrigger className="w-48 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        {canManageAttendance && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6 flex gap-3"
          >
            <Button onClick={() => setIsScannerOpen(true)} variant="outline" className="gap-2">
              <Camera className="h-4 w-4" />
              Scan QR Code
            </Button>
          </motion.div>
        )}

        {/* Attendance Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" />
              Search & Mark
            </TabsTrigger>
            <TabsTrigger value="browse" className="gap-2">
              <Users className="h-4 w-4" />
              Browse All
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input text-lg"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Type a name or phone number to find and mark attendance
              </p>
            </motion.div>
          </TabsContent>

          <TabsContent value="browse" className="mt-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Filter names..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={deptFilter} onValueChange={setDeptFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.filter(d => d !== 'all').map(d => (
                        <SelectItem key={d} value={d || 'None'}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Search Results / Browse List */}
        <AnimatePresence mode="wait">
          {activeTab === 'search' && searchQuery.trim() ? (
            <motion.div
              key="search-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {isSearching ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <>
                  {searchResults.map((member, index) => {
                    const isMarked = todayAttendance.includes(member.id) || offlineMarkedIds.includes(member.id);
                    return (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="attendance-item"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/10 text-primary text-lg">
                              {getInitials(member.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-lg font-medium">{member.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {member.phone} {member.department && `• ${member.department}`}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              member.status === 'active'
                                ? 'badge-active'
                                : member.status === 'first_timer'
                                ? 'badge-first-timer'
                                : 'badge-inactive'
                            }
                          >
                            {member.status === 'first_timer' ? 'First Timer' : member.status}
                          </Badge>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedMemberQR({ 
                              name: member.full_name, 
                              qrCode: member.qr_code || '' 
                            })}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {canManageAttendance && (
                          <Button
                            onClick={() => handleMarkAttendance(member)}
                            disabled={isMarked}
                            className={isMarked ? 'bg-success hover:bg-success' : 'btn-gold'}
                          >
                            {isMarked ? (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Present
                              </>
                            ) : (
                              'Mark Present'
                            )}
                          </Button>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* No Results - Register New Member */}
                  {showNoResults && canManageAttendance && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center"
                    >
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <UserPlus className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold">Member not found</h3>
                      <p className="mt-2 text-muted-foreground">
                        "{searchQuery}" is not in our records.
                      </p>
                      <Button
                        onClick={() => setIsNewMemberOpen(true)}
                        className="btn-gold mt-4"
                      >
                        <UserPlus className="mr-2 h-5 w-5" />
                        Register as New Member
                      </Button>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          ) : activeTab === 'browse' ? (
            <motion.div
              key="browse-list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredBrowseMembers.map((member, index) => {
                const isMarked = todayAttendance.includes(member.id) || offlineMarkedIds.includes(member.id);
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`flex items-center justify-between p-4 rounded-xl border border-border bg-card transition-all hover:shadow-md ${isMarked ? 'bg-success/5 border-success/20' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-sm truncate">{member.full_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{member.department || 'General'}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleMarkAttendance(member)}
                      disabled={isMarked}
                      className={`h-8 px-3 ${isMarked ? 'bg-success text-success-foreground' : 'btn-gold'}`}
                    >
                      {isMarked ? <Check className="h-4 w-4" /> : 'Mark'}
                    </Button>
                  </motion.div>
                );
              })}
              {filteredBrowseMembers.length === 0 && (
                <div key="no-members" className="col-span-full py-12 text-center text-muted-foreground">
                  No members found matching filters.
                </div>
              )}
            </motion.div>
          ) : !searchQuery.trim() ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-12 text-center"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Start searching</h3>
              <p className="mt-2 text-muted-foreground">
                Enter a member's name or phone number to mark their attendance, or browse the list.
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

      {/* Dialogs */}
      <NewMemberDialog
        open={isNewMemberOpen}
        onOpenChange={setIsNewMemberOpen}
        onMemberCreated={handleNewMemberRegistered}
        initialName={searchQuery}
      />

      <QRScanner
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleQRScan}
      />

      {selectedMemberQR && (
        <QRCodeDisplay
          open={!!selectedMemberQR}
          onOpenChange={() => setSelectedMemberQR(null)}
          memberName={selectedMemberQR.name}
          qrCode={selectedMemberQR.qrCode}
        />
      )}
      </div>
    </div>
  );
}
