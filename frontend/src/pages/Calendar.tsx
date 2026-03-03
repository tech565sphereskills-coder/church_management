import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Type,
  Calendar as CalendarIcon,
  Video,
  Users,
  Star,
  Info
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCalendar, CalendarEvent, EventType } from '@/hooks/useCalendar';
import { EventDialog } from '@/components/calendar/EventDialog';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';

export default function Calendar() {
  const { events, loading, createEvent, updateEvent } = useCalendar();
  const { isAdmin } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(parseISO(event.start_time), day));
  };

  const getEventTypeConfig = (type: EventType | 'service') => {
    switch (type) {
      case 'service': return { color: 'bg-emerald-500', icon: Star, label: 'Service' };
      case 'meeting': return { color: 'bg-blue-500', icon: Users, label: 'Meeting' };
      case 'conference': return { color: 'bg-purple-500', icon: Video, label: 'Conference' };
      case 'special': return { color: 'bg-orange-500', icon: Info, label: 'Special' };
      default: return { color: 'bg-slate-500', icon: Type, label: 'Other' };
    }
  };

  const selectedDayEvents = useMemo(() => getEventsForDay(selectedDate), [events, selectedDate]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50/50 dark:bg-slate-950">
      <Header title="Church Calendar" />
      
      <main className="flex-1 p-4 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-sm dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-9 w-9 rounded-lg">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="px-4 font-bold text-slate-900 dark:text-white min-w-[140px] text-center">
                  {format(currentMonth, 'MMMM yyyy')}
                </div>
                <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-9 w-9 rounded-lg">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              <Button variant="outline" onClick={handleToday} className="rounded-xl border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
                Today
              </Button>
            </div>

            {isAdmin && (
              <Button onClick={() => { setEditingEvent(null); setIsDialogOpen(true); }} className="btn-gold rounded-xl shadow-lg shadow-amber-200 dark:shadow-none h-11 px-6">
                <Plus className="mr-2 h-5 w-5" /> Schedule Activity
              </Button>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
            {/* Calendar Grid */}
            <Card className="overflow-hidden border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900">
              <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-4 text-center text-xs font-black uppercase tracking-widest text-slate-400">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((day, dayIdx) => {
                  const dayEvents = getEventsForDay(day);
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <motion.div
                      key={day.toString()}
                      whileHover={{ scale: 0.98 }}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "relative h-32 cursor-pointer border-r border-b border-slate-50 dark:border-slate-800 p-2 transition-colors",
                        !isCurrentMonth && "bg-slate-50/30 dark:bg-slate-950/30 opacity-40",
                        isSelected && "bg-primary/5 dark:bg-primary/10",
                        "hover:bg-slate-50 dark:hover:bg-slate-800/80"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold",
                          isToday ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-500"
                        )}>
                          {format(day, 'd')}
                        </span>
                        {dayEvents.length > 0 && (
                          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => {
                          const config = getEventTypeConfig(event.event_type);
                          return (
                            <div key={event.id} className={cn(
                              "truncate rounded px-1.5 py-0.5 text-[10px] font-bold text-white",
                              config.color
                            )}>
                              {event.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] font-medium text-slate-400 pl-1">
                            + {dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>

            {/* Event List / Detail */}
            <div className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow-xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none border border-slate-100 dark:border-slate-800">
                <div className="mb-6 flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {format(selectedDate, 'EEEE')}
                    </h3>
                    <p className="text-sm font-medium text-slate-500">
                      {format(selectedDate, 'do MMMM, yyyy')}
                    </p>
                  </div>
                  <CalendarIcon className="h-6 w-6 text-slate-300" />
                </div>

                <div className="space-y-4">
                  <AnimatePresence mode="wait">
                    {selectedDayEvents.length > 0 ? (
                      selectedDayEvents.map((event) => {
                        const config = getEventTypeConfig(event.event_type);
                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="group relative rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-lg dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                          >
                            <div className={cn("absolute left-0 top-4 h-8 w-1 rounded-r-full", config.color)} />
                            <div className="flex items-start justify-between mb-2">
                                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter border-slate-200">
                                    {config.label}
                                </Badge>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(parseISO(event.start_time), 'h:mm a')}
                                </span>
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-1">{event.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <MapPin className="h-3 w-3" />
                              <span className="font-medium">{event.location || 'Church Main Sanctuary'}</span>
                            </div>
                            {event.description && (
                                <p className="mt-3 text-xs text-slate-400 leading-relaxed line-clamp-2">
                                    {event.description}
                                </p>
                            )}
                          </motion.div>
                        );
                      })
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-12 text-center"
                      >
                        <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                          <CalendarIcon className="h-8 w-8 text-slate-200" />
                        </div>
                        <p className="text-sm font-bold text-slate-400 italic">No activities scheduled for this day.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* LegendCard */}
              <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-2xl overflow-hidden relative">
                <div className="relative z-10">
                    <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Event Legend</h5>
                    <div className="grid grid-cols-2 gap-4">
                        {['service', 'meeting', 'conference', 'special'].map(type => {
                            const cfg = getEventTypeConfig(type as EventType);
                            return (
                                <div key={type} className="flex items-center gap-2">
                                    <div className={cn("h-2 w-2 rounded-full", cfg.color)} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">{cfg.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="absolute -bottom-8 -right-8 h-24 w-24 bg-primary/10 rounded-full blur-2xl" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <EventDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={async (data) => {
          if (editingEvent) {
            await updateEvent(editingEvent.id, data);
          } else {
            await createEvent(data);
          }
        }}
        event={editingEvent}
      />
    </div>
  );
}
