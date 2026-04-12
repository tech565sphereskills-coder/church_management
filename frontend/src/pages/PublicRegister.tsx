import { useState } from 'react';
import { MemberForm } from '@/components/members/MemberForm';
import { NewMemberData } from '@/hooks/useMembers';
import { publicApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Home, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const RCCG_LOGO_URL = 'https://res.cloudinary.com/dnglp9qfd/image/upload/v1770460225/Rccg_logo_ttgxko.png';

export default function PublicRegister() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (data: NewMemberData) => {
    setIsLoading(true);
    try {
      await publicApi.post('/public/members/', data);
      setIsSuccess(true);
      toast.success('Registration Successful', {
        description: 'Welcome to the family! Your details have been received.',
      });
    } catch (error: any) { // I'll use any here temporarily but I should check the type, better skip the change and just use AxiosError if I can import it
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.phone 
        ? 'A member with this phone number is already registered.' 
        : 'An error occurred during registration. Please try again.';
      
      toast.error('Registration Failed', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-primary/10 p-10 text-center border border-primary/5"
        >
          <div className="h-24 w-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-4">Welcome Home!</h1>
          <p className="text-slate-500 leading-relaxed mb-10">
            Your registration was successful. We are excited to have you as part of our community. 
            May the peace of the Lord be with you as you worship with us.
          </p>
          <Button 
            className="w-full btn-gold h-14 rounded-2xl font-black uppercase tracking-widest gap-2"
            onClick={() => window.location.href = 'https://rccg.org'} // Or church home page
          >
            <Home className="h-5 w-5" />
            VISIT WEBSITE
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      {/* Decorative Header */}
      <div className="bg-white border-b border-slate-100 py-8 text-center sticky top-0 z-10 shadow-sm">
        <motion.div 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="h-16 w-16 bg-white rounded-2xl p-2 shadow-xl shadow-primary/5 border border-primary/10">
            <img src={RCCG_LOGO_URL} alt="RCCG" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">RCCG Emmanuel Sanctuary</h1>
            <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mt-1">Member Registration Portal</p>
          </div>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-12">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-6 sm:p-12 mb-8"
        >
          <div className="mb-12 border-l-4 border-primary pl-6">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Join Our Family</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">Please provide your details below to register with the sanctuary.</p>
          </div>

          <MemberForm 
            onSuccess={handleRegister} 
            isLoading={isLoading}
          />
        </motion.div>
        
        <div className="text-center text-slate-400">
           <p className="text-[10px] font-bold uppercase tracking-widest">© 2026 RCCG Emmanuel Sanctuary • Dedicated to Excellence</p>
        </div>
      </div>
    </div>
  );
}
