import { Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

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
  const context = useOutletContext();
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
        <div className="text-center max-w-md w-full p-8 rounded-2xl bg-card border border-border shadow-2xl">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Access Pending</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Welcome, <span className="font-semibold text-foreground">{user?.email}</span>. 
            Your account is currently awaiting role assignment from a church administrator.
          </p>
          <div className="mt-8 flex flex-col gap-3">
             <Button 
               variant="outline" 
               className="w-full h-12 rounded-xl"
               onClick={() => window.location.reload()}
             >
               Check Again
             </Button>
             <Button 
               variant="ghost" 
               className="w-full h-12 rounded-xl text-muted-foreground"
               onClick={() => auth.signOut()}
             >
               Sign Out
             </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground uppercase tracking-widest font-black">
            RCCG Emmanuel Sanctuary
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

  return <Outlet context={context} />;
}
