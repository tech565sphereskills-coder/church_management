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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_2px_2px,rgba(0,0,0,1)_1px,transparent_0)] bg-[length:40px_40px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-6 xs:p-8 sm:p-12 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full -ml-12 -mb-12" />

        <div className="relative">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 mb-6 transform -rotate-3">
              <Church className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 mb-2">Welcome Home!</h1>
            <p className="text-slate-500 text-sm md:text-base font-medium">Please enter your phone number or scan your QR code.</p>
          </div>

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-8"
              >
                <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Check-in Sent!</h2>
                <p className="text-slate-500 mb-8 max-w-[250px]">
                  {scannedMember ? `Welcome, ${scannedMember}! ` : ''}
                  An official will verify your check-in shortly. God bless you!
                </p>
                <Button 
                  onClick={() => setIsSuccess(false)}
                  variant="outline"
                  className="rounded-xl px-8 h-12 font-bold focus-visible:ring-primary/20"
                >
                  Check-in another person
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <Button
                  onClick={() => setIsScannerOpen(true)}
                  variant="outline"
                  className="w-full h-16 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-black flex items-center justify-center gap-3 transition-all"
                >
                  <QrCode className="h-6 w-6" />
                  SCAN MY QR CODE
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-4 text-slate-400 font-bold">Or enter phone</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-black text-slate-700 ml-1">Phone Number</Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                        <Phone className="h-5 w-5" />
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="e.g. 08012345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="pl-12 h-16 bg-slate-50 border-slate-200 rounded-2xl text-xl font-bold tracking-widest focus-visible:ring-primary/20 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-16 rounded-2xl text-lg font-black tracking-tight shadow-xl shadow-primary/20 group relative overflow-hidden"
                  >
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        CHECK IN NOW
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
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

      <div className="mt-8 text-slate-400 text-sm font-medium flex items-center gap-2">
        <Church className="h-4 w-4" />
        RCCG Emmanuel Sanctuary
      </div>
    </div>
  );
}
