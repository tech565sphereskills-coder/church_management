import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Clock, Radio } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AttendanceRecord {
  id: number;
  member_name: string;
  member_photo?: string;
  marked_at: string;
}

interface LivePresenceFeedProps {
  records: AttendanceRecord[];
  isLoading: boolean;
}

export function LivePresenceFeed({ records, isLoading }: LivePresenceFeedProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className="border-none shadow-premium overflow-hidden bg-slate-900 text-white">
      <CardHeader className="border-b border-white/10 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-black flex items-center gap-2">
            <Radio className="h-5 w-5 text-rose-500 animate-pulse" />
            Live Check-in Feed
          </CardTitle>
          <Badge className="bg-rose-500/20 text-rose-400 border-none px-2 py-0.5 animate-pulse">
            Recording
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 max-h-[400px] overflow-y-auto no-scrollbar">
        {isLoading && records.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Clock className="h-8 w-8 mx-auto mb-2 animate-spin opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest">Synchronizing Feed...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-500 border-2 border-dashed border-white/5 m-4 rounded-3xl">
            <p className="text-xs font-bold uppercase tracking-widest opacity-40">No activity yet today</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            <AnimatePresence initial={false}>
              {records.map((record) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                  animate={{ opacity: 1, x: 0, backgroundColor: "rgba(255, 255, 255, 0)" }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                >
                  <Avatar className="h-12 w-12 border-2 border-white/10 shadow-lg">
                    {record.member_photo && <AvatarImage src={record.member_photo} />}
                    <AvatarFallback className="bg-indigo-500/20 text-indigo-400 font-black">
                      {getInitials(record.member_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{record.member_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                        Authenticated
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-rose-400/60 uppercase">
                      {formatDistanceToNow(new Date(record.marked_at), { addSuffix: true }).replace('about ', '')}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
      <div className="p-3 bg-white/5 text-center">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
          Auto-refreshing every 10 seconds
        </p>
      </div>
    </Card>
  );
}
