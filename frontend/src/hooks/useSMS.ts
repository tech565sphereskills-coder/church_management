import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface SMSTemplate {
  id: string;
  name: string;
  body: string;
  created_at: string;
}

export interface SMSMessage {
  id: string;
  recipient_id: string | null;
  recipient_phone: string;
  recipient_name: string;
  message: string;
  status: string;
  sent_by: string | null;
  sent_at: string;
}

export function useSMS() {
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await api.get('/sms/templates/');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await api.get('/sms/messages/');
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      Promise.all([fetchTemplates(), fetchMessages()]).finally(() => setLoading(false));
    }
  }, [user, fetchTemplates, fetchMessages]);

  const sendSMS = async (
    recipients: { id: string | null; phone: string; name: string }[],
    messageTemplate: string
  ): Promise<boolean> => {
    try {
      await api.post('/sms/send/', {
        recipients,
        message: messageTemplate,
      });

      toast({
        title: 'SMS Sent',
        description: `${recipients.length} message(s) sent successfully.`,
      });

      await fetchMessages();
      return true;
    } catch (error: any) {
      console.error('SMS error:', error);
      toast({ title: 'Error', description: 'Failed to send SMS', variant: 'destructive' });
      return false;
    }
  };

  const createTemplate = async (name: string, body: string) => {
    try {
      await api.post('/sms/templates/', { name, body });
      toast({ title: 'Template Created', description: `"${name}" template saved.` });
      await fetchTemplates();
      return true;
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create template', variant: 'destructive' });
      return false;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await api.delete(`/sms/templates/${id}/`);
      await fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  return { templates, messages, loading, sendSMS, createTemplate, deleteTemplate, fetchMessages };
}
