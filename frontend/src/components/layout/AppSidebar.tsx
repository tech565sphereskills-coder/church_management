import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  History,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  AlertTriangle,
  MessageSquare,
  Banknote,
  Building2,
  Baby,
  HandHelping,
  CalendarDays,
  Calendar as CalendarIcon,
  Cake,
  ShieldCheck,
  PieChart,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/context/sidebar-context';
import { prefetchRoute } from '@/lib/prefetcher';
import { useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

const RCCG_LOGO_URL = 'https://res.cloudinary.com/dnglp9qfd/image/upload/v1770460225/Rccg_logo_ttgxko.png';

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  adminOnly?: boolean;
  permission?: import('@/types/auth').PermissionKey | import('@/types/auth').PermissionKey[];
  matchAll?: boolean;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: CalendarIcon, label: 'Calendar', path: '/calendar', permission: 'canManageCalendar' },
  { icon: UserCheck, label: 'Attendance', path: '/attendance', permission: 'canManageAttendance' },
  { icon: Users, label: 'Members', path: '/members', permission: 'canManageMembers' },
  { icon: MessageSquare, label: 'Messaging', path: '/messaging' },
  { icon: Cake, label: 'Celebrations', path: '/birthdays', permission: 'canManageMembers' },
  { icon: AlertTriangle, label: 'Follow-Up', path: '/follow-up', permission: 'canManageMembers' },
  { icon: Banknote, label: 'Financials', path: '/financials', permission: 'canManageFinances' },
  { icon: Building2, label: 'Departments', path: '/departments', permission: 'canManageDepartments' },
  { icon: ShieldCheck, label: 'Ministers', path: '/ministers', permission: 'canManageDepartments' },
  { icon: Users, label: 'Family', path: '/family' },
  { icon: Package, label: 'Inventory', path: '/inventory' },
  { icon: PieChart, label: 'Dept. Reports', path: '/departments/reports', permission: 'canViewReports' },
  { icon: Baby, label: 'Children', path: '/children', permission: 'canManageChildren' },
  { icon: HandHelping, label: 'Prayer Requests', path: '/prayer-requests', permission: 'canManagePrayer' },
  { icon: History, label: 'History', path: '/history' },
  { icon: BarChart3, label: 'Reports', path: '/reports', permission: 'canViewReports' },
  { icon: ShieldCheck, label: 'Audit Logs', path: '/audit-logs', adminOnly: true },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function AppSidebar() {
  const { isCollapsed, setIsCollapsed, isMobile, mobileOpen, setMobileOpen } = useSidebar();
  const location = useLocation();
  const { user, role, signOut, isAdmin, ...authProps } = useAuth();
  const queryClient = useQueryClient();

  const onToggle = () => {
    if (isMobile) setMobileOpen(!mobileOpen);
    else setIsCollapsed(!isCollapsed);
  };
  
  const onMobileClose = () => setMobileOpen(false);

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'attendance_officer': return 'Attendance Officer';
      case 'finance_officer': return 'Finance Officer';
      case 'children_officer': return 'Children Officer';
      case 'prayer_officer': return 'Prayer Officer';
      case 'hod': return 'Head of Dept.';
      case 'viewer': return 'Viewer';
      default: return 'Pending';
    }
  };

  const handleNavClick = () => {
    if (isMobile) onMobileClose();
  };

  const sidebarContent = (
    <SidebarContent
      isCollapsed={isMobile ? false : isCollapsed}
      onToggle={onToggle}
      location={location}
      isAdmin={isAdmin}
      authProps={authProps}
      user={user}
      role={role}
      signOut={signOut}
      getUserInitials={getUserInitials}
      getRoleLabel={getRoleLabel}
      onNavClick={handleNavClick}
      isMobile={isMobile || false}
      onMobileClose={onMobileClose}
      queryClient={queryClient}
    />
  );

  return (
    <>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 border-none w-[280px]">
          <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground shadow-2xl">
            {sidebarContent}
          </div>
        </SheetContent>
      </Sheet>

      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 z-40 hidden lg:flex h-screen flex-col bg-sidebar text-sidebar-foreground print:hidden"
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}

interface SidebarContentProps {
  isCollapsed: boolean;
  onToggle: () => void;
  location: ReturnType<typeof useLocation>;
  isAdmin: boolean;
  authProps: any;
  user: { email?: string; username?: string } | null;
  role: string | null;
  signOut: () => void;
  getUserInitials: () => string;
  getRoleLabel: () => string;
  onNavClick: () => void;
  isMobile: boolean;
  onMobileClose?: () => void;
  queryClient: any;
}

function SidebarContent({
  isCollapsed, onToggle, location, isAdmin, authProps, user, signOut,
  getUserInitials, getRoleLabel, onNavClick, isMobile, onMobileClose,
  queryClient
}: SidebarContentProps) {
  return (
    <>
      <div className="flex h-20 items-center justify-between px-4">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white p-1 ring-1 ring-white/10">
                <img src={RCCG_LOGO_URL} alt="RCCG Logo" className="h-full w-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-lg font-semibold leading-tight text-sidebar-foreground">RCCG</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-sidebar-foreground/50">Emmanuel Sanctuary</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isCollapsed && (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white p-1 ring-1 ring-white/10">
            <img src={RCCG_LOGO_URL} alt="RCCG Logo" className="h-full w-full object-contain" />
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            if (item.permission) {
              const permsArray = Array.isArray(item.permission) ? item.permission : [item.permission];
              const isAuthorized = item.matchAll 
                ? permsArray.every(p => !!authProps[p as keyof typeof authProps])
                : permsArray.some(p => !!authProps[p as keyof typeof authProps]);
              if (!isAuthorized) return null;
            }
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onNavClick}
                  onMouseEnter={() => prefetchRoute(item.path, { queryClient })}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-primary'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 shrink-0 transition-transform duration-200', !isActive && 'group-hover:scale-110')} />
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      transition={{ duration: 0.2 }}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-3 flex items-center gap-3 rounded-xl bg-sidebar-accent/50 px-3 py-2"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
                {getUserInitials()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{user?.email?.split('@')[0] || 'User'}</p>
                <p className="truncate text-xs text-sidebar-foreground/70">{getRoleLabel()}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="flex-1 justify-center text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : (
              <>
                <ChevronLeft className="mr-2 h-5 w-5" />
                <span>Collapse</span>
              </>
            )}
          </Button>

          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
