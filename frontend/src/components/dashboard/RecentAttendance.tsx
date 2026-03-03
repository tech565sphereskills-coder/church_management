import { motion } from 'framer-motion';
import { Check, Clock } from 'lucide-react';
import { AttendanceRecord } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface RecentAttendanceProps {
  records: AttendanceRecord[];
}

export function RecentAttendance({ records }: RecentAttendanceProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Check-ins</h3>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Today
        </span>
      </div>

      <div className="space-y-3">
        {records.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No check-ins yet today
          </p>
        ) : (
          records.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="attendance-item"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(record.memberName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{record.memberName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(record.timestamp)}
                  </p>
                </div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                <Check className="h-4 w-4 text-success" />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
