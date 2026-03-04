import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleLogin } from '@react-oauth/google';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { z } from 'zod';

const RCCG_LOGO_URL = 'https://res.cloudinary.com/dnglp9qfd/image/upload/v1770460225/Rccg_logo_ttgxko.png';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, signIn, signInWithGoogle, signUp } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form state
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      const { error } = await signInWithGoogle(tokenResponse.access_token);
      if (error) {
        toast({
          title: 'Google Login Failed',
          description: error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Welcome!',
          description: 'You have successfully signed in with Google.',
        });
        navigate('/');
      }
      setIsLoading(false);
    },
    onError: () => {
      toast({
        title: 'Google Login Failed',
        description: 'An error occurred during Google authentication.',
        variant: 'destructive',
      });
    }
  });

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
    
    const { error } = await signIn(loginEmail, loginPassword);
    
    if (error) {
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      signupSchema.parse({
        fullName: signupFullName,
        email: signupEmail,
        password: signupPassword,
        confirmPassword: signupConfirmPassword,
      });
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
    
    const { error } = await signUp(signupEmail, signupPassword, signupFullName);
    
    if (error) {
      let message = error;
      if (message.includes('already registered')) {
        message = 'This email is already registered. Please try logging in instead.';
      }
      toast({
        title: 'Signup Failed',
        description: message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account Created!',
        description: 'Please check your email to verify your account before logging in.',
      });
      // Reset form
      setSignupFullName('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupConfirmPassword('');
    }
    
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-auth p-4 relative overflow-hidden transition-colors duration-500">
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 dark:bg-primary/30 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 dark:bg-primary/10 rounded-full blur-[100px] animate-pulse delay-700" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-grid-slate-100/[0.03] dark:bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg z-10"
      >
        <div className="mb-10 text-center">
          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
            className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-white dark:bg-white/90 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md border border-white/20"
          >
            <img 
              src={RCCG_LOGO_URL} 
              alt="RCCG Logo" 
              className="h-full w-full object-contain"
            />
          </motion.div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight drop-shadow-sm transition-colors decoration-primary underline-offset-8">
            RCCG <span className="text-primary italic">Emmanuel Sanctuary</span>
          </h1>
          <p className="mt-3 text-slate-500 dark:text-white/70 font-medium text-lg tracking-wide uppercase text-[10px]">Sanctuary of Excellence & Grace</p>
        </div>

        <Card className="border-border/40 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] overflow-hidden relative backdrop-blur-2xl bg-white/70 dark:bg-black/30 ring-1 ring-black/5 dark:ring-white/10 rounded-[2rem]">
          {isLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 dark:bg-black/60 backdrop-blur-md transition-all duration-300">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                   <Loader2 className="h-14 w-14 animate-spin text-primary" />
                   <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
                </div>
                <p className="text-sm font-bold tracking-widest uppercase text-foreground/80 animate-pulse">Authenticating...</p>
              </div>
            </div>
          )}
          
          <CardHeader className="pb-6 border-b border-border/50 dark:border-white/5 bg-muted/20 dark:bg-white/5">
            <CardTitle className="text-center text-3xl font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-white/70 bg-clip-text text-transparent">Welcome</CardTitle>
            <CardDescription className="text-center text-muted-foreground dark:text-white/60 font-medium">
              Access the church management sanctuary
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-8 px-8">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100/50 dark:bg-black/40 border border-border/50 dark:border-white/10 h-14 p-1 rounded-2xl">
                <TabsTrigger value="login" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-lg dark:data-[state=active]:shadow-none data-[state=active]:text-primary dark:data-[state=active]:text-white font-bold transition-all duration-300">Login</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-lg dark:data-[state=active]:shadow-none data-[state=active]:text-primary dark:data-[state=active]:text-white font-bold transition-all duration-300">Join Us</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-8">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-bold text-slate-700 dark:text-white/80 ml-1">Email Address</Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors group-focus-within:text-primary">
                        <Mail className="h-5 w-5 text-slate-400 dark:text-white/30" />
                      </div>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="pastor@emmanuel.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-12 bg-slate-50 dark:bg-black/20 border-border/80 dark:border-white/20 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:ring-primary/20 dark:focus:ring-white/10 h-14 rounded-2xl transition-all font-medium"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <Label htmlFor="login-password" className="text-sm font-bold text-slate-700 dark:text-white/80">Password</Label>
                      <button
                        type="button"
                        onClick={() => setForgotOpen(true)}
                        className="text-[11px] font-bold text-primary dark:text-white/60 hover:text-primary dark:hover:text-white hover:underline transition-colors uppercase tracking-wider"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors group-focus-within:text-primary">
                        <Lock className="h-5 w-5 text-slate-400 dark:text-white/30" />
                      </div>
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-12 pr-12 bg-slate-50 dark:bg-black/20 border-border/80 dark:border-white/20 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:ring-primary/20 dark:focus:ring-white/10 h-14 rounded-2xl transition-all font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 hover:text-primary dark:hover:text-white transition-colors p-1"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black tracking-wide shadow-xl shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all" disabled={isLoading}>
                    {isLoading ? 'SECURELY LOGGING IN...' : 'SIGN IN TO SANCTUARY'}
                  </Button>

                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/50 dark:border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 dark:text-white/20">
                      <span className="bg-card dark:bg-transparent px-4">OR EMPOWER WITH</span>
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-14 rounded-2xl border-border/80 dark:border-white/20 bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-white font-bold transition-all" 
                    onClick={() => googleLogin()}
                    disabled={isLoading}
                  >
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google Account
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-8">
                <form onSubmit={handleSignup} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm font-bold text-slate-700 dark:text-white/80 ml-1">Full Name</Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors group-focus-within:text-primary">
                        <User className="h-5 w-5 text-slate-400 dark:text-white/30" />
                      </div>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Michael Smith"
                        value={signupFullName}
                        onChange={(e) => setSignupFullName(e.target.value)}
                        className="pl-12 bg-slate-50 dark:bg-black/20 border-border/80 dark:border-white/20 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 h-13 rounded-xl transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-bold text-slate-700 dark:text-white/80 ml-1">Email Address</Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none transition-colors group-focus-within:text-primary">
                        <Mail className="h-5 w-5 text-slate-400 dark:text-white/30" />
                      </div>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="pastor@emmanuel.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-12 bg-slate-50 dark:bg-black/20 border-border/80 dark:border-white/20 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 h-13 rounded-xl transition-all"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-bold text-slate-700 dark:text-white/80 ml-1">Password</Label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none transition-colors group-focus-within:text-primary">
                          <Lock className="h-4 w-4 text-slate-400 dark:text-white/30" />
                        </div>
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="pl-10 pr-10 bg-slate-50 dark:bg-black/20 border-border/80 dark:border-white/20 text-slate-900 dark:text-white h-13 rounded-xl transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 p-1"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm" className="text-sm font-bold text-slate-700 dark:text-white/80 ml-1">Confirm</Label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none transition-colors group-focus-within:text-primary">
                          <Lock className="h-4 w-4 text-slate-400 dark:text-white/30" />
                        </div>
                        <Input
                          id="signup-confirm"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          className="pl-10 pr-10 bg-slate-50 dark:bg-black/20 border-border/80 dark:border-white/20 text-slate-900 dark:text-white h-13 rounded-xl transition-all"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black tracking-wide shadow-xl shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all bg-primary hover:bg-primary/90 text-white" disabled={isLoading}>
                    {isLoading ? 'CREATING SANCTUARY ACCOUNT...' : 'CREATE NEW ACCOUNT'}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/50 dark:border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-white/20">
                      <span className="bg-card dark:bg-transparent px-4">OR JOIN WITH</span>
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-13 rounded-xl border-border/80 dark:border-white/20 bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-white font-bold transition-all" 
                    onClick={() => googleLogin()}
                    disabled={isLoading}
                  >
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-[10px] uppercase font-bold tracking-[0.3em] text-slate-400 dark:text-white/30 animate-pulse">
          Powered by RCCG Emmanuel Sanctuary • Sanctuary of Grace
        </p>

        <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Forgot Password</DialogTitle>
              <DialogDescription>Enter your email and we'll send you a reset link.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setForgotLoading(true);
                // Forgot password logic needs to be implemented on Django side
                toast({ 
                  title: 'Note', 
                  description: 'Password reset via email is not yet implemented in the new backend.',
                  variant: 'default'
                });
                setForgotLoading(false);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={forgotLoading}>
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
