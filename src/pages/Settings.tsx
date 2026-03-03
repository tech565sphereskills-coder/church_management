import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Bell, Shield, Church, Loader2, KeyRound, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const navigate = useNavigate();
  const { settings, loading, saving, updateSettings, changePassword } = useSettings();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [churchName, setChurchName] = useState('');
  const [address, setAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [attendanceReminders, setAttendanceReminders] = useState(true);
  const [newMemberAlerts, setNewMemberAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Load settings into form
  useEffect(() => {
    if (settings) {
      setChurchName(settings.church_name || '');
      setAddress(settings.address || '');
      setContactEmail(settings.contact_email || '');
      setAttendanceReminders(settings.attendance_reminders);
      setNewMemberAlerts(settings.new_member_alerts);
      setWeeklyReports(settings.weekly_reports);
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings({
      church_name: churchName,
      address,
      contact_email: contactEmail,
      attendance_reminders: attendanceReminders,
      new_member_alerts: newMemberAlerts,
      weekly_reports: weeklyReports,
    });
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Settings" subtitle="Manage your application preferences" />

      <div className="mx-auto max-w-2xl p-6">
        {/* Church Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Church className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Church Information</h3>
              <p className="text-sm text-muted-foreground">
                Update your church details
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="churchName">Church Name</Label>
              <Input
                id="churchName"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                className="mt-1"
                disabled={!isAdmin}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1"
                disabled={!isAdmin}
              />
            </div>
            <div>
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="mt-1"
                disabled={!isAdmin}
              />
            </div>
          </div>
        </motion.div>

        <Separator className="my-6" />

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Bell className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold">Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Configure notification preferences
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Attendance Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Get reminded before each service
                </p>
              </div>
              <Switch 
                checked={attendanceReminders} 
                onCheckedChange={setAttendanceReminders}
                disabled={!isAdmin}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New Member Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Notify when a new member registers
                </p>
              </div>
              <Switch 
                checked={newMemberAlerts} 
                onCheckedChange={setNewMemberAlerts}
                disabled={!isAdmin}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly Reports</p>
                <p className="text-sm text-muted-foreground">
                  Receive weekly attendance summary
                </p>
              </div>
              <Switch 
                checked={weeklyReports} 
                onCheckedChange={setWeeklyReports}
                disabled={!isAdmin}
              />
            </div>
          </div>
        </motion.div>

        <Separator className="my-6" />

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <Shield className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold">Security</h3>
              <p className="text-sm text-muted-foreground">
                Manage security settings
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setIsPasswordDialogOpen(true)}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              Change Password
            </Button>
            
            {isAdmin && (
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/user-management')}
              >
                <Users className="mr-2 h-4 w-4" />
                Manage User Roles
              </Button>
            )}
          </div>
        </motion.div>

        {isAdmin && (
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="btn-gold">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your new password below. Password must be at least 6 characters.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordChange} disabled={isChangingPassword}>
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
