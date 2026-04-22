/**
 * Utility to prefetch lazy-loaded components.
 * By calling the same dynamic import used in React.lazy, 
 * we trigger the browser to download the chunk in the background.
 */

const prefetchMap: Record<string, () => Promise<any>> = {
  '/': () => import('../pages/Dashboard'),
  '/attendance': () => import('../pages/Attendance'),
  '/members': () => import('../pages/Members'),
  '/members/add': () => import('../pages/AddMember'),
  '/calendar': () => import('../pages/Calendar'),
  '/messaging': () => import('../pages/Messaging'),
  '/birthdays': () => import('../pages/BirthdayManager'),
  '/follow-up': () => import('../pages/FollowUp'),
  '/financials': () => import('../pages/Financials'),
  '/departments': () => import('../pages/Departments'),
  '/ministers': () => import('../pages/Ministers'),
  '/family': () => import('../pages/Family'),
  '/inventory': () => import('../pages/Inventory'),
  '/departments/reports': () => import('../pages/DepartmentReports'),
  '/children': () => import('../pages/Children'),
  '/prayer-requests': () => import('../pages/PrayerRequests'),
  '/history': () => import('../pages/History'),
  '/reports': () => import('../pages/Reports'),
  '/audit-logs': () => import('../pages/AuditLogs'),
  '/settings': () => import('../pages/Settings'),
  '/notifications': () => import('../pages/Notifications'),
};

export interface PrefetchContext {
  queryClient: import('@tanstack/react-query').QueryClient;
}

const prefetched = new Set<string>();
const prefetchedData = new Set<string>();

export const prefetchRoute = (path: string, context?: PrefetchContext) => {
  // 1. Prefetch Component Chunk
  if (!prefetched.has(path)) {
    const loader = prefetchMap[path];
    if (loader) {
      console.log(`[Prefetch] Component for ${path}`);
      loader().catch(() => {});
      prefetched.add(path);
    }
  }

  // 2. Prefetch Data (if context provided)
  if (context && !prefetchedData.has(path)) {
    const { queryClient } = context;
    if (path === '/') {
       queryClient.prefetchQuery({ queryKey: ['stats'], staleTime: 1000 * 60 * 5 });
       prefetchedData.add(path);
    } else if (path === '/members') {
       queryClient.prefetchQuery({ queryKey: ['members', 1, '', 'all'], staleTime: 1000 * 60 * 5 });
       prefetchedData.add(path);
    }
  }
};
