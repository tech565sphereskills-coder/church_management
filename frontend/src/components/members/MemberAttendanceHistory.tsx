import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Loader2, Calendar, Clock, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface AttendanceRecord {
  id: string;
  marked_at: string;
  service: {
    id: string;
    name: string;
    service_date: string;
    service_type: string;
  };
}

interface MemberAttendanceHistoryProps {
  memberId: string;
}

const serviceTypeLabels: Record<string, string> = {
  sunday_service: 'Sunday Service',
  midweek_service: 'Midweek Service',
  special_program: 'Special Program',
};

function calculateStreak(records: AttendanceRecord[]): number {
  if (records.length === 0) return 0;
  // Records are sorted desc by marked_at; get unique service dates sorted desc
  const dates = [...new Set(records.map(r => r.service.service_date))].sort((a, b) => b.localeCompare(a));
  // A streak is consecutive service dates (not calendar days). Count from the most recent.
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    // If there's a gap > 10 days between services, break the streak
    const diff = (new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 10) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function MemberAttendanceHistory({ memberId }: MemberAttendanceHistoryProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalServices, setTotalServices] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/members/${memberId}/attendance/`);
        setRecords(response.data.records);
        setTotalServices(response.data.total_services);
      } catch (error) {
        console.error('Error fetching attendance history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [memberId]);

  const attendancePercentage = totalServices > 0 
    ? Math.round((records.length / totalServices) * 100) 
    : 0;

  const streak = calculateStreak(records);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Services Attended</span>
          </div>
          <p className="text-2xl font-bold">{records.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Attendance Rate</span>
          </div>
          <p className="text-2xl font-bold">{attendancePercentage}%</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Flame className="h-4 w-4" />
            <span className="text-sm">Current Streak</span>
          </div>
          <p className="text-2xl font-bold">{streak} <span className="text-sm font-normal text-muted-foreground">services</span></p>
        </div>
      </div>

      {/* History Table */}
      {records.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No attendance records found</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Checked In</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.service.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {serviceTypeLabels[record.service.service_type] || record.service.service_type}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(record.service.service_date), 'MMM d, yyyy')}</TableCell>
                <TableCell className="text-muted-foreground">{format(new Date(record.marked_at), 'h:mm a')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
