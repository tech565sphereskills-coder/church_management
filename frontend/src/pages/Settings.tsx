import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Church, 
  Loader2, 
  KeyRound, 
  Users,
  Database,
  Globe,
  Mail,
  Smartphone,
  History,
  Activity,
  Download,
  Trash2,
  Lock,
  Eye,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Settings() {
  const navigate = useNavigate();
  const { settings, loading, saving, updateSettings, changePassword } = useSettings();
  const { user, isAdmin, role } = useAuth();
  const { toast } = useToast();
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState('/rccg_logo.png');
  const [churchName, setChurchName] = useState('');
  const [address, setAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [attendanceReminders, setAttendanceReminders] = useState(true);
  const [newMemberAlerts, setNewMemberAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [smtpServer, setSmtpServer] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpUseTls, setSmtpUseTls] = useState(true);
  
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (settings) {
      setLogoUrl(settings.logo_url || '/rccg_logo.png');
      setChurchName(settings.church_name || '');
      setAddress(settings.address || '');
      setContactEmail(settings.contact_email || '');
      setAttendanceReminders(settings.attendance_reminders);
      setNewMemberAlerts(settings.new_member_alerts);
      setWeeklyReports(settings.weekly_reports);
      setSmtpServer(settings.smtp_server || '');
      setSmtpPort(settings.smtp_port || 587);
      setSmtpUser(settings.smtp_user || '');
      setSmtpPassword(settings.smtp_password || '');
      setSmtpUseTls(settings.smtp_use_tls);
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings({
      church_name: churchName,
      address,
      contact_email: contactEmail,
      logo_url: logoUrl,
      attendance_reminders: attendanceReminders,
      new_member_alerts: newMemberAlerts,
      weekly_reports: weeklyReports,
      smtp_server: smtpServer,
      smtp_port: smtpPort,
      smtp_user: smtpUser,
      smtp_password: smtpPassword,
      smtp_use_tls: smtpUseTls,
    });
  };

  const handleLogoClick = () => {
    if (isAdmin) {
      logoInputRef.current?.click();
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
        toast({
          title: "Logo ready to save",
          description: "Click 'Save Configuration' to apply the new logo.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    setIsChangingPassword(true);
    const success = await changePassword(newPassword);
    setIsChangingPassword(false);
    if (success) {
      setIsPasswordDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-slate-500 font-medium animate-pulse">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/30">
      <Header 
        title="Settings & Administration" 
        subtitle="Command center for your church management system." 
      />

      <div className="p-6 lg:p-10">
        <Tabs defaultValue="general" className="space-y-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Tabs */}
            <div className="w-full lg:w-64 space-y-4">
              <TabsList className="flex lg:flex-col h-auto bg-transparent border-none p-0 gap-1 overflow-x-auto">
                {[
                  { id: 'general', label: 'General', icon: Church },
                  { id: 'profile', label: 'My Account', icon: User },
                  { id: 'notifications', label: 'Notifications', icon: Bell },
                  { id: 'security', label: 'Security', icon: Shield },
                  { id: 'system', label: 'System Health', icon: Activity, adminOnly: true },
                ].filter(tab => !tab.adminOnly || isAdmin).map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      "flex items-center justify-start gap-3 px-4 py-3 w-full rounded-xl transition-all duration-200",
                      "data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-slate-200",
                      "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:bg-slate-100"
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="font-semibold">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {isAdmin && (
                <div className="hidden lg:block p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <History className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">System Status</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Database</span>
                      <span className="text-emerald-600 font-bold">Online</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Storage</span>
                      <span className="text-emerald-600 font-bold">82% Free</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 max-w-4xl">
              <AnimatePresence mode="wait">
                {/* General Settings */}
                <TabsContent value="general" className="mt-0 outline-none">
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <Card className="border-none shadow-sm overflow-hidden">
                      <CardHeader className="bg-white border-b border-slate-100 pb-8">
                        <CardTitle className="text-xl">Church Information</CardTitle>
                        <CardDescription>Update the primary details for RCCG Emmanuel Sanctuary.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-8 space-y-8">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                          <div className="relative group cursor-pointer" onClick={handleLogoClick}>
                            <input 
                              type="file" 
                              ref={logoInputRef} 
                              className="hidden" 
                              accept="image/*" 
                              onChange={handleLogoChange}
                            />
                            <div className="w-32 h-32 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center transition-all group-hover:border-primary group-hover:bg-primary/5">
                              <img src={logoUrl} alt="Logo" className="w-20 h-20 object-contain transition-all group-hover:scale-110" />
                              <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-white text-xs font-bold">Change</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-center mt-2 text-slate-400 font-bold uppercase tracking-tighter">Church Emblem</p>
                          </div>
                          
                          <div className="flex-1 space-y-6 w-full">
                            <div className="grid gap-2">
                              <Label htmlFor="church" className="text-xs font-bold uppercase text-slate-500">Official Name</Label>
                              <Input 
                                id="church" 
                                value={churchName} 
                                onChange={(e) => setChurchName(e.target.value)} 
                                disabled={!isAdmin}
                                className="h-12 border-slate-200 focus:ring-primary shadow-none text-lg" 
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="mail" className="text-xs font-bold uppercase text-slate-500">Contact Email Address</Label>
                              <Input 
                                id="mail" 
                                value={contactEmail} 
                                onChange={(e) => setContactEmail(e.target.value)} 
                                disabled={!isAdmin}
                                className="h-12 border-slate-200 focus:ring-primary shadow-none" 
                              />
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="addr" className="text-xs font-bold uppercase text-slate-500">Physical Address</Label>
                          <Input 
                            id="addr" 
                            value={address} 
                            onChange={(e) => setAddress(e.target.value)} 
                            disabled={!isAdmin}
                            className="h-12 border-slate-200 focus:ring-primary shadow-none" 
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-6 flex justify-end">
                        <Button onClick={handleSave} disabled={saving || !isAdmin} className="px-8 h-12 rounded-xl shadow-lg shadow-primary/10">
                          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
                          Save Configuration
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Profile Settings */}
                <TabsContent value="profile" className="mt-0 outline-none">
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <Card className="border-none shadow-sm overflow-hidden">
                      <CardHeader className="bg-white border-b border-slate-100 pb-8">
                        <CardTitle className="text-xl">User Profile</CardTitle>
                        <CardDescription>Personal information and preferences.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-8 space-y-8">
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold border-2 border-white shadow-md">
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-slate-900">{user?.username}</h4>
                            <p className="text-slate-500 font-medium">{user?.email}</p>
                            <Badge variant="outline" className="mt-2 bg-primary/5 border-primary/20 text-primary uppercase text-[10px] font-bold">
                              {role?.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <Separator />
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h5 className="font-bold text-slate-900 flex items-center gap-2">
                              <Smartphone className="h-4 w-4 text-slate-400" />
                              Contact Information
                            </h5>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                              <p className="text-sm text-slate-600 font-medium flex justify-between">
                                Phone: <span className="text-slate-900">Not provided</span>
                              </p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h5 className="font-bold text-slate-900 flex items-center gap-2">
                              <Globe className="h-4 w-4 text-slate-400" />
                              Interface Language
                            </h5>
                            <Button variant="outline" className="w-full justify-start h-12 bg-white border-slate-200">
                              English (Default)
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Notifications */}
                <TabsContent value="notifications" className="mt-0 outline-none">
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <Card className="border-none shadow-sm overflow-hidden">
                      <CardHeader className="bg-white border-b border-slate-100 pb-8">
                        <CardTitle className="text-xl">Preferences</CardTitle>
                        <CardDescription>Control how and when you receive system alerts.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-8 space-y-6">
                        {[
                          { id: 'reminders', label: 'Attendance Reminders', desc: 'Alerts before service starts', state: attendanceReminders, setter: setAttendanceReminders },
                          { id: 'alerts', label: 'New Member Alerts', desc: 'Real-time notifications for registration', state: newMemberAlerts, setter: setNewMemberAlerts },
                          { id: 'reports', label: 'Weekly Reports', desc: 'Detailed PDF analytics every Monday', state: weeklyReports, setter: setWeeklyReports },
                        ].map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 transition-hover hover:border-slate-200">
                            <div className="space-y-1">
                              <Label htmlFor={item.id} className="text-base font-bold text-slate-900 cursor-pointer">{item.label}</Label>
                              <p className="text-sm text-slate-500 font-medium">{item.desc}</p>
                            </div>
                            <Switch 
                              id={item.id} 
                              checked={item.state} 
                              onCheckedChange={item.setter} 
                              disabled={!isAdmin} 
                            />
                          </div>
                        ))}
                        <div className="pt-6 border-t border-slate-100">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6">Email Server (SMTP)</h4>
                          <div className="grid gap-6">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="smtp-server" className="text-xs font-bold uppercase text-slate-500">SMTP Host</Label>
                                <Input 
                                  id="smtp-server" 
                                  value={smtpServer} 
                                  onChange={(e) => setSmtpServer(e.target.value)} 
                                  placeholder="smtp.gmail.com"
                                  disabled={!isAdmin}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="smtp-port" className="text-xs font-bold uppercase text-slate-500">Port</Label>
                                <Input 
                                  id="smtp-port" 
                                  type="number"
                                  value={smtpPort} 
                                  onChange={(e) => setSmtpPort(parseInt(e.target.value))} 
                                  disabled={!isAdmin}
                                />
                              </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="smtp-user" className="text-xs font-bold uppercase text-slate-500">Username</Label>
                                <Input 
                                  id="smtp-user" 
                                  value={smtpUser} 
                                  onChange={(e) => setSmtpUser(e.target.value)} 
                                  placeholder="church@email.com"
                                  disabled={!isAdmin}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="smtp-pass" className="text-xs font-bold uppercase text-slate-500">Password</Label>
                                <Input 
                                  id="smtp-pass" 
                                  type="password"
                                  value={smtpPassword} 
                                  onChange={(e) => setSmtpPassword(e.target.value)} 
                                  disabled={!isAdmin}
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                                <div className="space-y-1">
                                  <Label htmlFor="smtp-tls" className="text-sm font-bold text-slate-900 cursor-pointer">Use TLS</Label>
                                  <p className="text-xs text-slate-500">Secure connection for modern email providers</p>
                                </div>
                                <Switch 
                                  id="smtp-tls" 
                                  checked={smtpUseTls} 
                                  onCheckedChange={setSmtpUseTls} 
                                  disabled={!isAdmin} 
                                />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-6 flex justify-end">
                        <Button onClick={handleSave} disabled={saving || !isAdmin} className="rounded-xl px-8 h-12">
                          Apply Changes
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Security */}
                <TabsContent value="security" className="mt-0 outline-none">
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <Card className="border-none shadow-sm overflow-hidden">
                      <CardHeader className="bg-white border-b border-slate-100 pb-8">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-xl text-red-600 flex items-center gap-2">
                              <Lock className="h-5 w-5" />
                              Security Protocol
                            </CardTitle>
                            <CardDescription>Protect your access and manage system authentication.</CardDescription>
                          </div>
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-3 py-1 font-bold">Encrypted</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-8 space-y-6">
                        <div className="p-6 rounded-2xl border border-slate-200 space-y-4">
                          <h5 className="font-bold text-slate-900">Account Access</h5>
                          <p className="text-sm text-slate-500 font-medium">It's recommended to update your security credentials every 90 days.</p>
                          <Button 
                            variant="default" 
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 px-6 gap-2"
                            onClick={() => setIsPasswordDialogOpen(true)}
                          >
                            <KeyRound className="h-4 w-4" />
                            Force Password Reset
                          </Button>
                        </div>

                        {isAdmin && (
                          <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
                            <h5 className="font-bold text-primary">Administrative Controls</h5>
                            <p className="text-sm text-slate-600 font-medium">Configure roles and permissions for other church officers.</p>
                            <Button 
                              variant="outline" 
                              className="w-full justify-start h-12 rounded-xl bg-white border-primary/20 text-primary gap-3 hover:bg-primary hover:text-white transition-all shadow-md"
                              onClick={() => navigate('/user-management')}
                            >
                              <Users className="h-4 w-4" />
                              System-wide User Management
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* System Tab */}
                <TabsContent value="system" className="mt-0 outline-none">
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <Card className="border-none shadow-sm overflow-hidden">
                      <CardHeader className="bg-white border-b border-slate-100 pb-8">
                        <CardTitle className="text-xl">System Infrastructure</CardTitle>
                        <CardDescription>Advanced maintenance and infrastructure health.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-8 space-y-8">
                        <div className="grid md:grid-cols-2 gap-6">
                          <Card className="border-slate-100 shadow-none bg-slate-50/50">
                            <CardContent className="p-6 space-y-4 text-center">
                              <div className="mx-auto w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-2">
                                <Database className="h-6 w-6 text-indigo-500" />
                              </div>
                              <h6 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Data Integrity</h6>
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-700">Daily Backups: <span className="text-emerald-500">Active</span></p>
                                <p className="text-xs text-slate-400">Last run: Today, 03:00 AM</p>
                              </div>
                              <Button variant="outline" className="w-full text-xs font-bold gap-2 bg-white h-10">
                                <Download className="h-3 w-3" /> Export Archive
                              </Button>
                            </CardContent>
                          </Card>
                          <Card className="border-slate-100 shadow-none bg-slate-50/50">
                            <CardContent className="p-6 space-y-4 text-center">
                              <div className="mx-auto w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-2">
                                <Mail className="h-6 w-6 text-orange-500" />
                              </div>
                              <h6 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Service Gateway</h6>
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-700">SMTP Server: <span className="text-emerald-500">Connected</span></p>
                                <p className="text-xs text-slate-400">SMS Credit: 1,420 units</p>
                              </div>
                              <Button variant="outline" className="w-full text-xs font-bold gap-2 bg-white h-10">
                                <SettingsIcon className="h-3 w-3" /> View API Logs
                              </Button>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="rounded-2xl border-2 border-dashed border-red-200 p-8 space-y-4 bg-red-50/20">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                            <h5 className="font-extrabold text-red-600 uppercase tracking-tight">Danger Zone</h5>
                          </div>
                          <p className="text-sm text-slate-600 font-medium">These actions are irreversible. Please proceed with extreme caution.</p>
                          <div className="flex flex-wrap gap-4 pt-2">
                            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-colors bg-white font-bold px-6">
                              Clear Logs
                            </Button>
                            <Button variant="ghost" className="text-slate-400 hover:text-red-600 font-bold">
                              Request Instance Deletion
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-[400px] rounded-3xl p-6 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          <DialogHeader className="pt-2">
            <DialogTitle className="text-2xl font-extrabold flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              Security Update
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Update your account credentials for enhanced safety.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-400">New Password</Label>
              <div className="relative">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-12 border-slate-200 focus:ring-primary pl-4 transition-all"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-400">Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 border-slate-200 focus:ring-primary pl-4 transition-all"
                placeholder="Repeat new password"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" className="flex-1 font-bold text-slate-500" onClick={() => setIsPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordChange} disabled={isChangingPassword} className="flex-1 rounded-xl h-12 shadow-lg shadow-primary/20">
              {isChangingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
