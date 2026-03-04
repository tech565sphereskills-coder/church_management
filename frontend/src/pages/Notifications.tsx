import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { 
  Bell, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  UserPlus, 
  TrendingUp, 
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from 'framer-motion';

export default function Notifications() {
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Member Registered', description: 'Michael Smith just joined the workforce as a first timer.', time: '2 minutes ago', category: 'Membership', type: 'user', read: false },
    { id: 2, title: 'Tithe Payment Received', description: 'A new tithe payment of #50,000 has been recorded for the morning service.', time: '1 hour ago', category: 'Finance', type: 'money', read: false },
    { id: 3, title: 'Midweek Service Reminder', description: 'Today\'s midweek service starts in exactly 30 minutes. Ensure all stewards are ready.', time: '2 hours ago', category: 'Service', type: 'clock', read: true },
    { id: 4, title: 'System Security Alert', description: 'A login attempt was detected from a new IP address for the user "admin".', time: '5 hours ago', category: 'Security', type: 'alert', read: true },
    { id: 5, title: 'Birthday Celebration', description: 'Sister Sarah Ajayi is celebrating her birthday today. Don\'t forget to send a message!', time: 'Yesterday', category: 'Events', type: 'star', read: true },
    { id: 6, title: 'Monthly Report Generated', description: 'The attendance and financial report for last month is now available for download.', time: '2 days ago', category: 'Admin', type: 'report', read: true },
  ]);

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredNotifications = notifications.filter(n => {
    const matchesFilter = filter === 'all' ? true : filter === 'unread' ? !n.read : n.read;
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                          n.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'user': return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'money': return <TrendingUp className="h-5 w-5 text-emerald-500" />;
      case 'clock': return <Clock className="h-5 w-5 text-amber-500" />;
      case 'alert': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Bell className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/30">
      <Header 
        title="Notifications Center" 
        subtitle="Manage and view all your system alerts and activities." 
      />

      <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search alerts..." 
                className="pl-10 h-11 rounded-xl border-slate-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[140px] h-11 rounded-xl border-slate-200">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <Button 
                variant="outline" 
                className="flex-1 md:flex-none h-11 rounded-xl gap-2 font-bold !text-black"
                onClick={markAllRead}
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark all as read
            </Button>
            <Button 
                variant="ghost" 
                className="flex-1 md:flex-none h-11 rounded-xl gap-2 font-bold text-red-600 hover:bg-red-50"
                onClick={clearAll}
            >
              <Trash2 className="h-4 w-4" />
              Clear all
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((n) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                >
                  <Card className={cn(
                    "border-none shadow-sm transition-all hover:shadow-md overflow-hidden",
                    !n.read ? "bg-white ring-1 ring-primary/10" : "bg-slate-50/80"
                  )}>
                    <CardContent className="p-0">
                      <div className="flex items-start gap-4 p-5">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                          !n.read ? "bg-primary/10" : "bg-slate-100"
                        )}>
                          {getIcon(n.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0 pr-10">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className={cn(
                              "text-base font-bold truncate",
                              !n.read ? "text-slate-900" : "text-slate-600"
                            )}>
                              {n.title}
                            </h4>
                            <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">{n.time}</span>
                          </div>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            {n.description}
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 font-bold uppercase tracking-wider bg-slate-200/50 text-slate-500 border-none">
                              {n.category}
                            </Badge>
                            {!n.read && (
                              <Badge className="text-[10px] px-2 py-0 h-5 font-bold uppercase tracking-wider bg-primary text-white border-none">
                                New
                              </Badge>
                            )}
                          </div>
                        </div>

                        <button 
                          onClick={() => deleteNotification(n.id)}
                          className="absolute right-4 top-5 h-10 w-10 text-slate-300 hover:text-red-500 flex items-center justify-center transition-colors rounded-xl hover:bg-red-50"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 flex flex-col items-center gap-4 text-center"
              >
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                  <Bell className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900">No notifications found</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">
                    There are no alerts matching your current filters. Try searching for something else.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: unknown[]) {
  return inputs.filter(Boolean).join(' ');
}
