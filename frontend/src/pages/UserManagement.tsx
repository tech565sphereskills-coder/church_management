import { Header } from '@/components/layout/Header';
import { motion } from 'framer-motion';
import { Users, Shield, UserCheck, Eye, Loader2 } from 'lucide-react';
import { useUserManagement, UserWithRole, AppRole } from '@/hooks/useUserManagement';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

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
  viewer: {
    label: 'Viewer',
    icon: <Eye className="h-3 w-3" />,
    color: 'bg-muted text-muted-foreground border-border',
  },
};

export default function UserManagement() {
  const { users, loading, assignRole } = useUserManagement();

  const handleRoleChange = async (userId: string, value: string) => {
    if (value === 'pending') {
      return;
    }
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
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
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
            <div className="flex items-center gap-3 mb-4">
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

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            ) : activeUsers.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                    No active users yet
                </p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Current Role</TableHead>
                            <TableHead>Change Role</TableHead>
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
                                            <SelectItem value="viewer">Viewer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </motion.div>
      </div>
    </div>
  );
}
