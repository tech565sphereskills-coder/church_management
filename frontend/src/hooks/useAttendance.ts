import { useCallback } from 'react';
import api from '@/lib/api';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export type ServiceType = 'sunday_service' | 'midweek_service' | 'special_program';

export interface Service {
  id: string;
  name: string;
  service_type: ServiceType;
  service_date: string;
  description: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  member: string; // member id
  service: string; // service id
  marked_by: string | null;
  marked_at: string;
}

export interface AttendanceWithMember extends AttendanceRecord {
  members: {
    id: string;
    full_name: string;
    phone: string;
    department: string | null;
    status: string;
  };
}

export function useAttendance() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Queries
  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await api.get('/services/');
      return response.data;
    },
    enabled: !!user,
  });

  // Query for today's services (usually only one active at a time)
  const { data: todayServices = [] } = useQuery({
    queryKey: ['services', 'today', getTodayDateString()],
    queryFn: async () => {
      const response = await api.get('/services/', {
        params: { service_date: getTodayDateString() }
      });
      return response.data as Service[];
    },
    enabled: !!user,
  });

  // Today's attendance for the first active service found today
  const activeServiceId = todayServices[0]?.id;
  const { data: todayAttendance = [] } = useQuery({
    queryKey: ['attendance', 'today', activeServiceId],
    queryFn: async () => {
      if (!activeServiceId) return [];
      const response = await api.get('/attendance/', {
        params: { service: activeServiceId }
      });
      // Handle potential pagination or raw array
      const results = (response.data.results || response.data) as AttendanceRecord[];
      return results.map((r) => r.member);
    },
    enabled: !!user && !!activeServiceId,
  });

  const fetchServices = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ['services'] });
  }, [queryClient]);

  const getOrCreateTodayService = async (serviceType: ServiceType): Promise<Service | null> => {
    const today = getTodayDateString();
    
    try {
      const response = await api.get('/services/', {
        params: { service_date: today, service_type: serviceType }
      });

      if (response.data.length > 0) {
        return response.data[0];
      }

      const serviceNames: Record<ServiceType, string> = {
        sunday_service: 'Sunday Service',
        midweek_service: 'Midweek Service',
        special_program: 'Special Program',
      };

      const createResponse = await api.post('/services/', {
        name: serviceNames[serviceType],
        service_type: serviceType,
        service_date: today,
      });

      queryClient.invalidateQueries({ queryKey: ['services'] });
      return createResponse.data;
    } catch (error) {
      console.error('Error getting/creating service:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize service',
        variant: 'destructive',
      });
      return null;
    }
  };

  const markAttendance = async (memberId: string, serviceId: string): Promise<boolean> => {
    try {
      await api.post('/attendance/', {
        member: memberId,
        service: serviceId,
      });

      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400 && error.response?.data?.non_field_errors) {
          toast({
            title: 'Already Marked',
            description: 'This member has already been marked present for this service.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description: error.response?.data?.detail || 'Failed to mark attendance',
            variant: 'destructive',
          });
        }
      }
      return false;
    }
  };

  const getAttendanceHistory = async (filters?: {
    startDate?: string;
    endDate?: string;
    serviceType?: ServiceType;
    memberId?: string;
  }) => {
    try {
      const response = await api.get('/attendance/', {
        params: {
          member: filters?.memberId,
          start_date: filters?.startDate,
          end_date: filters?.endDate,
          service_type: filters?.serviceType,
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      return [];
    }
  };

  const getAttendanceStats = async () => {
    try {
      const response = await api.get('/stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        todayAttendance: 0,
        totalMembers: 0,
        activeMembers: 0,
        weeklyAverage: 0,
      };
    }
  };

  return {
    todayService: todayServices[0] || null,
    todayAttendance,
    services,
    loading: servicesLoading,
    fetchServices,
    getOrCreateTodayService,
    fetchTodayAttendance: (id: string) => queryClient.invalidateQueries({ queryKey: ['attendance', 'today', id] }),
    markAttendance,
    getAttendanceHistory,
    getAttendanceStats,
    setLoading: (_loading: boolean) => {}, // No-op for compatibility
  };
}
