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

  const get2FAStatus = async (): Promise<boolean> => {
    try {
      const response = await api.get('/two-factor/status/');
      return response.data.is_enabled;
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
      return false;
    }
  };

  const enable2FA = async (): Promise<{ qr_code: string; secret: string } | null> => {
    try {
      const response = await api.post('/two-factor/enable/');
      return response.data;
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize 2FA setup',
        variant: 'destructive',
      });
      return null;
    }
  };

  const verify2FA = async (token: string): Promise<boolean> => {
    try {
      await api.post('/two-factor/verify/', { token });
      toast({
        title: '2FA Enabled',
        description: 'Two-Factor Authentication is now active on your account.',
      });
      return true;
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast({
        title: 'Verification Failed',
        description: 'Invalid token. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const disable2FA = async (token: string): Promise<boolean> => {
    try {
      await api.post('/two-factor/disable/', { token });
      toast({
        title: '2FA Disabled',
        description: 'Two-Factor Authentication has been removed.',
      });
      return true;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: 'Error',
        description: 'Invalid token. Failed to disable 2FA.',
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
    get2FAStatus,
    enable2FA,
    verify2FA,
    disable2FA,
    fetchSettings,
  };
}
