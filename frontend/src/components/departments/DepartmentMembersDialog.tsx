import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { useMembers } from '@/hooks/useMembers';
import { Department } from '@/hooks/useDepartments';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Phone, Mail, UserCircle2 } from 'lucide-react';

interface DepartmentMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
}

export function DepartmentMembersDialog({ open, onOpenChange, department }: DepartmentMembersDialogProps) {
  const { members, loading } = useMembers();

  const departmentMembers = members.filter(member => 
    department && member.departments.includes(department.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
        <DialogHeader className="p-8 pb-4 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-slate-800">
                {department?.name} Members
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">
                {departmentMembers.length} member{departmentMembers.length !== 1 ? 's' : ''} assigned to this department
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-8 pb-8">
          <div className="space-y-3">
            {loading ? (
              <div className="py-20 text-center text-slate-400 font-bold animate-pulse">
                Loading members...
              </div>
            ) : departmentMembers.length > 0 ? (
              departmentMembers.map((member) => (
                <div 
                  key={member.id}
                  className="group flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-primary/5 transition-all border border-transparent hover:border-primary/10"
                >
                  <Avatar className="h-12 w-12 rounded-xl border-2 border-white shadow-sm">
                    <AvatarImage src={member.photo_url || undefined} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {member.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 truncate">{member.full_name}</h4>
                      {member.id === department?.head_of_department && (
                        <Badge className="bg-primary text-white text-[10px] px-2 py-0 font-black uppercase rounded-full">
                          HOD
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                        <Phone className="h-3 w-3" />
                        {member.phone}
                      </div>
                      {member.email && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </div>
                      )}
                    </div>
                  </div>

                  <Badge variant="outline" className={`
                    rounded-lg text-[10px] font-black uppercase px-2 py-1
                    ${member.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      member.status === 'first_timer' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                      'bg-slate-50 text-slate-600 border-slate-100'}
                  `}>
                    {member.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="py-20 text-center">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <UserCircle2 className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-slate-800 font-bold italic">No members found</h3>
                <p className="text-slate-400 text-sm mt-1">This department currently has no assigned members.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
