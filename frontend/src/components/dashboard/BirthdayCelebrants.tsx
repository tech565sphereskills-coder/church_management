import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Cake, ChevronRight, Gift } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function BirthdayCelebrants() {
  const { members, loading } = useMembers();
  const navigate = useNavigate();

  const celebrants = useMemo(() => {
    if (!members.length) return [];

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    
    // Create a list of dates for the next 7 days (month-day only)
    const next7Days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      next7Days.push({
        month: d.getMonth(),
        day: d.getDate(),
        isToday: i === 0
      });
    }

    return members
      .filter(member => {
        if (!member.date_of_birth) return false;
        const dob = new Date(member.date_of_birth);
        const dobMonth = dob.getMonth();
        const dobDay = dob.getDate();
        
        return next7Days.some(d => d.month === dobMonth && d.day === dobDay);
      })
      .map(member => {
        const dob = new Date(member.date_of_birth!);
        const dayInfo = next7Days.find(d => d.month === dob.getMonth() && d.day === dob.getDate());
        
        return {
          ...member,
          isToday: dayInfo?.isToday,
          birthdayLabel: dob.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
        };
      })
      .sort((a, b) => {
        // Sort by how soon the birthday is
        const dobA = new Date(a.date_of_birth!);
        const dobB = new Date(b.date_of_birth!);
        
        // This is a simplified sort for within-week birthdays
        const todayMonth = today.getMonth();
        const dayOffset = (m: number, d: number) => {
           // Simple distance from today (assuming within 7 days)
           if (m === todayMonth) return d - today.getDate();
           return d + 31 - today.getDate(); // Rough approximation for month boundary
        };

        return dayOffset(dobA.getMonth(), dobA.getDate()) - dayOffset(dobB.getMonth(), dobB.getDate());
      });
  }, [members]);

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) return null;

  return (
    <Card className="h-full border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Cake className="h-5 w-5 text-primary" />
          Birthdays This Week
        </CardTitle>
        <Gift className="h-5 w-5 text-muted-foreground opacity-20" />
      </CardHeader>
      <CardContent>
        {celebrants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
              <Gift className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">No birthdays this week</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Check back later!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {celebrants.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-2 rounded-lg transition-colors hover:bg-muted/50 ${member.isToday ? 'bg-primary/5 border border-primary/20 shadow-sm' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                    <AvatarFallback className={`${member.isToday ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{member.full_name}</p>
                      {member.isToday && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold animate-pulse">
                          TODAY
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{member.department || 'General Member'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold ${member.isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {member.birthdayLabel}
                  </p>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigate(`/members/${member.id}`)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
