import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
    const { data, error } = await supabase
      .from('sms_templates')
      .select('*')
      .order('name');
    if (!error && data) setTemplates(data);
  }, []);

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('sms_messages')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(100);
    if (!error && data) setMessages(data);
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
      // Try to call edge function for actual sending
      const { data: fnData, error: fnError } = await supabase.functions.invoke('send-sms', {
        body: {
          recipients: recipients.map(r => ({
            phone: r.phone,
            name: r.name,
            message: messageTemplate.replace(/{name}/g, r.name),
          })),
        },
      });

      // Log each message regardless of edge function result
      const logs = recipients.map(r => ({
        recipient_id: r.id,
        recipient_phone: r.phone,
        recipient_name: r.name,
        message: messageTemplate.replace(/{name}/g, r.name),
        status: fnError ? 'failed' : 'sent',
        sent_by: user?.id,
      }));

      await supabase.from('sms_messages').insert(logs);

      if (fnError) {
        toast({
          title: 'SMS Queued',
          description: `${recipients.length} message(s) logged. Configure SMS provider to enable delivery.`,
        });
      } else {
        toast({
          title: 'SMS Sent',
          description: `${recipients.length} message(s) sent successfully.`,
        });
      }

      await fetchMessages();
      return true;
    } catch (error: any) {
      console.error('SMS error:', error);
      toast({ title: 'Error', description: 'Failed to send SMS', variant: 'destructive' });
      return false;
    }
  };

  const createTemplate = async (name: string, body: string) => {
    const { error } = await supabase.from('sms_templates').insert({
      name, body, created_by: user?.id,
    });
    if (error) {
      toast({ title: 'Error', description: 'Failed to create template', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Template Created', description: `"${name}" template saved.` });
    await fetchTemplates();
    return true;
  };

  const deleteTemplate = async (id: string) => {
    await supabase.from('sms_templates').delete().eq('id', id);
    await fetchTemplates();
  };

  return { templates, messages, loading, sendSMS, createTemplate, deleteTemplate, fetchMessages };
}
