import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Menu, Sun, Moon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

export function Header({ title, subtitle, onMenuToggle, showMenuButton }: HeaderProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Member Registered', description: 'Michael Smith just joined the workforce.', time: '2m ago', icon: 'user' },
    { id: 2, title: 'Tithe Payment', description: 'A new tithe payment of #50,000 has been received.', time: '1h ago', icon: 'money' },
    { id: 3, title: 'Service Reminder', description: 'Midweek service starts in 30 minutes.', time: '2h ago', icon: 'clock' },
    { id: 4, title: 'System Update', description: 'System will be under maintenance at 12 AM.', time: '5h ago', icon: 'alert' }
  ]);

  const clearNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const today = new Date().toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
        )}
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">{title}</h1>
          <p className="text-xs md:text-sm text-muted-foreground font-medium">{subtitle || today}</p>
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

        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

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
                      <button className="flex flex-col gap-1 p-4 text-left hover:bg-muted/50 transition-colors w-full">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-sm font-semibold leading-none group-hover:text-primary transition-colors">{n.title}</span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{n.time}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 pr-6">{n.description}</p>
                      </button>
                      <button 
                        onClick={() => clearNotification(n.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full flex items-center justify-center bg-background/80 opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-white shadow-sm"
                      >
                        <Check className="h-3 w-3" />
                      </button>
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
