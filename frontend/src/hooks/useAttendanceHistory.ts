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
<<<<<<< HEAD
  searchQuery?: string
) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
=======
  searchQuery?: string,
  page: number = 1
) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
>>>>>>> e11383f (Added latest features)
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
<<<<<<< HEAD
      const params: Record<string, string> = {};
=======
      const params: Record<string, string> = { page: page.toString() };
>>>>>>> e11383f (Added latest features)
      if (dateRange.from) params.from_date = format(dateRange.from, 'yyyy-MM-dd');
      if (dateRange.to) params.to_date = format(dateRange.to, 'yyyy-MM-dd');
      if (serviceType && serviceType !== 'all') params.service_type = serviceType;
      if (searchQuery) params.search = searchQuery;

      const response = await api.get('/attendance/history/', { params });
<<<<<<< HEAD
      setRecords(response.data.records);
      setStats(response.data.stats);
=======
      
      // Handle DRF paginated response
      if (response.data.results) {
        setRecords(response.data.results.records);
        setStats(response.data.results.stats);
        setTotalCount(response.data.count);
        setTotalPages(Math.ceil(response.data.count / 20));
      } else {
        setRecords(response.data.records);
        setStats(response.data.stats);
        setTotalCount(response.data.records.length);
        setTotalPages(1);
      }
>>>>>>> e11383f (Added latest features)
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
<<<<<<< HEAD
  }, [dateRange.from, dateRange.to, serviceType, searchQuery, toast]);
=======
  }, [dateRange.from, dateRange.to, serviceType, searchQuery, page, toast]);
>>>>>>> e11383f (Added latest features)

  useEffect(() => {
    fetchAttendanceHistory();
  }, [fetchAttendanceHistory]);

<<<<<<< HEAD
  return { records, stats, loading, refetch: fetchAttendanceHistory };
=======
  return { records, stats, loading, totalCount, totalPages, refetch: fetchAttendanceHistory };
>>>>>>> e11383f (Added latest features)
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
