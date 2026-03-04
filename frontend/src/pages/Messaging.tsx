import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Send, Search, Plus, Trash2, Users, Filter,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useSMS } from '@/hooks/useSMS';
import { useMembers } from '@/hooks/useMembers';
import { useFollowUp } from '@/hooks/useFollowUp';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const departments = [
  'Member', 'Choir', 'Ushering', 'Protocol', 'Media', 'Children',
  'Youth', 'Prayer', 'Welfare', 'Technical', 'Evangelism',
];

export default function Messaging() {
  const { templates, messages, loading, sendSMS, createTemplate, deleteTemplate, checkStatus } = useSMS();
  const { members } = useMembers();
  const { followUpList } = useFollowUp();
  const { isAdmin } = useAuth();

  const [message, setMessage] = useState('');
  const [recipientFilter, setRecipientFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTmplName, setNewTmplName] = useState('');
  const [newTmplBody, setNewTmplBody] = useState('');
  const [smsStatus, setSmsStatus] = useState<{ connected: boolean; provider?: string; balance?: string } | null>(null);

  useEffect(() => {
    checkStatus().then(setSmsStatus);
  }, [checkStatus]);

  const recipients = useMemo(() => {
    let list = members;
    if (recipientFilter === 'follow_up') {
      const followUpIds = new Set(followUpList.map(f => f.member?.id || f.id));
      list = members.filter(m => followUpIds.has(m.id));
    } else if (recipientFilter === 'active') {
      list = members.filter(m => m.status === 'active');
    } else if (recipientFilter === 'inactive') {
      list = members.filter(m => m.status === 'inactive');
    } else if (recipientFilter === 'first_timer') {
      list = members.filter(m => m.status === 'first_timer');
    }
    if (departmentFilter !== 'all') {
      list = list.filter(m => m.department === departmentFilter);
    }
    if (searchQuery) {
      list = list.filter(m =>
        m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.phone.includes(searchQuery)
      );
    }
    return list;
  }, [members, recipientFilter, departmentFilter, searchQuery, followUpList]);

  const handleSend = async () => {
    if (!message.trim() || recipients.length === 0) return;
    setSending(true);
    await sendSMS(
      recipients.map(r => ({ id: r.id, phone: r.phone, name: r.full_name })),
      message
    );
    setSending(false);
    setMessage('');
  };

  const handleCreateTemplate = async () => {
    if (!newTmplName || !newTmplBody) return;
    await createTemplate(newTmplName, newTmplBody);
    setShowNewTemplate(false);
    setNewTmplName('');
    setNewTmplBody('');
  };

  const handleTemplateSelect = (templateId: string) => {
    const tmpl = templates.find(t => t.id === templateId);
    if (tmpl) setMessage(tmpl.body);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Messaging" subtitle="Send SMS to members" />
        <div className="p-6 space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Messaging" subtitle="Send SMS to members" />

      <div className="px-6 flex items-center justify-between pointer-events-none -mt-4 mb-2">
        <div />
        {smsStatus && (
          <div className="pointer-events-auto flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border shadow-sm">
            <div className={`h-2 w-2 rounded-full ${smsStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {smsStatus.connected ? `${smsStatus.provider} Active` : 'Provider Offline'}
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <Tabs defaultValue="compose">
          <TabsList className="mb-6">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="history">History ({messages.length})</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {/* Compose Tab */}
          <TabsContent value="compose">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Recipient Selection */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-4 w-4" /> Recipients
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select value={recipientFilter} onValueChange={setRecipientFilter}>
                      <SelectTrigger><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Members</SelectItem>
                        <SelectItem value="active">Active Members</SelectItem>
                        <SelectItem value="inactive">Inactive Members</SelectItem>
                        <SelectItem value="first_timer">First Timers</SelectItem>
                        <SelectItem value="follow_up">Follow-Up List</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger><SelectValue placeholder="All Departments" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                    </div>

                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center">
                      <p className="text-2xl font-bold text-primary">{recipients.length}</p>
                      <p className="text-xs text-muted-foreground">recipients selected</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Message Compose */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MessageSquare className="h-4 w-4" /> Message
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {templates.length > 0 && (
                      <Select onValueChange={handleTemplateSelect}>
                        <SelectTrigger><SelectValue placeholder="Use a template..." /></SelectTrigger>
                        <SelectContent>
                          {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}

                    <Textarea
                      placeholder="Type your message... Use {name} for personalization."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      className="text-base"
                    />

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {message.length} chars • {Math.ceil(message.length / 160 || 1)} page(s)
                      </p>
                      <Button onClick={handleSend} disabled={!message.trim() || recipients.length === 0 || sending} className="btn-gold">
                        {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <><Send className="mr-2 h-4 w-4" />Send to {recipients.length} member{recipients.length !== 1 ? 's' : ''}</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map(msg => (
                    <TableRow key={msg.id}>
                      <TableCell className="font-medium">{msg.recipient_name}</TableCell>
                      <TableCell>{msg.recipient_phone}</TableCell>
                      <TableCell className="max-w-xs truncate">{msg.message}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={msg.status === 'sent' ? 'badge-active' : msg.status === 'failed' ? 'badge-inactive' : 'badge-first-timer'}>
                          {msg.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(msg.sent_at).toLocaleString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {messages.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">No messages sent yet</div>
              )}
            </motion.div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex justify-end">
                {isAdmin && (
                  <Button onClick={() => setShowNewTemplate(true)} className="btn-gold">
                    <Plus className="mr-2 h-4 w-4" /> New Template
                  </Button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {templates.map(t => (
                  <Card key={t.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{t.name}</h4>
                        {isAdmin && (
                          <Button variant="ghost" size="icon" onClick={() => deleteTemplate(t.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{t.body}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* New Template Dialog */}
      <Dialog open={showNewTemplate} onOpenChange={setShowNewTemplate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New SMS Template</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Template name" value={newTmplName} onChange={e => setNewTmplName(e.target.value)} />
            <Textarea placeholder="Message body. Use {name} for personalization." value={newTmplBody} onChange={e => setNewTmplBody(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTemplate(false)}>Cancel</Button>
            <Button onClick={handleCreateTemplate} className="btn-gold">Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
