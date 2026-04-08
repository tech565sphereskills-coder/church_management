import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  RefreshCw, 
  Search, 
  Filter, 
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Mail,
  Smartphone
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface FollowUpRecord {
  id: string;
  member: string;
  member_name: string;
  member_phone: string;
  member_email: string;
  missed_consecutive_count: number;
  last_attended_date: string | null;
  needs_follow_up: boolean;
  follow_up_notes: string | null;
}

interface SMSTemplate {
  id: string;
  name: string;
  body: string;
}

export default function FollowUp() {
  const { toast } = useToast();
  const [records, setRecords] = useState<FollowUpRecord[]>([]);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<FollowUpRecord | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recordsRes, templatesRes] = await Promise.all([
        api.get('/follow-ups/'),
        api.get('/sms-templates/')
      ]);
      setRecords(recordsRes.data);
      setTemplates(templatesRes.data);
    } catch (error) {
      console.error('Failed to fetch follow-up data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load follow-up records.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };


  const handleRecalculate = async () => {
    setIsCalculating(true);
    try {
      const res = await api.post('/follow-ups/calculate/');
      toast({
        title: 'Recalculation Complete',
        description: res.data.status,
      });
      await fetchData();
    } catch (error) {
      console.error('Recalculation failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to recalculate follow-ups.',
        variant: 'destructive',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSendFollowUp = async () => {
    if (!selectedRecord) return;
    setIsSending(true);
    try {
      await api.post(`/follow-ups/${selectedRecord.id}/send_message/`, {
        template_id: selectedTemplate !== 'custom' ? selectedTemplate : null,
        message: selectedTemplate === 'custom' ? customMessage : null
      });
      
      toast({
        title: 'Follow-up Sent',
        description: `Message sent to ${selectedRecord.member_name}.`,
      });
      
      setSelectedRecord(null);
      setCustomMessage('');
      setSelectedTemplate('');
      await fetchData();
    } catch (error) {
      console.error('Failed to send follow-up:', error);
      toast({
        title: 'Error',
        description: 'Failed to send follow-up message.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const filteredRecords = records.filter(r => 
    r.member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.member_phone?.includes(searchQuery)
  );

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title="Member Follow-up" />

      <div className="p-6 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">Retention Dashboard</h1>
            <p className="text-slate-500 text-sm md:text-base font-medium italic">Identification and follow-up for members missing in action.</p>
          </div>
          <Button 
            onClick={handleRecalculate} 
            disabled={isCalculating}
            className="btn-gold h-12 w-full sm:w-auto px-6 rounded-2xl shadow-lg shadow-primary/20"
          >
            <RefreshCw className={`mr-2 h-5 w-5 ${isCalculating ? 'animate-spin' : ''}`} />
            Run Recalculation
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-8">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 md:h-14 md:w-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
              <AlertCircle className="h-6 w-6 md:h-8 md:w-8" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-black uppercase text-slate-400 tracking-widest">Needs Attention</p>
              <p className="text-2xl md:text-3xl font-black text-slate-900">{records.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 md:h-14 md:w-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
              <Clock className="h-6 w-6 md:h-8 md:w-8" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-black uppercase text-slate-400 tracking-widest">Avg. Missed</p>
              <p className="text-2xl md:text-3xl font-black text-slate-900">
                {records.length > 0 ? (records.reduce((acc, r) => acc + r.missed_consecutive_count, 0) / records.length).toFixed(1) : '0'}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 md:h-14 md:w-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="h-6 w-6 md:h-8 md:w-8" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-black uppercase text-slate-400 tracking-widest">Templates</p>
              <p className="text-2xl md:text-3xl font-black text-slate-900">{templates.length}</p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search members..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 border-slate-200 rounded-xl focus:border-primary transition-all"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-48 h-11 border-slate-200 rounded-xl">
              <Filter className="mr-2 h-4 w-4 text-slate-400" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              <SelectItem value="high">High Priority (3+ missed)</SelectItem>
              <SelectItem value="new">Newly Missing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Record List */}
        <div className="grid gap-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 w-full bg-slate-200 animate-pulse rounded-2xl" />
            ))
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <Users className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900">All members accounted for!</h3>
              <p className="text-slate-400">Great job on member retention.</p>
            </div>
          ) : (
            filteredRecords.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 md:h-14 md:w-14 ring-4 ring-slate-50 group-hover:ring-primary/10 transition-all">
                      <AvatarFallback className="bg-primary/5 text-primary text-lg md:text-xl font-black">
                        {getInitials(record.member_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-900 text-base md:text-lg group-hover:text-primary transition-colors truncate">{record.member_name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="bg-rose-50 text-rose-600 border-none font-bold text-[10px] py-0">
                          {record.missed_consecutive_count} missed
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last: {record.last_attended_date || 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-none pt-3 sm:pt-0">
                    <div className="flex flex-col items-start sm:items-end sm:mr-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Contact</p>
                      <div className="flex gap-2 mt-1">
                        {record.member_phone && <Smartphone className="h-4 w-4 text-emerald-500" />}
                        {record.member_email && <Mail className="h-4 w-4 text-blue-500" />}
                      </div>
                    </div>
                    <Button 
                      onClick={() => setSelectedRecord(record)}
                      className="btn-gold h-10 px-4 md:h-11 md:px-6 rounded-xl font-bold flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="hidden xs:inline">Take Action</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Follow-up Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="sm:max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              Follow-up Action
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600 text-center text-sm">
              "We really missed you at our recent services. We hope all is well with you and your family."
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-black text-slate-700">Select Template</p>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Choose a message template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                  <SelectItem value="custom">Create Custom Message</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate === 'custom' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <p className="text-sm font-black text-slate-700">Custom Message</p>
                <Textarea 
                  placeholder="Write your personal message here..." 
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="min-h-[120px] rounded-xl border-slate-200 focus:border-primary transition-all"
                />
              </motion.div>
            )}

            {selectedTemplate && selectedTemplate !== 'custom' && (
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-sm text-slate-600">
                {templates.find(t => t.id === selectedTemplate)?.body.replace('{name}', selectedRecord?.member_name.split(' ')[0] || '')}
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button variant="ghost" onClick={() => setSelectedRecord(null)} className="rounded-xl h-12 font-bold">
              Cancel
            </Button>
            <Button 
              onClick={handleSendFollowUp} 
              disabled={isSending || !selectedTemplate}
              className="btn-gold flex-1 h-12 rounded-xl font-black shadow-lg shadow-primary/20"
            >
              {isSending ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Smartphone className="mr-2 h-5 w-5" />
                  SEND MESSAGE NOW
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
