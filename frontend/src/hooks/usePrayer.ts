import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface PrayerRequest {
  id: string;
  member: string | null;
  member_name?: string;
  requester_name: string | null;
  request_text: string;
  is_anonymous: boolean;
  status: 'pending' | 'praying' | 'answered';
  created_at: string;
  updated_at: string;
}

export function usePrayer() {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/prayer-requests/');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching prayer requests:', error);
      // Optional: only toast if they have permission to see them
    } finally {
      setLoading(false);
    }
  }, []);

  const submitRequest = async (data: Partial<PrayerRequest>) => {
    try {
      const response = await api.post('/prayer-requests/', data);
      toast({
        title: 'Request Submitted',
        description: 'Your prayer request has been received. The prayer team will stand with you.',
      });
      await fetchRequests();
      return response.data;
    } catch (error) {
      console.error('Error submitting prayer request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit prayer request.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateStatus = async (id: string, action: 'mark_as_prayed' | 'mark_as_answered') => {
    try {
      await api.post(`/prayer-requests/${id}/${action}/`);
      toast({
        title: 'Status Updated',
        description: `Request marked as ${action === 'mark_as_prayed' ? 'praying' : 'answered'}.`,
      });
      await fetchRequests();
      return true;
    } catch (error) {
      console.error('Error updating prayer status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update prayer status.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteRequest = async (id: string) => {
    try {
      await api.delete(`/prayer-requests/${id}/`);
      toast({
        title: 'Request Deleted',
        description: 'Prayer request has been removed.',
      });
      await fetchRequests();
      return true;
    } catch (error) {
      console.error('Error deleting prayer request:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user, fetchRequests]);

  return {
    requests,
    loading,
    fetchRequests,
    submitRequest,
    updateStatus,
    deleteRequest,
  };
}
