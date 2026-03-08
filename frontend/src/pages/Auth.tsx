import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2, ChevronRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { z } from 'zod';

const RCCG_LOGO_URL = 'https://res.cloudinary.com/dnglp9qfd/image/upload/v1770460225/Rccg_logo_ttgxko.png';
const AUTH_BG_IMAGE = 'https://res.cloudinary.com/datom4le5/image/upload/v1772523256/tech565/church/WhatsApp_Image_2026-03-03_at_08.33.04_ubi60n.jpg';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, signIn } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [is2FARequired, setIs2FARequired] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      loginSchema.parse({ email: loginEmail, password: loginPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }
    
    setIsLoading(true);
    
    const { error } = await signIn(loginEmail, loginPassword, is2FARequired ? twoFactorToken : undefined);
    
    if (error === '2fa_required') {
      setIs2FARequired(true);
      toast({
        title: '2FA Required',
        description: 'Please enter the code from your authenticator app.',
      });
    } else if (error) {
      toast({
        title: 'Login Failed',
        description: error === 'Invalid login credentials' 
          ? 'Invalid email or password. Please try again.'
          : error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate('/');
    }
    
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      {/* Split Layout: Image Side (Desktop Only) */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden">
        <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 z-0"
        >
            <img 
                src={AUTH_BG_IMAGE} 
                alt="Sanctuary Background" 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-neutral-900/40 backdrop-brightness-75" />
        </motion.div>

        <div className="relative z-10 flex flex-col justify-between w-full h-full p-16">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="flex items-center gap-4"
            >
                <div className="h-12 w-12 bg-white rounded-2xl p-2.5 shadow-xl">
                    <img src={RCCG_LOGO_URL} alt="RCCG" className="w-full h-full object-contain" />
                </div>
                <div className="h-8 w-px bg-white/20" />
                <span className="text-white text-sm font-bold tracking-[0.3em] uppercase">Sanctuary Portal</span>
            </motion.div>

            <div className="max-w-xl">
                <motion.span
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                    className="inline-block px-4 py-1.5 bg-indigo-500/20 backdrop-blur-md border border-white/10 rounded-full text-indigo-200 text-xs font-bold uppercase tracking-widest mb-6"
                >
                    Excellence & Grace
                </motion.span>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="text-6xl font-black text-white leading-[1.1] mb-6"
                >
                    Management with <br />
                    <span className="text-indigo-500">Divine Precision.</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.8 }}
                    className="text-white/90 text-lg font-medium leading-relaxed"
                >
                    A secure digital sanctuary for the RCCG Emmanuel Sanctuary family. 
                    Streamlining operations, empowering service, and growing together in faith.
                </motion.p>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="flex items-center gap-6"
            >
                <div className="flex -space-x-3">
                    {[1,2,3].map(i => (
                        <div key={i} className="h-10 w-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                             <div className="h-full w-full bg-indigo-500/20" />
                        </div>
                    ))}
                    <div className="h-10 w-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white z-10 transition-transform hover:scale-110 cursor-default">
                        +50
                    </div>
                </div>
                <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Trusted by the Church Leadership</span>
            </motion.div>
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-[42%] flex flex-col relative">
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-20 py-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm mx-auto space-y-8"
            >
                <div className="space-y-3">
                    <div className="lg:hidden flex justify-center mb-8">
                         <div className="h-14 w-14 bg-white rounded-2xl p-3 shadow-2xl border border-slate-100">
                            <img src={RCCG_LOGO_URL} alt="RCCG" className="w-full h-full object-contain" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Sign In</h2>
                    <p className="text-slate-500 font-medium">Please enter your credentials to access your dashboard.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2 group">
                            <Label htmlFor="login-email" className="text-xs font-bold text-slate-400 group-focus-within:text-indigo-600 uppercase tracking-widest ml-1 transition-colors">Email Address</Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="your-account@emmanuel.com"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-2xl font-semibold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all shadow-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <div className="flex justify-between items-center px-1">
                                <Label htmlFor="login-password" className="text-xs font-bold text-slate-400 group-focus-within:text-indigo-600 uppercase tracking-widest transition-colors">Password</Label>
                                <button
                                    type="button"
                                    onClick={() => setForgotOpen(true)}
                                    className="text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                                >
                                    Forgot?
                                </button>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <Input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    className="pl-11 pr-12 h-12 bg-slate-50 border-slate-200 rounded-2xl font-semibold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all shadow-sm"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {is2FARequired && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2 group overflow-hidden"
                                >
                                    <Label htmlFor="two-factor-token" className="text-xs font-bold text-slate-400 group-focus-within:text-indigo-600 uppercase tracking-widest ml-1 transition-colors">2FA Token</Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                            <ShieldCheck className="h-4 w-4" />
                                        </div>
                                        <Input
                                            id="two-factor-token"
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            placeholder="Enter 6-digit code"
                                            value={twoFactorToken}
                                            onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="pl-11 h-12 bg-indigo-50/50 border-indigo-100 rounded-2xl font-bold tracking-[0.5em] text-center text-indigo-900 placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-semibold focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all shadow-sm"
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium px-1">Check your authenticator app for the 6-digit code.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="pt-2">
                        <Button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-slate-900 text-white font-black tracking-widest uppercase text-xs shadow-xl shadow-indigo-200 active:scale-[0.98] transition-all relative overflow-hidden group"
                        >
                            <AnimatePresence mode="wait">
                                {isLoading ? (
                                    <motion.div
                                        key="loader"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-center gap-3"
                                    >
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Verifying...</span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="button-text"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-center gap-2"
                                    >
                                        <span>Login</span>
                                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Button>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-start gap-4 transition-all hover:border-indigo-100 hover:bg-indigo-50/30 group/note">
                        <div className="mt-0.5 h-8 w-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center group-hover/note:border-indigo-200 transition-colors shadow-sm">
                            <ShieldCheck className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="space-y-1">
                             <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Internal System</p>
                             <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Only authorized personnel can access this portal. If you need assistance, contact the Media Dept.</p>
                        </div>
                    </div>
                </form>
            </motion.div>
        </div>

        <div className="p-8 mt-auto flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 bg-white/50 backdrop-blur-sm">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">© 2026 RCCG Emmanuel Sanctuary</p>
            <div className="flex items-center gap-4">
                <button className="text-[10px] font-black text-slate-300 hover:text-indigo-600 uppercase tracking-widest transition-colors">Privacy</button>
                <button className="text-[10px] font-black text-slate-300 hover:text-indigo-600 uppercase tracking-widest transition-colors">Internal Support</button>
            </div>
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-sm p-8 border-none shadow-2xl">
          <DialogHeader className="space-y-4 pt-4">
            <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                <Lock className="h-6 w-6 text-indigo-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Forgot Password?</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500">
              Enter the email associated with your system account and we'll send instructions.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setForgotLoading(true);
              toast({ 
                title: 'Note', 
                description: 'Password reset via email is not yet implemented internally.',
              });
              setForgotLoading(false);
            }}
            className="space-y-6 pt-6 pb-4"
          >
            <div className="space-y-2 group">
              <Label htmlFor="forgot-email" className="text-xs font-bold text-slate-400 group-focus-within:text-indigo-600 uppercase tracking-widest ml-1 transition-colors">Email</Label>
              <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                        <Mail className="h-4 w-4" />
                    </div>
                    <Input
                        id="forgot-email"
                        type="email"
                        placeholder="Enter your system email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="pl-11 h-12 rounded-2xl bg-slate-50 border-slate-200 font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-600/5 transition-all shadow-sm"
                        required
                    />
              </div>
            </div>
            <div className="flex gap-3">
                 <Button type="button" variant="ghost" onClick={() => setForgotOpen(false)} className="flex-1 h-12 rounded-2xl font-black text-slate-400 text-[10px] tracking-widest uppercase">Cancel</Button>
                 <Button type="submit" className="flex-[2] h-12 rounded-2xl bg-indigo-600 hover:bg-slate-900 font-black text-xs tracking-widest uppercase shadow-lg shadow-indigo-100 transition-all" disabled={forgotLoading}>
                    {forgotLoading ? 'Sending...' : 'Send Link'}
                 </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
