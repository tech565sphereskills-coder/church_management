import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const unreadCount = notifications.filter(n => !n.read).length;

  const notificationsRef = React.useRef<Notification[]>([]);
  
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const refreshNotifications = useCallback(async (showToast = false) => {
    if (!user) return;
    try {
      const response = await api.get('/notifications/');
      const newNotifications = response.data;
      
      if (showToast) {
        newNotifications.forEach((n: Notification) => {
          const isNew = !notificationsRef.current.find(prev => prev.id === n.id);
          if (isNew && !n.read) {
            toast[n.type as 'info' | 'success' | 'warning' | 'error' || 'info'](n.title, {
              description: n.description,
            });
          }
        });
      }
      
      setNotifications(newNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshNotifications();
      const interval = setInterval(() => refreshNotifications(true), 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [user, refreshNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/mark_as_read/`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark_all_as_read/');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const clearAll = async () => {
    try {
      await api.post('/notifications/clear_all/');
      setNotifications([]);
      toast.success('All notifications cleared');
    } catch (error) {
      toast.error('Failed to clear notifications');
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead,
      clearAll,
      refreshNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
