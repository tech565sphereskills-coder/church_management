import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const RCCG_LOGO_URL = 'https://res.cloudinary.com/dnglp9qfd/image/upload/v1770460225/Rccg_logo_ttgxko.png';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500); // Small delay after 100%
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white"
    >
      <div className="relative flex flex-col items-center">
        {/* Divine Glow Effect */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl"
        />

        {/* Logo Animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 1.2,
            ease: [0, 0.71, 0.2, 1.01],
            scale: {
              type: "spring",
              damping: 12,
              stiffness: 100,
              restDelta: 0.001
            }
          }}
          className="relative h-32 w-32 md:h-40 md:w-40"
        >
          <img
            src={RCCG_LOGO_URL}
            alt="RCCG Logo"
            className="h-full w-full object-contain"
          />
        </motion.div>

        {/* Text Animation */}
        <div className="mt-8 flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-2xl font-black tracking-[0.2em] text-slate-900 uppercase"
          >
            RCCG
          </motion.h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-1 h-0.5 bg-indigo-600/20"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="mt-2 text-[10px] font-bold tracking-[0.4em] text-slate-400 uppercase"
          >
            Emmanuel Sanctuary
          </motion.p>
        </div>

        {/* Progress Bar */}
        <div className="mt-16 w-48 overflow-hidden rounded-full bg-slate-100 h-1">
          <motion.div
            className="h-full bg-indigo-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
          />
        </div>
        
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: progress > 10 ? 1 : 0 }}
          className="mt-3 text-[8px] font-black text-slate-300 uppercase tracking-widest"
        >
          Initializing Sanctuary {progress}%
        </motion.span>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="text-[9px] font-bold text-slate-300 uppercase tracking-widest"
        >
          Management with Divine Precision
        </motion.p>
      </div>
    </motion.div>
  );
}
