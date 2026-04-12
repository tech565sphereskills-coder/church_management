import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, CheckCircle2, Loader2, ArrowRight, Church, Smartphone, QrCode, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { QRScanner } from '@/components/qr/QRScanner';
import { useMembers } from '@/hooks/useMembers';

export default function CheckIn() {
  const { toast } = useToast();
  const { searchByQRCode } = useMembers();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedMember, setScannedMember] = useState<string | null>(null);

  const validatePhone = (phone: string) => {
    // Basic validation for 10-15 digits
    return /^\+?[0-9]{10,15}$/.test(phone.replace(/\s/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    if (!validatePhone(cleanPhone)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid phone number (10-15 digits).',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/check-in-queue/', { phone_number: cleanPhone });
      setIsSuccess(true);
      setPhoneNumber('');
    } catch (error) {
      console.error('Check-in failed:', error);
      toast({
        title: 'Check-in Failed',
        description: 'Something went wrong. Please try again or see an usher.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRScan = async (qrCode: string) => {
    setIsLoading(true);
    setScannedMember(null);
    try {
      const member = await searchByQRCode(qrCode);
      if (!member) {
        toast({
          title: 'Member not found',
          description: 'This QR code is not recognized.',
          variant: 'destructive',
        });
        return;
      }

      await api.post('/check-in-queue/', { 
        phone_number: member.phone,
        member_id: member.id 
      });
      
      setScannedMember(member.full_name);
      setIsSuccess(true);
    } catch (error) {
      console.error('QR check-in failed:', error);
      toast({
        title: 'Check-in Failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.05]">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,1)_1px,transparent_0)] bg-[length:40px_40px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="w-full max-w-md backdrop-blur-xl bg-white/10 rounded-[2.5rem] border border-white/20 shadow-2xl shadow-black/50 p-8 sm:p-12 relative overflow-hidden z-10"
      >
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/10 rounded-full -ml-20 -mb-20 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col items-center text-center mb-10">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="h-20 w-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-8 transform -rotate-3"
            >
              <Church className="h-10 w-10 text-white" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-3">Welcome Home!</h1>
            <p className="text-indigo-200/70 text-sm md:text-base font-medium">Sanctuary is open for you. Check in below.</p>
          </div>

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center text-center py-8"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200 }}
                  className="h-24 w-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-8 border border-emerald-500/50"
                >
                  <CheckCircle2 className="h-14 w-14 text-emerald-400" />
                </motion.div>
                <h2 className="text-3xl font-black text-white mb-3">You're Checked In!</h2>
                <p className="text-indigo-100/60 mb-10 max-w-[280px] leading-relaxed">
                  {scannedMember ? <span className="text-emerald-400 block font-bold text-lg mb-2">Welcome, {scannedMember}!</span> : ''}
                  Your presence is registered. May you reach out to heaven today!
                </p>
                <Button 
                  onClick={() => setIsSuccess(false)}
                  variant="ghost"
                  className="rounded-2xl px-10 h-14 font-black bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-all"
                >
                  Mark another person
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => setIsScannerOpen(true)}
                    className="w-full h-20 rounded-[1.5rem] bg-indigo-500/20 hover:bg-indigo-500/30 border-2 border-indigo-400/30 text-indigo-100 font-black flex items-center justify-center gap-4 transition-all shadow-xl shadow-indigo-500/10 group"
                  >
                    <div className="h-12 w-12 rounded-xl bg-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <QrCode className="h-6 w-6 text-indigo-300" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold opacity-60 uppercase tracking-tighter">Fast Access</p>
                      <p className="text-lg">SCAN MY QR CODE</p>
                    </div>
                  </Button>
                </motion.div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0f172a] px-4 text-indigo-300/40 font-black tracking-widest leading-none">Or manual entry</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-xs font-black text-indigo-200/50 uppercase ml-2 tracking-widest">Phone Number</Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none text-indigo-300/30 group-focus-within:text-indigo-400 transition-colors">
                        <Phone className="h-6 w-6" />
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="e.g. 08012345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="pl-14 h-16 bg-white/5 border-white/10 rounded-2xl text-xl font-bold tracking-widest focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50 text-white placeholder:text-white/10 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-16 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-lg font-black tracking-widest shadow-2xl shadow-indigo-500/40 group relative overflow-hidden transition-all"
                  >
                    {isLoading ? (
                      <Loader2 className="h-7 w-7 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-3">
                        SUBMIT CHECK-IN
                        <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
                      </span>
                    )}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <QRScanner 
          open={isScannerOpen} 
          onOpenChange={setIsScannerOpen} 
          onScan={handleQRScan} 
        />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-indigo-200/30 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3"
      >
        <Church className="h-5 w-5 opacity-30" />
        RCCG Sanctury Management System
      </motion.div>
    </div>
  );
}
