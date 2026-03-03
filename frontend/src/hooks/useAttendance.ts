import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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
  member_id: string;
  service_id: string;
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
  const [todayService, setTodayService] = useState<Service | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchServices = useCallback(async () => {
    try {
      const response = await api.get('/services/');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  }, []);

  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  useEffect(() => {
    if (user) {
      fetchServices();
    }
  }, [user, fetchServices]);

  const getOrCreateTodayService = useCallback(async (serviceType: ServiceType): Promise<Service | null> => {
    const today = getTodayDateString();
    
    try {
      // First, try to find existing service for today
      const response = await api.get('/services/', {
        params: { service_date: today, service_type: serviceType }
      });

      if (response.data.length > 0) {
        setTodayService(response.data[0]);
        return response.data[0];
      }

      // Create new service for today
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

      setTodayService(createResponse.data);
      await fetchServices(); // Refresh services list
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
  }, [toast, fetchServices]);

  const fetchTodayAttendance = useCallback(async (serviceId: string) => {
    try {
      const response = await api.get('/attendance/', {
        params: { service: serviceId }
      });
      setTodayAttendance(response.data.results.map((r: { member: string }) => r.member));
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  }, []);

  const markAttendance = async (memberId: string, serviceId: string): Promise<boolean> => {
    try {
      const response = await api.post('/attendance/', {
        member: memberId,
        service: serviceId,
      });

      setTodayAttendance(response.data.records.map((r: { member: string }) => r.member));
      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error marking attendance:', error);
        if (error.response?.status === 400 && error.response?.data?.non_field_errors) {
          toast({
            title: 'Already Marked',
            description: 'This member has already been marked present for this service.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to mark attendance',
          variant: 'destructive',
        });
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
    todayService,
    todayAttendance,
    services,
    loading,
    fetchServices,
    getOrCreateTodayService,
    fetchTodayAttendance,
    markAttendance,
    getAttendanceHistory,
    getAttendanceStats,
    setLoading,
  };
}
