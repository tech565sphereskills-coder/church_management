import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface OfflineAttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  serviceId: string;
  serviceType: string;
  timestamp: string;
  synced: boolean;
}

const STORAGE_KEY = 'rccg_offline_attendance';

export function useOfflineAttendance() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingRecords, setPendingRecords] = useState<OfflineAttendanceRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load pending records from localStorage
  const loadPendingRecords = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const records: OfflineAttendanceRecord[] = JSON.parse(stored);
        setPendingRecords(records.filter(r => !r.synced));
      }
    } catch (error) {
      console.error('Error loading offline records:', error);
    }
  }, []);

  // Save records to localStorage
  const saveToStorage = useCallback((records: OfflineAttendanceRecord[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      setPendingRecords(records.filter(r => !r.synced));
    } catch (error) {
      console.error('Error saving offline records:', error);
    }
  }, []);

  // Add attendance record (works offline)
  const addOfflineRecord = useCallback((
    memberId: string,
    memberName: string,
    serviceId: string,
    serviceType: string
  ): OfflineAttendanceRecord => {
    const record: OfflineAttendanceRecord = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      memberId,
      memberName,
      serviceId,
      serviceType,
      timestamp: new Date().toISOString(),
      synced: false,
    };

    const stored = localStorage.getItem(STORAGE_KEY);
    const existingRecords: OfflineAttendanceRecord[] = stored ? JSON.parse(stored) : [];
    
    // Check if already exists (prevent duplicates)
    const exists = existingRecords.some(
      r => r.memberId === memberId && r.serviceId === serviceId && !r.synced
    );

    if (!exists) {
      const updatedRecords = [...existingRecords, record];
      saveToStorage(updatedRecords);
      
      toast({
        title: 'Saved Offline',
        description: `${memberName}'s attendance will sync when online.`,
      });
    }

    return record;
  }, [saveToStorage, toast]);

  // Sync pending records to database
  const syncPendingRecords = useCallback(async (): Promise<number> => {
    if (!isOnline || pendingRecords.length === 0 || isSyncing) {
      return 0;
    }

    setIsSyncing(true);
    let syncedCount = 0;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allRecords: OfflineAttendanceRecord[] = stored ? JSON.parse(stored) : [];

      for (const record of pendingRecords) {
        try {
          await api.post('/attendance/mark/', {
            member_id: record.memberId,
            service_id: record.serviceId,
            timestamp: record.timestamp,
          });

          const idx = allRecords.findIndex(r => r.id === record.id);
          if (idx !== -1) {
            allRecords[idx].synced = true;
          }
          syncedCount++;
        } catch (err: any) {
          // If duplicate or other error, handle it
          if (err.response?.status === 409) {
            const idx = allRecords.findIndex(r => r.id === record.id);
            if (idx !== -1) {
              allRecords[idx].synced = true;
            }
            syncedCount++;
          } else {
            console.error('Error syncing record:', err);
          }
        }
      }

      // Save updated records
      saveToStorage(allRecords);

      if (syncedCount > 0) {
        toast({
          title: 'Sync Complete',
          description: `${syncedCount} attendance record(s) synced successfully.`,
        });
      }

      // Clean up old synced records (keep last 100)
      const syncedRecords = allRecords.filter(r => r.synced);
      if (syncedRecords.length > 100) {
        const unsyncedRecords = allRecords.filter(r => !r.synced);
        const recentSynced = syncedRecords.slice(-100);
        saveToStorage([...recentSynced, ...unsyncedRecords]);
      }

      return syncedCount;
    } catch (error) {
      console.error('Error during sync:', error);
      return syncedCount;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, pendingRecords, isSyncing, user?.id, saveToStorage, toast]);

  // Clear all synced records
  const clearSyncedRecords = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const records: OfflineAttendanceRecord[] = JSON.parse(stored);
      const unsyncedOnly = records.filter(r => !r.synced);
      saveToStorage(unsyncedOnly);
    }
  }, [saveToStorage]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Back Online',
        description: 'Syncing pending attendance records...',
      });
      // Delay sync slightly to ensure connection is stable
      setTimeout(() => syncPendingRecords(), 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'You are Offline',
        description: 'Attendance will be saved locally and synced when online.',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingRecords, toast]);

  // Load records on mount
  useEffect(() => {
    loadPendingRecords();
  }, [loadPendingRecords]);

  // Auto-sync every 30 seconds when online
  useEffect(() => {
    if (!isOnline || pendingRecords.length === 0) return;

    const interval = setInterval(() => {
      syncPendingRecords();
    }, 30000);

    return () => clearInterval(interval);
  }, [isOnline, pendingRecords.length, syncPendingRecords]);

  return {
    isOnline,
    pendingRecords,
    pendingCount: pendingRecords.length,
    isSyncing,
    addOfflineRecord,
    syncPendingRecords,
    clearSyncedRecords,
  };
}
