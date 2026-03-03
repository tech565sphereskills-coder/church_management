import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { useSMS } from '@/hooks/useSMS';

interface SendSMSDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: { id: string | null; phone: string; name: string }[];
}

export function SendSMSDialog({ open, onOpenChange, recipients }: SendSMSDialogProps) {
  const { templates, sendSMS } = useSMS();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleTemplateSelect = (templateId: string) => {
    const tmpl = templates.find(t => t.id === templateId);
    if (tmpl) setMessage(tmpl.body);
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    await sendSMS(recipients, message);
    setSending(false);
    setMessage('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Send SMS
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              To: <strong>{recipients.length === 1 ? recipients[0].name : `${recipients.length} recipients`}</strong>
            </p>
          </div>

          {templates.length > 0 && (
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Use a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Textarea
            placeholder="Type your message... Use {name} to insert recipient's name."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />

          <p className="text-xs text-muted-foreground">
            {message.length} characters • {Math.ceil(message.length / 160)} SMS page(s)
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={!message.trim() || sending} className="btn-gold">
            {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <><Send className="mr-2 h-4 w-4" />Send</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
