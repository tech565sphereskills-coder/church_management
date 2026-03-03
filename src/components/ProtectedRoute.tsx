import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  requiredRole?: 'admin' | 'attendance_officer' | 'viewer';
  requireAnyRole?: boolean;
}

export function ProtectedRoute({ requiredRole, requireAnyRole = true }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user is authenticated but has no role yet, show a pending state
  if (requireAnyRole && !role) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Access Pending</h2>
          <p className="mt-2 text-muted-foreground">
            Your account is awaiting role assignment from an administrator.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Please contact the church administrator to get access.
          </p>
        </div>
      </div>
    );
  }

  // Check for specific role requirement
  if (requiredRole) {
    const roleHierarchy = {
      admin: 3,
      attendance_officer: 2,
      viewer: 1,
    };

    const userRoleLevel = role ? roleHierarchy[role] : 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
            <p className="mt-2 text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <Outlet />;
}
