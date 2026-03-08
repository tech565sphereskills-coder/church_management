import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  price: string;
  quantity: number;
  category: string;
  created_at: string;
  updated_at: string;
}

export function useInventory() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await api.get('/inventory/');
      return response.data;
    },
    enabled: !!user,
  });

  const createItem = async (itemData: Partial<InventoryItem>) => {
    try {
      await api.post('/inventory/', itemData);
      toast({ title: 'Success', description: 'Item added to inventory.' });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add item.', variant: 'destructive' });
    }
  };

  const updateItem = async (id: string, itemData: Partial<InventoryItem>) => {
    try {
      await api.patch(`/inventory/${id}/`, itemData);
      toast({ title: 'Success', description: 'Item updated.' });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update item.', variant: 'destructive' });
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await api.delete(`/inventory/${id}/`);
      toast({ title: 'Success', description: 'Item deleted.' });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete item.', variant: 'destructive' });
    }
  };

  return {
    items,
    isLoading,
    createItem,
    updateItem,
    deleteItem,
  };
}
