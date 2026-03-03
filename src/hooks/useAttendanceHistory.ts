import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  marked_at: string;
  member_id: string;
  member_name: string;
  service_date: string;
  service_type: string;
  service_name: string;
}

interface AttendanceStats {
  totalServices: number;
  totalAttendance: number;
  averageAttendance: number;
  attendanceByType: Record<string, number>;
}

export function useAttendanceHistory(
  dateRange: { from: Date | undefined; to: Date | undefined },
  serviceType?: string,
  searchQuery?: string
) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalServices: 0,
    totalAttendance: 0,
    averageAttendance: 0,
    attendanceByType: {},
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAttendanceHistory = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (dateRange.from) params.from_date = format(dateRange.from, 'yyyy-MM-dd');
      if (dateRange.to) params.to_date = format(dateRange.to, 'yyyy-MM-dd');
      if (serviceType && serviceType !== 'all') params.service_type = serviceType;
      if (searchQuery) params.search = searchQuery;

      const response = await api.get('/attendance/history/', { params });
      setRecords(response.data.records);
      setStats(response.data.stats);
    } catch (error: unknown) {
      console.error('Error fetching attendance history:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch attendance history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to, serviceType, searchQuery, toast]);

  useEffect(() => {
    fetchAttendanceHistory();
  }, [fetchAttendanceHistory]);

  return { records, stats, loading, refetch: fetchAttendanceHistory };
}

export function useMonthlyAttendanceData() {
  const [data, setData] = useState<{ date: string; attendance: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await api.get('/stats/monthly_attendance/');
        setData(response.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { data, loading };
}

export function useMemberGrowthData() {
  const [data, setData] = useState<{ month: string; totalMembers: number; newMembers: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await api.get('/stats/member_growth/');
        setData(response.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { data, loading };
}

export function useDepartmentDistribution() {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await api.get('/stats/department_distribution/');
        setData(response.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { data, loading };
}

export function useQuickStats() {
  const [stats, setStats] = useState({
    averageAttendance: 0,
    retentionRate: 0,
    firstTimerConversion: 0,
    inactiveMembers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await api.get('/stats/quick_stats/');
        setStats(response.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { stats, loading };
}
