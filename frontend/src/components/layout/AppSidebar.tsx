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
  Sun,
  Moon,
  Banknote,
  Building2,
  Baby,
  HandHelping,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';

const RCCG_LOGO_URL = 'https://res.cloudinary.com/dnglp9qfd/image/upload/v1770460225/Rccg_logo_ttgxko.png';

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  adminOnly?: boolean;
  financeOnly?: boolean;
  childrenOnly?: boolean;
  prayerOnly?: boolean;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: UserCheck, label: 'Attendance', path: '/attendance' },
  { icon: Users, label: 'Members', path: '/members' },
  { icon: MessageSquare, label: 'Messaging', path: '/messaging' },
  { icon: AlertTriangle, label: 'Follow-Up', path: '/follow-up' },
  { icon: Banknote, label: 'Financials', path: '/financials', financeOnly: true },
  { icon: Building2, label: 'Departments', path: '/departments' },
  { icon: Baby, label: 'Children', path: '/children', childrenOnly: true },
  { icon: HandHelping, label: 'Prayer Requests', path: '/prayer-requests', prayerOnly: true },
  { icon: History, label: 'History', path: '/history' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

interface AppSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AppSidebar({ isCollapsed, onToggle, isMobile, mobileOpen, onMobileClose }: AppSidebarProps) {
  const location = useLocation();
  const { user, role, signOut, isAdmin, isFinanceOfficer, 
    isChildrenOfficer, isPrayerOfficer 
  } = useAuth();
  const { theme, setTheme } = useTheme();

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
      case 'viewer': return 'Viewer';
      default: return 'Pending';
    }
  };

  const handleNavClick = () => {
    if (isMobile && onMobileClose) onMobileClose();
  };

  // On mobile, render as a sliding drawer
  if (isMobile) {
    return (
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col bg-sidebar text-sidebar-foreground"
          >
            <SidebarContent
              isCollapsed={false}
              onToggle={onToggle}
              location={location}
              isAdmin={isAdmin}
              isFinanceOfficer={isFinanceOfficer}
              isChildrenOfficer={isChildrenOfficer}
              isPrayerOfficer={isPrayerOfficer}
              user={user}
              role={role}
              signOut={signOut}
              getUserInitials={getUserInitials}
              getRoleLabel={getRoleLabel}
              onNavClick={handleNavClick}
              theme={theme}
              setTheme={setTheme}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground print:hidden"
    >
      <SidebarContent
        isCollapsed={isCollapsed}
        onToggle={onToggle}
        location={location}
        isAdmin={isAdmin}
        isFinanceOfficer={isFinanceOfficer}
        isChildrenOfficer={isChildrenOfficer}
        isPrayerOfficer={isPrayerOfficer}
        user={user}
        role={role}
        signOut={signOut}
        getUserInitials={getUserInitials}
        getRoleLabel={getRoleLabel}
        onNavClick={handleNavClick}
        theme={theme}
        setTheme={setTheme}
      />
    </motion.aside>
  );
}

interface SidebarContentProps {
  isCollapsed: boolean;
  onToggle: () => void;
  location: ReturnType<typeof useLocation>;
  isAdmin: boolean;
  isFinanceOfficer: boolean;
  isChildrenOfficer: boolean;
  isPrayerOfficer: boolean;
  user: { email?: string; username?: string } | null;
  role: string | null;
  signOut: () => void;
  getUserInitials: () => string;
  getRoleLabel: () => string;
  onNavClick: () => void;
  theme: string | undefined;
  setTheme: (t: string) => void;
}

function SidebarContent({
  isCollapsed, onToggle, location, isAdmin, isFinanceOfficer, 
  isChildrenOfficer, isPrayerOfficer, user, signOut,
  getUserInitials, getRoleLabel, onNavClick, theme, setTheme,
}: SidebarContentProps) {
  return (
    <>
      {/* Header */}
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
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white p-1">
                <img src={RCCG_LOGO_URL} alt="RCCG Logo" className="h-full w-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-lg font-semibold leading-tight">RCCG</span>
                <span className="text-xs text-sidebar-foreground/70">Emmanuel Sanctuary</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isCollapsed && (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white p-1">
            <img src={RCCG_LOGO_URL} alt="RCCG Logo" className="h-full w-full object-contain" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            if (item.financeOnly && !isAdmin && !isFinanceOfficer) return null;
            if (item.childrenOnly && !isAdmin && !isChildrenOfficer) return null;
            if (item.prayerOnly && !isAdmin && !isPrayerOfficer) return null;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onNavClick}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-primary'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 shrink-0 transition-transform duration-200', !isActive && 'group-hover:scale-110')} />
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
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
          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

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
