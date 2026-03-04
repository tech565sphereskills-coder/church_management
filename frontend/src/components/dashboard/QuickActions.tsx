import { motion } from 'framer-motion';
import { UserPlus, Clock, ChevronRight, Calendar, Coffee, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface QuickActionsProps {
  serviceType?: string;
}

export function QuickActions({ serviceType = 'Sunday Service' }: QuickActionsProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>

      <div className="space-y-3">
        <Button
          onClick={() => navigate('/attendance', { state: { serviceType: 'sunday_service' } })}
          className="btn-gold w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Mark Sunday Service
          </span>
          <ChevronRight className="h-5 w-5" />
        </Button>

        <Button
          onClick={() => navigate('/attendance', { state: { serviceType: 'midweek_service' } })}
          variant="outline"
          className="w-full border-primary/20 text-primary justify-between"
        >
          <span className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            Mark Midweek Service
          </span>
          <ChevronRight className="h-5 w-5" />
        </Button>

        <Button
          onClick={() => navigate('/attendance', { state: { serviceType: 'special_program' } })}
          variant="outline"
          className="w-full border-accent/20  text-primary justify-between"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Mark Special Program
          </span>
          <ChevronRight className="h-5 w-5" />
        </Button>

        <Button
          onClick={() => navigate('/members?action=add')}
          variant="outline"
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Register New Member
          </span>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="mt-6 rounded-lg bg-primary/5 p-4">
        <p className="text-sm text-muted-foreground">Current Service</p>
        <p className="mt-1 font-semibold text-primary">{serviceType}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-NG', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>
    </motion.div>
  );
}
