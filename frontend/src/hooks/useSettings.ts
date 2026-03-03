import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
      
      const { data, error } = await supabase
        .from('church_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      setSettings(data);
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
    if (!settings?.id) return false;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('church_settings')
        .update({
          ...updates,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw error;

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
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully.',
      });

      return true;
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
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
