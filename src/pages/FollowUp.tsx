import { useState } from 'react';
import { motion } from 'framer-motion';
import { SendSMSDialog } from '@/components/sms/SendSMSDialog';
import {
  AlertTriangle,
  Phone,
  Calendar,
  Download,
  MessageSquare,
  Check,
  Search,
  Send,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useFollowUp } from '@/hooks/useFollowUp';
import { Skeleton } from '@/components/ui/skeleton';

export default function FollowUp() {
  const { followUpList, loading, updateFollowUpNotes, markAsFollowedUp, exportFollowUpList } = useFollowUp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [smsTarget, setSmsTarget] = useState<{ id: string; phone: string; name: string } | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredList = followUpList.filter(item =>
    item.members.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.members.phone.includes(searchQuery)
  );

  const handleOpenNotes = (memberId: string, existingNotes: string | null) => {
    setSelectedMember(memberId);
    setNotes(existingNotes || '');
  };

  const handleSaveNotes = async () => {
    if (selectedMember) {
      await updateFollowUpNotes(selectedMember, notes);
      setSelectedMember(null);
      setNotes('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Follow-Up" subtitle="Members needing attention" />
        <div className="p-6 space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Follow-Up" subtitle="Members needing attention" />

      <div className="p-6">
        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="border-warning/30 bg-warning/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                Members Needing Follow-Up
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{followUpList.length}</p>
              <p className="text-sm text-muted-foreground">
                Members who missed 2+ consecutive services
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Export */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button onClick={exportFollowUpList} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export List
          </Button>
        </motion.div>

        {/* Follow-up List */}
        <div className="space-y-4">
          {filteredList.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-border bg-card p-12 text-center"
            >
              <Check className="mx-auto h-12 w-12 text-success" />
              <h3 className="mt-4 text-xl font-semibold">All Caught Up!</h3>
              <p className="mt-2 text-muted-foreground">
                No members currently need follow-up.
              </p>
            </motion.div>
          ) : (
            filteredList.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-warning/10 text-warning">
                        {getInitials(item.members.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{item.members.full_name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {item.members.phone}
                        </span>
                        {item.members.department && (
                          <span>• {item.members.department}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Badge variant="destructive" className="w-fit">
                      Missed {item.missed_consecutive_count} services
                    </Badge>
                    
                    {item.last_attended_date && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Last: {new Date(item.last_attended_date).toLocaleDateString('en-NG', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                   <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSmsTarget({ id: item.member_id, phone: item.members.phone, name: item.members.full_name })}
                    >
                      <Send className="mr-1 h-4 w-4" />
                      SMS
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenNotes(item.member_id, item.follow_up_notes)}
                    >
                      <MessageSquare className="mr-1 h-4 w-4" />
                      Notes
                    </Button>
                    <Button
                      size="sm"
                      className="btn-gold"
                      onClick={() => markAsFollowedUp(item.member_id)}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Done
                    </Button>
                  </div>
                </div>

                {item.follow_up_notes && (
                  <div className="mt-3 rounded-lg bg-muted/50 p-3">
                    <p className="text-sm text-muted-foreground">
                      <strong>Notes:</strong> {item.follow_up_notes}
                    </p>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Notes Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Follow-Up Notes</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Add notes about the follow-up..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedMember(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes} className="btn-gold">
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {smsTarget && (
        <SendSMSDialog
          open={!!smsTarget}
          onOpenChange={(open) => { if (!open) setSmsTarget(null); }}
          recipients={[smsTarget]}
        />
      )}
    </div>
  );
}
