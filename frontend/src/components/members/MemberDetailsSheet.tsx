import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Member } from '@/hooks/useMembers';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  History, 
  Users,
  Award,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MemberDetailsSheetProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: { id: string; name: string; head_of_department: string | null }[];
}

export function MemberDetailsSheet({ 
  member, 
  open, 
  onOpenChange,
  departments 
}: MemberDetailsSheetProps) {
  if (!member) return null;

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const isHOD = departments.some(d => d.head_of_department === member.id);
  const isNewJoiner = () => {
    const joinedDate = new Date(member.date_joined);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return joinedDate >= thirtyDaysAgo;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md w-full overflow-y-auto">
        <SheetHeader className="text-left pb-6 border-b">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20 p-0.5">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {getInitials(member.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-2xl font-black text-slate-900 tracking-tight">
                {member.full_name}
              </SheetTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className={
                  member.status === 'active' ? 'badge-active' : 
                  member.status === 'first_timer' ? 'badge-first-timer' : 
                  'badge-inactive'
                }>
                  {member.status === 'first_timer' ? 'First Timer' : member.status}
                </Badge>
                {isHOD && (
                  <Badge className="bg-indigo-500 text-white hover:bg-indigo-600 border-none px-2 shadow-sm">
                    <Award className="h-3 w-3 mr-1" /> Head of Dept
                  </Badge>
                )}
                {isNewJoiner() && (
                  <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-amber-100 px-2 font-bold">
                    <Clock className="h-3 w-3 mr-1" /> New Joiner
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <SheetDescription className="text-slate-500 font-medium">
            Member ID: <span className="text-slate-900 font-mono text-xs">{member.id.split('-')[0]}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="py-8 space-y-8">
          {/* Contact Information */}
          <section>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Phone className="h-3 w-3" /> Contact Details
            </h4>
            <div className="grid gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center border border-slate-200">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Phone Number</p>
                  <p className="text-sm font-bold text-slate-700">{member.phone}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => window.location.href = `tel:${member.phone}`}>
                   <Phone className="h-4 w-4" />
                </Button>
              </div>

              {member.email && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center border border-slate-200">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Email Address</p>
                    <p className="text-sm font-bold text-slate-700">{member.email}</p>
                  </div>
                </div>
              )}

              {member.address && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center border border-slate-200">
                    <MapPin className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Home Address</p>
                    <p className="text-sm font-bold text-slate-700">{member.address}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Church Details */}
          <section>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <ShieldCheck className="h-3 w-3" /> Church Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                <Users className="h-4 w-4 text-primary mb-2" />
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Department</p>
                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                  {member.department_name || 'General'}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                <Calendar className="h-4 w-4 text-emerald-500 mb-2" />
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Joined Date</p>
                <p className="text-sm font-black text-slate-800 tracking-tight">
                  {new Date(member.date_joined).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </section>

          {/* Activity Preview */}
          <section>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <History className="h-3 w-3" /> Activity Summary
            </h4>
            <div className="p-6 rounded-2xl bg-slate-900 text-white relative overflow-hidden">
               <div className="relative z-10">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Service Consistency</p>
                  <div className="flex items-end gap-1 mb-4">
                    <div className="h-12 w-3 bg-primary rounded-full"></div>
                    <div className="h-8 w-3 bg-slate-700 rounded-full"></div>
                    <div className="h-10 w-3 bg-primary rounded-full"></div>
                    <div className="h-6 w-3 bg-slate-700 rounded-full"></div>
                    <div className="h-14 w-3 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.3)]"></div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Monthly Attendance</span>
                    <span className="font-bold text-primary">85% Rate</span>
                  </div>
               </div>
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <History className="h-24 w-24 rotate-12" />
               </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
