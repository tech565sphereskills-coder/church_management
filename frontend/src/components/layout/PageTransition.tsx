import { motion } from 'framer-motion';
import { ReactNode } from 'react';

const variants = {
  initial: { opacity: 0, x: -10, y: 0 },
  enter: { opacity: 1, x: 0, y: 0 },
  exit: { opacity: 0, x: 10, y: 0 },
};

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="enter"
      exit="exit"
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="w-full flex-1"
    >
      {children}
    </motion.div>
  );
}
