import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { motion } from 'framer-motion';
import { Users, Shield, UserCheck, Eye, Loader2, Plus, Lock, Mail, UserPlus, Trash2, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserManagement, UserWithRole, AppRole } from '@/hooks/useUserManagement';
import { useMembers } from '@/hooks/useMembers';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

const roleConfig: Record<AppRole, { label: string; icon: React.ReactNode; color: string }> = {
  admin: {
    label: 'Admin',
    icon: <Shield className="h-3 w-3" />,
    color: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  attendance_officer: {
    label: 'Attendance Officer',
    icon: <UserCheck className="h-3 w-3" />,
    color: 'bg-primary/10 text-primary border-primary/20',
  },
  finance_officer: {
    label: 'Finance Officer',
    icon: <Shield className="h-3 w-3" />,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  children_officer: {
    label: 'Children Officer',
    icon: <Users className="h-3 w-3" />,
    color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  },
  prayer_officer: {
    label: 'Prayer Officer',
    icon: <UserCheck className="h-3 w-3" />,
    color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  },
  hod: {
    label: 'Head of Dept.',
    icon: <Users className="h-3 w-3" />,
    color: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  },
  viewer: {
    label: 'Viewer',
    icon: <Eye className="h-3 w-3" />,
    color: 'bg-muted text-muted-foreground border-border',
  },
};

const PermissionSummary = ({ user }: { user: UserWithRole }) => {
    if (user.role === 'admin') return <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Full Access</Badge>;
    
    const perms = [
        { key: 'can_manage_members', label: 'Members' },
        { key: 'can_manage_attendance', label: 'Attendance' },
        { key: 'can_manage_financials', label: 'Finance' },
        { key: 'can_manage_departments', label: 'Deps' },
        { key: 'can_manage_children', label: 'Children' },
        { key: 'can_manage_prayer_requests', label: 'Prayer' },
        { key: 'can_manage_calendar', label: 'Calendar' },
        { key: 'can_view_reports', label: 'Reports' },
        { key: 'can_manage_settings', label: 'Settings' },
    ];

    const active = perms.filter(p => !!user[p.key as keyof UserWithRole]);
    
    if (active.length === 0) return <span className="text-xs text-slate-400 italic">No access</span>;
    if (active.length > 3) {
        return (
            <div className="flex items-center gap-1 justify-end">
                <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-slate-50 border-slate-200">
                    {active[0].label}
                </Badge>
                <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-slate-50 border-slate-200">
                    {active[1].label}
                </Badge>
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-slate-100 border-slate-200 text-slate-600">
                    +{active.length - 2} more
                </Badge>
            </div>
        );
    }
    
    return (
        <div className="flex gap-1 justify-end flex-wrap max-w-[150px]">
            {active.map(p => (
                <Badge key={p.key} variant="outline" className="h-5 px-1.5 text-[10px] bg-slate-50 border-slate-200 whitespace-nowrap">
                    {p.label}
                </Badge>
            ))}
        </div>
    );
};

export default function UserManagement() {
  const { users, loading, assignRole, updatePermissions, fetchUsers, createUser, deleteUser } = useUserManagement();

  const handlePermissionsUpdate = async (userId: string, permissions: Partial<UserWithRole>) => {
    const success = await updatePermissions(userId, permissions);
    if (!success) {
      // Re-fetch to ensure UI is in sync if update failed
      await fetchUsers(true);
    }
  };

  const handleRoleChange = async (userId: string, value: string) => {
    if (value === 'pending') return;
    await assignRole(userId, value as AppRole);
  };

  const getRoleBadge = (role: AppRole | null) => {
    if (!role) {
      return (
        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
          Pending Approval
        </Badge>
      );
    }

    const config = roleConfig[role];
    return (
      <Badge variant="outline" className={config.color}>
        <span className="flex items-center gap-1">
          {config.icon}
          {config.label}
        </span>
      </Badge>
    );
  };

  const pendingUsers = users.filter(u => !u.role);
  const activeUsers = users.filter(u => u.role);

  return (
    <div className="min-h-screen">
      <Header title="User Management" subtitle="Manage user roles and permissions" />

      <div className="p-6 space-y-6">
        {/* Pending Approvals Section */}
        {pendingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-accent/20 bg-accent/5 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">Pending Approvals</h3>
                <p className="text-sm text-muted-foreground">
                  {pendingUsers.length} user(s) awaiting role assignment
                </p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Assign Role</TableHead>
                  <TableHead className="text-right">Permissions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || 'No name'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Select onValueChange={(value) => handleRoleChange(user.id, value)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select role..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="attendance_officer">Attendance Officer</SelectItem>
                          <SelectItem value="finance_officer">Finance Officer</SelectItem>
                          <SelectItem value="children_officer">Children Officer</SelectItem>
                          <SelectItem value="prayer_officer">Prayer Officer</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                            <div className="flex flex-col items-end gap-1">
                                <PermissionSummary user={user} />
                                <PermissionDialog 
                                    user={user} 
                                    onSave={(perms) => handlePermissionsUpdate(user.id, perms)} 
                                />
                            </div>
                            <DeleteUserDialog user={user} onDelete={() => deleteUser(user.id)} />
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        )}

        {/* Active Users Section */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-6"
        >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Active Users</h3>
                            <p className="text-sm text-muted-foreground">
                                {activeUsers.length} user(s) with assigned roles
                            </p>
                        </div>
                    </div>
                    <CreateUserDialog onCreate={createUser} />
                </div>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            ) : activeUsers.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                    No active users yet
                </p>
            ) : (
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Current Role</TableHead>
                            <TableHead>Change Role</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Access Rights</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activeUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    {user.full_name || 'No name'}
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{getRoleBadge(user.role as AppRole)}</TableCell>
                                <TableCell>
                                    <Select
                                        defaultValue={user.role || undefined}
                                        onValueChange={(value) => handleRoleChange(user.id, value)}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="attendance_officer">Attendance Officer</SelectItem>
                                            <SelectItem value="finance_officer">Finance Officer</SelectItem>
                                            <SelectItem value="children_officer">Children Officer</SelectItem>
                                            <SelectItem value="prayer_officer">Prayer Officer</SelectItem>
                                            <SelectItem value="viewer">Viewer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="text-right">
                                    <PermissionSummary user={user} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <PermissionDialog 
                                            user={user} 
                                            onSave={(perms) => handlePermissionsUpdate(user.id, perms)} 
                                        />
                                        <DeleteUserDialog user={user} onDelete={() => deleteUser(user.id)} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            )}
        </motion.div>
      </div>
    </div>
  );
}

