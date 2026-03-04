import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  requiredRole?: import('@/types/auth').AppRole | import('@/types/auth').AppRole[];
  requiredPermission?: import('@/types/auth').PermissionKey | import('@/types/auth').PermissionKey[];
  matchAllPermissions?: boolean;
  requireAnyRole?: boolean;
}

export function ProtectedRoute({ 
  requiredRole, 
  requiredPermission, 
  matchAllPermissions = false,
  requireAnyRole = true 
}: ProtectedRouteProps) {
  const auth = useAuth();
  const { user, role, loading } = auth;

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

  let isAuthorized = true;

  // Check for specific permission requirement
  if (requiredPermission) {
    const permsArray = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    
    if (matchAllPermissions) {
      isAuthorized = permsArray.every(p => !!auth[p]);
    } else {
      isAuthorized = permsArray.some(p => !!auth[p]);
    }
  }

  // Check for specific role requirement (if permission check hasn't already failed or wasn't present)
  if (isAuthorized && requiredRole) {
    const roleHierarchy: Record<string, number> = {
      admin: 4,
      finance_officer: 3,
      attendance_officer: 2,
      viewer: 1,
    };

    const userRoleLevel = role ? roleHierarchy[role] : 0;
    
    if (Array.isArray(requiredRole)) {
      // If array, authorize if user has any of the literal roles
      isAuthorized = requiredRole.includes(role as import('@/types/auth').AppRole);
    } else {
      // If single string, authorize based on hierarchy (higher or equal)
      const requiredRoleLevel = roleHierarchy[requiredRole];
      isAuthorized = userRoleLevel >= requiredRoleLevel;
    }
  }

  if (!isAuthorized) {
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

  return <Outlet />;
}
