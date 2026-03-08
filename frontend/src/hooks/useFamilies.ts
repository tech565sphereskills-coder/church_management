import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface Family {
  id: string;
  name: string;
  head: string | null;
  head_name?: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export function useFamilies() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: families = [], isLoading } = useQuery({
    queryKey: ['families'],
    queryFn: async () => {
      const response = await api.get('/families/');
      return response.data;
    },
    enabled: !!user,
  });

  const createFamily = async (name: string, head?: string | null) => {
    try {
      await api.post('/families/', { name, head });
      toast({ title: 'Success', description: 'Family created successfully.' });
      queryClient.invalidateQueries({ queryKey: ['families'] });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create family.', variant: 'destructive' });
    }
  };

  const updateFamily = async (id: string, name: string, head?: string | null) => {
    try {
      await api.patch(`/families/${id}/`, { name, head });
      toast({ title: 'Success', description: 'Family updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['families'] });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update family.', variant: 'destructive' });
    }
  };

  return {
    families,
    isLoading,
    createFamily,
    updateFamily,
  };
}
