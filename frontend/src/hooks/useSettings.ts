import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface ChurchSettings {
  id: string;
  church_name: string;
  address: string | null;
  contact_email: string | null;
  attendance_reminders: boolean;
  new_member_alerts: boolean;
  weekly_reports: boolean;
  updated_at: string;
}

export function useSettings() {
  const [settings, setSettings] = useState<ChurchSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings/');
      setSettings(response.data);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateSettings = async (updates: Partial<Omit<ChurchSettings, 'id' | 'updated_at'>>): Promise<boolean> => {
    try {
      setSaving(true);
      await api.patch('/settings/', updates);
      setSettings(prev => prev ? { ...prev, ...updates } : null);

      toast({
        title: 'Settings Saved',
        description: 'Your changes have been saved successfully.',
      });

      return true;
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (newPassword: string): Promise<boolean> => {
    try {
      await api.post('/auth/password/change/', {
        new_password: newPassword,
      });

      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully.',
      });

      return true;
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to change password',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    saving,
    updateSettings,
    changePassword,
    fetchSettings,
  };
}
