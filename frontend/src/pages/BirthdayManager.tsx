import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Cake, 
  Gift, 
  Search, 
  MessageSquare, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  Heart,
  PartyPopper,
  Info
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { useMembers, Member } from '@/hooks/useMembers';
import { format, addWeeks, startOfWeek, endOfWeek, isWithinInterval, parseISO, isSameDay } from 'date-fns';
import { SendSMSDialog } from '@/components/sms/SendSMSDialog';
import { cn } from '@/lib/utils';
import { MetaManager } from '@/components/common/MetaManager';

export default function BirthdayManager() {
  const { members, loading } = useMembers(1, '', 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isSMSDialogOpen, setIsSMSDialogOpen] = useState(false);


  const weekStart = startOfWeek(selectedWeek);
  const weekEnd = endOfWeek(selectedWeek);

  const getCelebrants = () => {
    if (!members) return [];
    
    return members.filter(member => {
        if (!member.date_of_birth) return false;
        
        // Match name
        if (searchQuery && !member.full_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        const dob = parseISO(member.date_of_birth);
        // Normalize dob to current year to check if it falls in the selected week
        const celebrationThisYear = new Date(selectedWeek.getFullYear(), dob.getMonth(), dob.getDate());
        
        return isWithinInterval(celebrationThisYear, { start: weekStart, end: weekEnd });
    }).sort((a, b) => {
        const da = parseISO(a.date_of_birth!).getDate();
        const db = parseISO(b.date_of_birth!).getDate();
        return da - db;
    });
  };

  const celebrants = getCelebrants();

  const handleNextWeek = () => setSelectedWeek(addWeeks(selectedWeek, 1));
  const handlePrevWeek = () => setSelectedWeek(addWeeks(selectedWeek, -1));

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    transition: { duration: 2, repeat: Infinity }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background/50">
      <MetaManager title="Celebration Manager" description="Tracking birthdays and wedding anniversaries for the sanctuary family." />
      <Header title="Celebration Manager" subtitle="Tracking birthdays and wedding anniversaries for the sanctuary family." />
      
      <main className="flex-1 p-4 lg:p-8">
        <div className="mx-auto max-w-7xl">
          
          {/* Controls & Week Picker */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
             <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
                <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="rounded-xl h-10 w-10">
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="px-4 text-center min-w-[200px]">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Target Week</p>
                    <p className="text-sm font-bold text-slate-800">
                        {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                    </p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleNextWeek} className="rounded-xl h-10 w-10">
                    <ChevronRight className="h-4 w-4" />
                </Button>
             </div>

             <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                   placeholder="Find a celebrant..." 
                   className="pl-10 h-12 rounded-2xl border-none shadow-sm"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
          </div>

          {/* Celebrants Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             {loading ? (
                [1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-white rounded-3xl animate-pulse" />)
             ) : celebrants.length > 0 ? (
                celebrants.map((member, idx) => {
                    const dob = parseISO(member.date_of_birth!);
                    const isToday = isSameDay(new Date(), new Date(new Date().getFullYear(), dob.getMonth(), dob.getDate()));
                    
                    return (
                        <motion.div
                            key={member.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Card className={cn(
                                "overflow-hidden border-none shadow-premium transition-all duration-300 hover:shadow-2xl relative group h-full",
                                isToday ? "bg-primary text-white" : "bg-white"
                            )}>
                                {isToday && (
                                    <div className="absolute top-0 right-0 p-4">
                                        <motion.div animate={pulseAnimation}>
                                            <PartyPopper className="h-8 w-8 text-white/50" />
                                        </motion.div>
                                    </div>
                                )}
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div className={cn(
                                            "h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-sm",
                                            isToday ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                                        )}>
                                            {format(dob, 'dd')}
                                        </div>
                                        <Badge className={cn(
                                            "font-black uppercase tracking-tighter",
                                            isToday ? "bg-white text-primary" : "bg-primary/5 text-primary border-none"
                                        )}>
                                            {format(dob, 'MMMM')}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-xl font-black tracking-tight line-clamp-1">{member.full_name}</h3>
                                            <p className={cn("text-xs font-bold uppercase tracking-widest", isToday ? "text-white/70" : "text-slate-400")}>
                                                {member.department_names?.[0] || 'General Congregation'}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                               <Cake className={cn("h-4 w-4", isToday ? "text-white/60" : "text-slate-300")} />
                                               <span className="text-[10px] font-black uppercase tracking-widest leading-none">Birthday</span>
                                            </div>
                                            <Button 
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedMember(member);
                                                    setIsSMSDialogOpen(true);
                                                }}
                                                className={cn(
                                                    "rounded-xl font-bold h-9 gap-2",
                                                    isToday ? "bg-white text-primary hover:bg-slate-100" : "bg-slate-900 text-white shadow-xl shadow-slate-200"
                                                )}
                                            >
                                                <MessageSquare className="h-3.5 w-3.5" />
                                                Send Wishes
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                                
                                {!isToday && (
                                    <div className="absolute -bottom-8 -right-8 h-32 w-32 bg-slate-50 rounded-full opacity-50 transition-transform group-hover:scale-150 group-hover:bg-primary/5" />
                                )}
                            </Card>
                        </motion.div>
                    );
                })
             ) : (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                    <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                        <Gift className="h-10 w-10 text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">No Celebrations This Week</h3>
                    <p className="text-slate-400 font-medium max-w-xs mt-2">Every week is a blessing, but no birthdays or anniversaries are recorded for this timeframe.</p>
                    <Button variant="link" onClick={() => setSelectedWeek(new Date())} className="mt-4 font-bold">Return to Present</Button>
                </div>
             )}
          </div>
        </div>
      </main>

      <SendSMSDialog 
        open={isSMSDialogOpen} 
        onOpenChange={setIsSMSDialogOpen} 
        recipients={selectedMember ? [{ id: selectedMember.id, phone: selectedMember.phone, name: selectedMember.full_name }] : []}
      />
    </div>
  );
}

