import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface FollowUpMember {
  id: string;
  member: {
    id: string;
    full_name: string;
    phone: string;
    department: string | null;
    status: string;
  };
  missed_consecutive_count: number;
  last_attended_date: string | null;
  needs_follow_up: boolean;
  follow_up_notes: string | null;
  updated_at: string;
}

export function useFollowUp() {
  const [followUpList, setFollowUpList] = useState<FollowUpMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchFollowUps = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/follow-ups/');
      setFollowUpList(response.data);
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load follow-up list',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const calculateFollowUps = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      await api.post('/follow-ups/calculate/');
      await fetchFollowUps();
      toast({
        title: 'Calculation Complete',
        description: 'Follow-up list has been updated.',
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error calculating follow-ups:', error);
      }
      toast({
        title: 'Error',
        description: 'Failed to recalculate follow-up list',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFollowUps();
    }
  }, [user, fetchFollowUps]);

  const updateFollowUpNotes = async (memberId: string, notes: string): Promise<boolean> => {
    try {
      // Find the follow-up record ID for this member
      const followUp = followUpList.find(f => f.member.id === memberId);
      if (!followUp) return false;

      await api.patch(`/follow-ups/${followUp.id}/`, { follow_up_notes: notes });

      toast({
        title: 'Notes Updated',
        description: 'Follow-up notes have been saved.',
      });

      await fetchFollowUps();
      return true;
    } catch (error) {
      console.error('Error updating notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notes',
        variant: 'destructive',
      });
      return false;
    }
  };

  const markAsFollowedUp = async (memberId: string): Promise<boolean> => {
    try {
      const followUp = followUpList.find(f => f.member.id === memberId);
      if (!followUp) return false;

      await api.patch(`/follow-ups/${followUp.id}/`, { needs_follow_up: false });

      toast({
        title: 'Marked Complete',
        description: 'Member has been marked as followed up.',
      });

      await fetchFollowUps();
      return true;
    } catch (error) {
      console.error('Error marking follow-up:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
      return false;
    }
  };

  const exportFollowUpList = () => {
    const csvContent = [
      ['Name', 'Phone', 'Department', 'Missed Services', 'Last Attended', 'Notes'].join(','),
      ...followUpList.map(item => [
        `"${item.member.full_name}"`,
        item.member.phone,
        item.member.department || 'N/A',
        item.missed_consecutive_count,
        item.last_attended_date || 'Never',
        `"${item.follow_up_notes || ''}"`,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `follow_up_list_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return {
    followUpList,
    loading,
    calculateFollowUps,
    updateFollowUpNotes,
    markAsFollowedUp,
    exportFollowUpList,
  };
}
