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
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        'stat-card',
        variant === 'primary' && 'bg-primary text-primary-foreground',
        variant === 'accent' && 'bg-accent text-accent-foreground'
      )}
    >
      <Icon
        className={cn(
          'stat-card-icon',
          variant === 'default' && 'text-primary/10',
          variant === 'primary' && 'text-primary-foreground/20',
          variant === 'accent' && 'text-accent-foreground/20'
        )}
      />
      
      <div className="relative z-10">
        <p
          className={cn(
            'text-sm font-medium',
            variant === 'default' && 'text-slate-600 dark:text-white font-semibold',
            variant === 'primary' && 'text-primary-foreground',
            variant === 'accent' && 'text-accent-foreground'
          )}
        >
          {title}
        </p>
        
        <p className={cn(
          "mt-2 text-3xl font-bold tracking-tight",
          "dark:text-white"
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
              'mt-2 flex items-center text-sm',
              variant === 'default' &&
                (isPositive ? 'text-success' : 'text-destructive'),
              variant !== 'default' && 'text-current opacity-80'
            )}
          >
            <span className="font-medium">
              {isPositive ? '+' : ''}
              {change}%
            </span>
            {changeLabel && (
              <span className="ml-1 opacity-70">{changeLabel}</span>
            )}
          </p>
        )}
      </div>
    </motion.div>
  );
}
