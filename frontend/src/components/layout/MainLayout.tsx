import { useEffect, Suspense, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { Footer } from './Footer';
import { SidebarProvider, useSidebar } from '@/context/sidebar-context';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { TopLoadingBar } from '../common/TopLoadingBar';
import { PageTransition } from './PageTransition';
import { AnimatePresence } from 'framer-motion';

const PageLoader = () => (
  <div className="flex h-[60vh] w-full items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm font-black uppercase tracking-widest text-slate-400">Loading Sanctuary...</p>
    </div>
  </div>
);

export function MainLayout() {
  return (
    <SidebarProvider>
      <MainLayoutContent />
    </SidebarProvider>
  );
}

function MainLayoutContent() {
  const { isMobile, isCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const location = useLocation();
  const lastPathname = useRef(location.pathname);

  // Close mobile sidebar ONLY on navigation
  useEffect(() => {
    if (lastPathname.current !== location.pathname) {
      if (mobileOpen) {
        setMobileOpen(false);
      }
      lastPathname.current = location.pathname;
    }
  }, [location.pathname, mobileOpen, setMobileOpen]);

  return (
    <div className="flex min-h-screen w-full bg-background overflow-x-hidden pt-0 md:pt-0">
      <TopLoadingBar />
      <AppSidebar />

        <main
          className={cn(
            "flex-1 flex flex-col min-h-screen relative w-full",
            // CSS-First Responsive Margins: NO JS variables for base visibility
            "ml-0",
            // Only apply desktop margins if screen >= lg (1024px)
            isCollapsed ? "lg:ml-[80px]" : "lg:ml-[280px]"
          )}
        >
          <div className="flex-1 flex flex-col w-full relative z-0 overflow-x-hidden">
            <Suspense fallback={<PageLoader />}>
              <AnimatePresence mode="wait">
                <PageTransition key={location.pathname}>
                  <Outlet context={{ setMobileOpen }} />
                </PageTransition>
              </AnimatePresence>
            </Suspense>
          </div>
          <Footer />
        </main>
    </div>
  );
}
