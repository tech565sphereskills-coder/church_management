import { useNavigate } from 'react-router-dom';
import { useSidebar } from '@/context/sidebar-context';
import { useNotifications } from '@/context/NotificationContext';
import { Bell, Search, Menu, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

export function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const { setMobileOpen, isMobile } = useSidebar();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  const today = new Date().toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="lg:hidden -ml-2 h-10 w-10 md:h-12 md:w-12"
          aria-label="Open side menu"
        >
          <Menu className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight line-clamp-1">{title}</h1>
          <p className="text-[10px] md:text-sm text-muted-foreground font-medium truncate">{subtitle || today}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search members..."
            className="h-10 w-64 rounded-full border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>


        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative group">
              <Bell className="h-5 w-5 group-hover:rotate-12 transition-transform" />
              {notifications.length > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent animate-pulse" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 overflow-hidden shadow-2xl border-border" align="end">
            <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold">Notifications</h4>
                {notifications.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-[16px] flex items-center justify-center">
                    {notifications.length}
                  </Badge>
                )}
              </div>
              {notifications.length > 0 && (
                <button 
                  onClick={clearAll}
                  className="text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            <ScrollArea className="h-[350px]">
              <div className="flex flex-col">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Bell className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium text-foreground">All caught up!</p>
                    <p className="text-xs text-muted-foreground">No new notifications at the moment.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="group relative border-b last:border-0">
                      <button className={cn(
                        "flex flex-col gap-1 p-4 text-left hover:bg-muted/50 transition-colors w-full",
                        !n.read && "bg-primary/5"
                      )}>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-sm font-semibold leading-none group-hover:text-primary transition-colors">{n.title}</span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 pr-6">{n.description}</p>
                      </button>
                      {!n.read && (
                        <button 
                          onClick={() => markAsRead(n.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full flex items-center justify-center bg-background/80 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white shadow-sm"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            {notifications.length > 0 && (
              <button 
                onClick={() => navigate('/notifications')}
                className="w-full py-2.5 text-center text-xs font-semibold text-primary hover:bg-muted/50 transition-colors border-t bg-muted/10"
              >
                View All Notifications
              </button>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
