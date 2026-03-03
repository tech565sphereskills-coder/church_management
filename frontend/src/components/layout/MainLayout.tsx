import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSidebar } from './AppSidebar';
import { Footer } from './Footer';
import { useIsMobile } from '@/hooks/use-mobile';

export function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <AppSidebar
        isCollapsed={isMobile ? false : isCollapsed}
        onToggle={() => {
          if (isMobile) setMobileOpen(!mobileOpen);
          else setIsCollapsed(!isCollapsed);
        }}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <motion.main
        initial={false}
        animate={{
          marginLeft: isMobile ? 0 : isCollapsed ? 80 : 280,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-1 flex flex-col min-h-screen"
      >
        {/* Mobile header bar */}
        {isMobile && (
          <div className="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-background/80 backdrop-blur-md px-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-muted"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="ml-3 font-semibold text-sm">RCCG Emmanuel Sanctuary</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>

        <Footer />
      </motion.main>
    </div>
  );
}
