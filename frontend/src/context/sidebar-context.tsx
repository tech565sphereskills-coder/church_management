import React, { createContext, useContext, useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarContextType {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  // Reset desktop collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(false);
    }
  }, [isMobile]);

  return (
    <SidebarContext.Provider 
      value={{ 
        mobileOpen, 
        setMobileOpen, 
        isCollapsed, 
        setIsCollapsed, 
        isMobile 
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    // Provide safe defaults for components outside the provider, but warn
    return {
      mobileOpen: false,
      setMobileOpen: () => {},
      isCollapsed: false,
      setIsCollapsed: () => {},
      isMobile: false,
    };
  }
  return context;
}
