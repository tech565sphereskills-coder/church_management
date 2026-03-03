import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CalendarPlus, MapPin, Clock } from 'lucide-react';
import { EventType, CalendarEvent } from '@/hooks/useCalendar';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<CalendarEvent>) => Promise<unknown>;
  event?: CalendarEvent | null;
}

export function EventDialog({ open, onOpenChange, onSave, event }: EventDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'service' as EventType,
    start_time: '',
    end_time: '',
    location: '',
  });

  useEffect(() => {
    if (open) {
      if (event) {
        setFormData({
          title: event.title,
          description: event.description || '',
          event_type: event.event_type,
          start_time: event.start_time.slice(0, 16),
          end_time: event.end_time.slice(0, 16),
          location: event.location || '',
        });
      } else {
        const now = new Date();
        const hour = new Date(now.getTime() + 60 * 60 * 1000);
        setFormData({
          title: '',
          description: '',
          event_type: 'service',
          start_time: now.toISOString().slice(0, 16),
          end_time: hour.toISOString().slice(0, 16),
          location: 'Main Sanctuary',
        });
      }
    }
  }, [open, event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save event', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <form onSubmit={handleSubmit}>
          <div className="bg-primary/5 p-8 border-b border-primary/10">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <CalendarPlus className="h-6 w-6 text-primary" />
              </div>
              <DialogHeader className="p-0">
                <DialogTitle className="text-2xl font-bold text-slate-900">
                  {event ? 'Edit Activity' : 'Schedule Activity'}
                </DialogTitle>
                <DialogDescription className="text-slate-500 font-medium">
                  Plan church services, group meetings, or conferences.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-slate-500">Activity Title</Label>
              <Input
                id="title"
                placeholder="e.g. Midweek Communion Service"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-12 rounded-xl border-slate-200 focus:ring-primary shadow-none"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider text-slate-500">Activity Category</Label>
              <Select
                value={formData.event_type}
                onValueChange={(val) => setFormData({ ...formData, event_type: val as EventType })}
              >
                <SelectTrigger id="type" className="h-12 rounded-xl border-slate-200">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Church Service</SelectItem>
                  <SelectItem value="meeting">Group Meeting</SelectItem>
                  <SelectItem value="conference">Conference / Seminar</SelectItem>
                  <SelectItem value="special">Special Program</SelectItem>
                  <SelectItem value="rehearsal">Rehearsal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Starts At
                </Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="h-12 rounded-xl border-slate-200 focus:ring-primary shadow-none"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Ends At
                </Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="h-12 rounded-xl border-slate-200 focus:ring-primary shadow-none"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="loc" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Venue / Location
              </Label>
              <Input
                id="loc"
                placeholder="e.g. Main Auditorium"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="h-12 rounded-xl border-slate-200 focus:ring-primary shadow-none"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="desc" className="text-xs font-bold uppercase tracking-wider text-slate-500">Brief Description</Label>
              <Textarea
                id="desc"
                placeholder="Add agenda or highlights..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="rounded-xl border-slate-200 focus:ring-primary shadow-none resize-none h-24"
              />
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                className="h-12 rounded-xl px-6 flex-1 border-slate-200 font-bold"
            >
              Cancel
            </Button>
            <Button 
                type="submit" 
                disabled={loading} 
                className="h-12 rounded-xl px-8 flex-[2] bg-slate-900 hover:bg-slate-800 text-white shadow-lg font-bold"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarPlus className="h-4 w-4 mr-2" />}
              {event ? 'Save Changes' : 'Schedule Activity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
