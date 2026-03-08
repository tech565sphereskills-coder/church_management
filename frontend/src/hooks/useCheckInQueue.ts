import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface CheckInQueueItem {
  id: string;
  member: string | null;
  member_name: string | null;
  phone_number: string;
  service: string;
  service_name: string;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
}

export function useCheckInQueue() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['check-in-queue'],
    queryFn: async () => {
      const response = await api.get('/check-in-queue/');
      return (response.data.results || response.data) as CheckInQueueItem[];
    },
    // Poll every 10 seconds for new requests
    refetchInterval: 10000,
  });

  const confirmMutation = useMutation({
    mutationFn: async ({ id, phoneNumber }: { id: string; phoneNumber?: string }) => {
      const response = await api.post(`/check-in-queue/${id}/confirm/`, {
        phone_number: phoneNumber
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['check-in-queue'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({
        title: 'Check-in Confirmed',
        description: 'Member has been marked as present.',
      });
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast({
        title: 'Confirmation Failed',
        description: error.response?.data?.error || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/check-in-queue/${id}/reject/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['check-in-queue'] });
      toast({
        title: 'Check-in Rejected',
        description: 'The request has been removed.',
      });
    },
  });

  return {
    queue,
    loading: isLoading,
    confirm: confirmMutation.mutateAsync,
    reject: rejectMutation.mutateAsync,
    isConfirming: confirmMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}