function PermissionDialog({ user, onSave }: { user: UserWithRole; onSave: (perms: Partial<UserWithRole>) => Promise<void> }) {
    const [open, setOpen] = useState(false);
    const [tempPermissions, setTempPermissions] = useState<Partial<UserWithRole>>({});
    const [saving, setSaving] = useState(false);
    const { members } = useMembers();

    useEffect(() => {
        if (open && !saving) {
            setTempPermissions({
                member: user.member || null,
                can_manage_members: Boolean(user.can_manage_members),
                can_manage_attendance: Boolean(user.can_manage_attendance),
                can_manage_financials: Boolean(user.can_manage_financials),
                can_manage_departments: Boolean(user.can_manage_departments),
                can_manage_children: Boolean(user.can_manage_children),
                can_manage_prayer_requests: Boolean(user.can_manage_prayer_requests),
                can_manage_calendar: Boolean(user.can_manage_calendar),
                can_view_reports: Boolean(user.can_view_reports),
                can_manage_settings: Boolean(user.can_manage_settings),
            });
        }
    }, [open, user, saving]);

    const handleToggle = (key: keyof UserWithRole, value: boolean) => {
        setTempPermissions(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await onSave(tempPermissions);
            setOpen(false); // Close first to avoid any temp state flicker
        } finally {
            setSaving(false);
        }
    };

    const isAdmin = user.role === 'admin';

    const permissionsList = [
        { key: 'can_manage_members', label: 'Manage Members' },
        { key: 'can_manage_attendance', label: 'Manage Attendance' },
        { key: 'can_manage_financials', label: 'Manage Financials' },
        { key: 'can_manage_departments', label: 'Manage Departments' },
        { key: 'can_manage_children', label: 'Manage Children' },
        { key: 'can_manage_prayer_requests', label: 'Manage Prayer Requests' },
        { key: 'can_manage_calendar', label: 'Manage Calendar' },
        { key: 'can_view_reports', label: 'View Reports' },
        { key: 'can_manage_settings', label: 'Manage Settings' },
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5">
                    <Shield className="h-4 w-4 text-primary" />
                    Permissions
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl overflow-hidden p-0">
                <div className="bg-primary h-1.5 w-full" />
                <div className="p-6 space-y-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Manage Permissions
                        </DialogTitle>
                        <p className="text-sm text-slate-500 font-medium">
                            Set access levels for <span className="text-slate-900 font-bold">{user.full_name || user.email}</span>
                        </p>
                    </DialogHeader>

                    <div className="space-y-4">
                        {isAdmin ? (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm font-medium flex gap-3">
                                <Shield className="h-5 w-5 shrink-0" />
                                <p>Administrators have full access to all modules by default. These toggles will not affect their access levels.</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2 pb-4 border-b border-slate-100">
                                    <label className="text-sm font-bold text-slate-700">Link to Church Member</label>
                                    <Select 
                                        value={String(tempPermissions.member || 'none')} 
                                        onValueChange={(val) => setTempPermissions(prev => ({ ...prev, member: val === 'none' ? null : val }))}
                                    >
                                        <SelectTrigger className="w-full bg-slate-50 border-slate-200">
                                            <SelectValue placeholder="Select member record..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Not linked</SelectItem>
                                            {members.map((m: { id: string | number; full_name: string }) => (
                                                <SelectItem key={m.id} value={String(m.id)}>{m.full_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-slate-400 italic">Required for the "Head of Dept." portal to identify their team.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-2 max-h-[320px] overflow-y-auto pr-1">
                                    {permissionsList.map((perm) => (
                                        <div 
                                            key={perm.key} 
                                            className="flex items-center justify-between space-x-2 rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-all group"
                                        >
                                            <label
                                                htmlFor={`${user.id}-${perm.key}`}
                                                className="text-sm font-bold text-slate-700 cursor-pointer flex-1 group-hover:text-primary transition-colors"
                                            >
                                                {perm.label}
                                            </label>
                                            <Checkbox
                                                id={`${user.id}-${perm.key}`}
                                                checked={!!tempPermissions[perm.key as keyof UserWithRole]}
                                                onCheckedChange={(checked) => handleToggle(perm.key as keyof UserWithRole, !!checked)}
                                                className="rounded-md border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <Button variant="ghost" onClick={() => setOpen(false)} className="font-bold text-slate-500">
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSave} disabled={saving} className="rounded-xl px-6 h-11 shadow-lg shadow-primary/20">
                                        {saving ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <UserCheck className="mr-2 h-4 w-4" />
                                        )}
                                        Save Access Rights
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function CreateUserDialog({ onCreate }: { onCreate: (email: string, fullName: string, password: string) => Promise<boolean> }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const success = await onCreate(email, fullName, password);
        setIsLoading(false);
        if (success) {
            setOpen(false);
            setEmail('');
            setFullName('');
            setPassword('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-xl gap-2 font-black tracking-tight shadow-md shadow-primary/20">
                    <UserPlus className="h-4 w-4" />
                    Create New User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                <div className="h-2 w-full bg-primary" />
                <div className="p-8 space-y-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black flex items-center gap-3 tracking-tight">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <UserPlus className="h-5 w-5 text-primary" />
                            </div>
                            Create Internal User
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground font-medium pt-1">
                            Set up a new system account. The user can change their password later in Settings.
                        </p>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="create-fullName" className="text-xs font-bold text-slate-700 ml-1">Full Name</Label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none group-focus-within:text-primary transition-colors">
                                    <Users className="h-4 w-4 text-slate-400" />
                                </div>
                                <Input
                                    id="create-fullName"
                                    placeholder="Enter full name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="pl-11 h-11 bg-slate-50 border-slate-200 rounded-xl font-medium focus:ring-primary/20"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="create-email" className="text-xs font-bold text-slate-700 ml-1">Email Address</Label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none group-focus-within:text-primary transition-colors">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                </div>
                                <Input
                                    id="create-email"
                                    type="email"
                                    placeholder="user@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-11 h-11 bg-slate-50 border-slate-200 rounded-xl font-medium focus:ring-primary/20"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 pb-2">
                            <Label htmlFor="create-password" className="text-xs font-bold text-slate-700 ml-1">Initial Password</Label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none group-focus-within:text-primary transition-colors">
                                    <Lock className="h-4 w-4 text-slate-400" />
                                </div>
                                <Input
                                    id="create-password"
                                    type="text"
                                    placeholder="Enter initial password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-11 h-11 bg-slate-50 border-slate-200 rounded-xl font-medium focus:ring-primary/20"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1 rounded-xl h-11 font-bold text-slate-500">
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-[2] rounded-xl h-11 font-black tracking-tight shadow-lg shadow-primary/20" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        CREATING...
                                    </>
                                ) : (
                                    'CREATE ACCOUNT'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
function DeleteUserDialog({ user, onDelete }: { user: UserWithRole; onDelete: () => Promise<boolean> }) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        const success = await onDelete();
        setIsDeleting(false);
        if (success) {
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                <div className="h-2 w-full bg-destructive" />
                <div className="p-6 space-y-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Account
                        </DialogTitle>
                        <div className="pt-2">
                            <p className="text-sm text-slate-600">
                                Are you sure you want to delete <span className="font-bold text-slate-900">{user.full_name || user.email}</span>?
                            </p>
                            <p className="text-xs text-slate-400 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                This action is permanent and will remove all authentication and profile data for this user.
                            </p>
                        </div>
                    </DialogHeader>

                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="flex-1 rounded-xl h-11 font-bold text-slate-500">
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDelete} 
                            disabled={isDeleting}
                            className="flex-1 rounded-xl h-11 font-bold shadow-lg shadow-destructive/20"
                        >
                            {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Delete Forever'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
