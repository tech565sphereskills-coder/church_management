import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface ChurchSettings {
  id: string;
  church_name: string;
  address: string | null;
  contact_email: string | null;
  logo_url: string | null;
  attendance_reminders: boolean;
  new_member_alerts: boolean;
  weekly_reports: boolean;
  smtp_server: string | null;
  smtp_port: number;
  smtp_user: string | null;
  smtp_password: string | null;
  smtp_use_tls: boolean;
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      console.error('Error updating settings:', error);
      const axiosError = error as { response?: { data?: { error?: string; detail?: string } } };
      const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.detail || 'Failed to save settings';
      toast({
        title: 'Error',
        description: errorMessage,
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
    } catch (error: unknown) {
      console.error('Error changing password:', error);
      const axiosError = error as { response?: { data?: { detail?: string } } };
      toast({
        title: 'Error',
        description: axiosError.response?.data?.detail || 'Failed to change password',
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
