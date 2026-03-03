import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { motion } from 'framer-motion';
import { format, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, Search, Filter, Download, User, Clock, Shield } from 'lucide-react';
import { useAttendanceHistory } from '@/hooks/useAttendanceHistory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useMemo } from 'react';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  sunday_service: 'Sunday Service',
  midweek_service: 'Midweek Service',
  special_program: 'Special Program',
};

export default function History() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });
  const [serviceType, setServiceType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [markedByNames, setMarkedByNames] = useState<Record<string, string>>({});

  const { records, stats, loading } = useAttendanceHistory(dateRange, serviceType, searchQuery);

  // Fetch marked_by profile names
  useEffect(() => {
    const fetchMarkedByProfiles = async () => {
      // Get all unique marked_by user IDs from attendance records
      const { data } = await supabase
        .from('attendance_records')
        .select('marked_by')
        .not('marked_by', 'is', null);

      if (!data) return;
      const uniqueIds = [...new Set(data.map(r => r.marked_by).filter(Boolean))] as string[];
      if (uniqueIds.length === 0) return;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', uniqueIds);

      if (profiles) {
        const map: Record<string, string> = {};
        profiles.forEach(p => { map[p.id] = p.full_name || p.email; });
        setMarkedByNames(map);
      }
    };
    fetchMarkedByProfiles();
  }, []);

  // Fetch marked_by for each record
  const [recordMarkedBy, setRecordMarkedBy] = useState<Record<string, string | null>>({});
  
  useEffect(() => {
    const fetchRecordMarkedBy = async () => {
      if (records.length === 0) return;
      // Get attendance records with marked_by
      const { data } = await supabase
        .from('attendance_records')
        .select('id, marked_by');
      
      if (data) {
        const map: Record<string, string | null> = {};
        data.forEach(r => { map[r.id] = r.marked_by; });
        setRecordMarkedBy(map);
      }
    };
    fetchRecordMarkedBy();
  }, [records]);

  const exportToCSV = () => {
    const headers = ['Member Name', 'Service Date', 'Service Type', 'Service Name', 'Marked At', 'Marked By'];
    const rows = records.map((record) => [
      record.member_name,
      record.service_date,
      SERVICE_TYPE_LABELS[record.service_type] || record.service_type,
      record.service_name,
      format(new Date(record.marked_at), 'PPp'),
      recordMarkedBy[record.id] ? (markedByNames[recordMarkedBy[record.id]!] || 'Unknown') : '-',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <Header title="Attendance History" subtitle="View past attendance records" />

      <div className="p-6">
        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalServices}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalAttendance}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average per Service
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.averageAttendance}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sunday Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {stats.attendanceByType['sunday_service'] || 0}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6 flex flex-wrap items-center gap-4"
        >
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by member or service name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[240px] justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  'Pick a date range'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Service Type Filter */}
          <Select value={serviceType} onValueChange={setServiceType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Service Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="sunday_service">Sunday Service</SelectItem>
              <SelectItem value="midweek_service">Midweek Service</SelectItem>
              <SelectItem value="special_program">Special Program</SelectItem>
            </SelectContent>
          </Select>

          {/* Export Button */}
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </motion.div>

        {/* Records Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border bg-card"
        >
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No Records Found</h3>
              <p className="text-muted-foreground">
                No attendance records match your current filters.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Service Date</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Checked In</TableHead>
                  <TableHead>Marked By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{record.member_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.service_date && format(new Date(record.service_date), 'PPP')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          record.service_type === 'sunday_service' && 'border-primary/30 bg-primary/10 text-primary',
                          record.service_type === 'midweek_service' && 'border-rccg-green/30 bg-rccg-green/10 text-rccg-green',
                          record.service_type === 'special_program' && 'border-accent/30 bg-accent/10 text-accent'
                        )}
                      >
                        {SERVICE_TYPE_LABELS[record.service_type] || record.service_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.service_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(record.marked_at), 'p')}
                    </TableCell>
                    <TableCell>
                      {recordMarkedBy[record.id] ? (
                        <div className="flex items-center gap-1.5">
                          <Shield className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {markedByNames[recordMarkedBy[record.id]!] || 'Officer'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </motion.div>
      </div>
    </div>
  );
}
