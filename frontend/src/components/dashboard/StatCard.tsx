import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'accent';
  delay?: number;
}

function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString());
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.2,
      delay,
      ease: 'easeOut',
    });
    return controls.stop;
  }, [value, delay, count]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  variant = 'default',
  delay = 0,
}: StatCardProps) {
  const isPositive = change && change > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        'relative overflow-hidden p-6 rounded-2xl border transition-all duration-300',
        variant === 'default' && 'bg-card border-border shadow-sm hover:shadow-md',
        variant === 'primary' && 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-indigo-500 shadow-lg shadow-indigo-200',
        variant === 'accent' && 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-100'
      )}
    >
      <div className={cn(
        "absolute -right-4 -top-4 transition-transform group-hover:scale-110 opacity-10",
        variant === 'default' && 'text-slate-900',
        variant !== 'default' && 'text-white'
      )}>
        <Icon size={120} strokeWidth={1} />
      </div>
      
      <div className="relative z-10 flex flex-col h-full">
        <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl mb-4 shadow-sm",
            variant === 'default' && 'bg-slate-50 text-slate-600 border border-slate-100',
            variant === 'primary' && 'bg-white/10 text-white border border-white/20 backdrop-blur-sm',
            variant === 'accent' && 'bg-white/10 text-white border border-white/20 backdrop-blur-sm'
        )}>
            <Icon size={20} />
        </div>
        <p
          className={cn(
            'text-xs font-bold uppercase tracking-widest',
            variant === 'default' ? 'text-slate-400' : 'text-white/70'
          )}
        >
          {title}
        </p>
        
        <p className={cn(
          "mt-1 text-3xl font-black tracking-tight",
          variant === 'default' ? 'text-slate-900' : 'text-white'
        )}>
          {typeof value === 'number' ? (
            <AnimatedNumber value={value} delay={delay + 0.1} />
          ) : (
            value
          )}
        </p>
        
        {change !== undefined && (
          <p
            className={cn(
              'mt-1 flex items-center text-[10px] font-black uppercase tracking-wider',
              variant === 'default' ? (isPositive ? 'text-emerald-500' : 'text-rose-500') : 'text-white/90'
            )}
          >
            <span>
              {isPositive ? '↑' : '↓'}
              {change}%
            </span>
            {changeLabel && (
              <span className="ml-1.5 opacity-60">{changeLabel}</span>
            )}
          </p>
        )}
      </div>
    </motion.div>
  );
}
