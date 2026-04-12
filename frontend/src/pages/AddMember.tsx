import { useNavigate } from 'react-router-dom';
import { MemberForm } from '@/components/members/MemberForm';
import { Header } from '@/components/layout/Header';
import { useMembers, NewMemberData } from '@/hooks/useMembers';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AddMember() {
  const navigate = useNavigate();
  const { createMember } = useMembers();

  const handleMemberCreated = async (memberData: NewMemberData) => {
    const member = await createMember(memberData);
    if (member) {
      navigate('/members');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <Header 
        title="Add New Member" 
        subtitle="Register and onboard a new member to the sanctuary" 
      />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <motion.div
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
           className="mb-8"
        >
          <Button 
            variant="ghost" 
            onClick={() => navigate('/members')}
            className="group flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors pl-0"
          >
            <div className="h-8 w-8 rounded-full bg-white border border-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shadow-sm">
              <ChevronLeft className="h-4 w-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Back to Directory</span>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 sm:p-10 lg:p-16"
        >
          <MemberForm onSuccess={handleMemberCreated} onCancel={() => navigate('/members')} />
        </motion.div>
      </div>
    </div>
  );
}
