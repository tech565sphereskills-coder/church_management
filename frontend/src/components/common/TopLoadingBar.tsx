import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { loadingEvents } from '@/lib/utils';

export function TopLoadingBar() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return loadingEvents.subscribe(setLoading);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 0.7, opacity: 1 }}
          exit={{ scaleX: 1, opacity: 0 }}
          transition={{ 
            scaleX: { duration: 1.5, ease: "easeOut" },
            opacity: { duration: 0.3 }
          }}
          className="fixed top-0 left-0 right-0 h-1 bg-primary z-[9999] origin-left"
          style={{ boxShadow: '0 0 10px rgba(var(--primary), 0.5)' }}
        />
      )}
    </AnimatePresence>
  );
}
