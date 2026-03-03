import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HandHelping, 
  Send, 
  CheckCircle2, 
  Clock, 
  User, 
  UserX,
  Plus,
  Filter,
  MoreVertical,
  Check,
  MessageSquare,
  HelpingHand
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { usePrayer, PrayerRequest } from '@/hooks/usePrayer';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function PrayerRequests() {
  const { requests, loading, submitRequest, updateStatus, deleteRequest } = usePrayer();
  const { user, isPrayerOfficer, isAdmin } = useAuth();
  
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'praying' | 'answered'>('all');
  
  const [newRequest, setNewRequest] = useState({
    requester_name: '',
    request_text: '',
    is_anonymous: false,
  });

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submitRequest(newRequest);
    if (success) {
      setIsSubmitOpen(false);
      setNewRequest({ requester_name: '', request_text: '', is_anonymous: false });
    }
  };

  const getStatusBadge = (status: PrayerRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1 border-warning/30 bg-warning/5 text-warning"><Clock className="h-3 w-3" /> Still Pending</Badge>;
      case 'praying':
        return <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary"><HelpingHand className="h-3 w-3" /> Currently Praying</Badge>;
      case 'answered':
        return <Badge variant="outline" className="gap-1 border-success/30 bg-success/5 text-success"><CheckCircle2 className="h-3 w-3" /> Answered Prayer</Badge>;
    }
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="Prayer Request Tracker" 
        subtitle="Submit requests and stand in faith with our prayer team."
      />

      <div className="p-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className="rounded-full"
            >
              All
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
              className="rounded-full"
            >
              Pending
            </Button>
            <Button
              variant={filter === 'praying' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('praying')}
              className="rounded-full"
            >
              Praying
            </Button>
            <Button
              variant={filter === 'answered' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('answered')}
              className="rounded-full"
            >
              Answered
            </Button>
          </div>

          <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-primary">
                <Plus className="h-4 w-4" />
                Submit Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Send a Prayer Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                {!user && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      value={newRequest.requester_name}
                      onChange={(e) => setNewRequest({...newRequest, requester_name: e.target.value})}
                      required={!newRequest.is_anonymous}
                      disabled={newRequest.is_anonymous}
                      placeholder="Optional if anonymous"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="text">Prayer Need</Label>
                  <Textarea
                    id="text"
                    value={newRequest.request_text}
                    onChange={(e) => setNewRequest({...newRequest, request_text: e.target.value})}
                    required
                    rows={4}
                    placeholder="Describe what you would like us to pray about..."
                  />
                </div>
                <div className="flex items-center space-x-2 rounded-lg border p-3">
                  <Checkbox 
                    id="anonymous" 
                    checked={newRequest.is_anonymous}
                    onCheckedChange={(checked) => setNewRequest({...newRequest, is_anonymous: checked as boolean})}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="anonymous"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Keep Anonymous
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Only the prayer team will see the request text, not your name.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full gap-2">
                    <Send className="h-4 w-4" />
                    Submit to Prayer Team
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredRequests.map((req) => (
              <motion.div
                key={req.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={cn(
                  "relative h-full transition-all duration-300 hover:shadow-lg",
                  req.status === 'answered' && "border-success/20 bg-success/5"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {req.is_anonymous ? (
                          <div className="rounded-full bg-muted p-2">
                            <UserX className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="rounded-full bg-primary/10 p-2">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">
                            {req.is_anonymous ? 'Anonymous' : (req.member_name || req.requester_name || 'Guest User')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(req.created_at), 'MMM d, yyyy • HH:mm')}
                          </p>
                        </div>
                      </div>
                      
                      {(isAdmin || isPrayerOfficer) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {req.status === 'pending' && (
                              <DropdownMenuItem onClick={() => updateStatus(req.id, 'mark_as_prayed')}>
                                <HandHelping className="mr-2 h-4 w-4" />
                                Mark as Praying
                              </DropdownMenuItem>
                            )}
                            {req.status !== 'answered' && (
                              <DropdownMenuItem onClick={() => updateStatus(req.id, 'mark_as_answered')}>
                                <Check className="mr-2 h-4 w-4" />
                                Mark as Answered
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteRequest(req.id)}>
                              Delete Request
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 italic">
                      "{req.request_text}"
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0 border-t bg-muted/20 px-4 py-3 flex justify-between items-center">
                    {getStatusBadge(req.status)}
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      {req.is_anonymous ? 'Classified' : 'Public'}
                    </Badge>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredRequests.length === 0 && !loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-full bg-muted p-6">
                <MessageSquare className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">No prayer requests yet</h3>
              <p className="max-w-xs text-muted-foreground">
                Be the first to share a request or check different filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
