import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export interface AuditLog {
  id: string;
  user_name: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'export';
  model_name: string;
  object_id: string;
  object_name: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface PaginatedAuditLogs {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLog[];
}

export function useAuditLogs(page: number = 1, search: string = '', action: string = 'all') {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ['audit-logs', page, search, action],
    queryFn: async () => {
      const params: Record<string, string | number> = { page };
      if (search) params.search = search;
      if (action && action !== 'all') params.action = action;
      
      const response = await api.get<PaginatedAuditLogs>('/audit-logs/', { params });
      return response.data;
    },
    enabled: !!user && isAdmin,
  });
}
