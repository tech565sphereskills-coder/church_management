import { motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const verses = [
  { text: "Let us not neglect our meeting together, as some people do.", ref: "Hebrews 10:25" },
  { text: "For where two or three gather in my name, there am I with them.", ref: "Matthew 18:20" },
  { text: "Iron sharpens iron, and one man sharpens another.", ref: "Proverbs 27:17" },
  { text: "How good and pleasant it is when God's people live together in unity!", ref: "Psalm 133:1" },
  { text: "And let us consider how we may spur one another on toward love and good deeds.", ref: "Hebrews 10:24" },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function WelcomeCard() {
  const { user } = useAuth();
  const today = new Date();
  const dayIndex = today.getDate() % verses.length;
  const verse = verses[dayIndex];
  const name = user?.email?.split('@')[0] || 'Admin';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[hsl(var(--rccg-blue-dark))] p-6 text-primary-foreground mb-6"
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2 text-primary-foreground text-xs md:text-sm font-medium mb-1 opacity-90">
          <CalendarDays className="h-4 w-4" />
          {today.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <h2 className="text-2xl font-bold mb-3">
          {getGreeting()}, {name} 👋
        </h2>
        <blockquote className="border-l-2 border-primary-foreground/40 pl-4 italic text-primary-foreground text-sm md:text-base">
          "{verse.text}"
          <footer className="mt-1 not-italic font-semibold text-primary-foreground/80">— {verse.ref}</footer>
        </blockquote>
      </div>
      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary-foreground/5" />
      <div className="absolute -right-4 bottom-0 h-24 w-24 rounded-full bg-primary-foreground/5" />
    </motion.div>
  );
}
