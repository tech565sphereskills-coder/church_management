import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  UserCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Users, 
  ShieldCheck,
  Building2,
  Clock,
  UserPlus
} from 'lucide-react';
import { Member } from '@/hooks/useMembers';
import { motion } from 'framer-motion';

interface MemberDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  leadingDeptName?: string;
}

export function MemberDetailsDialog({ open, onOpenChange, member, leadingDeptName }: MemberDetailsDialogProps) {
  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className="relative h-32 bg-gradient-to-r from-primary/20 via-indigo-500/10 to-primary/20 border-b border-indigo-50/50" />
        
        <div className="px-8 pb-10 -mt-16">
          <div className="flex flex-col items-center text-center mb-8">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-32 w-32 rounded-[2.5rem] bg-white border-[6px] border-white shadow-2xl overflow-hidden mb-4"
            >
              {member.photo_url ? (
                <img src={member.photo_url} alt={member.full_name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-slate-50 flex items-center justify-center text-slate-300">
                  <UserCircle2 className="h-16 w-16" />
                </div>
              )}
            </motion.div>
            
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{member.full_name}</h2>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge className="bg-emerald-50 text-emerald-600 border-none px-4 py-1 rounded-full font-black uppercase text-[10px] tracking-widest">
                {member.status.replace('_', ' ')}
              </Badge>
              {leadingDeptName && (
                <Badge className="bg-amber-50 text-amber-600 border-none px-4 py-1 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3" />
                  Head of {leadingDeptName}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 group">
                    <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Phone className="h-5 w-5 text-slate-400 group-hover:text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Phone</p>
                      <p className="font-bold text-slate-700">{member.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Mail className="h-5 w-5 text-slate-400 group-hover:text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Email</p>
                      <p className="font-bold text-slate-700">{member.email || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group">
                    <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                      <MapPin className="h-5 w-5 text-slate-400 group-hover:text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Address</p>
                      <p className="font-bold text-slate-700 leading-snug">{member.address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Ministry Roles</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 group">
                    <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors shrink-0">
                      <Building2 className="h-5 w-5 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-2">Member of</p>
                      <div className="flex flex-wrap gap-1">
                        {member.department_names && member.department_names.length > 0 ? (
                          member.department_names.map(name => (
                            <Badge key={name} variant="outline" className="rounded-lg text-[10px] py-0 font-bold border-slate-200">
                              {name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No assigned departments</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 group">
                    <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                      <Calendar className="h-5 w-5 text-slate-400 group-hover:text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Birthday</p>
                      <p className="font-bold text-slate-700">
                        {member.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString(undefined, { month: 'long', day: 'numeric' }) : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">History</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 group">
                    <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center">
                      <UserPlus className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Date Joined</p>
                      <p className="font-bold text-slate-700">{new Date(member.date_joined).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
