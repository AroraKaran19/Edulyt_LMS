"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type PartnerSidebarContextType = {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isMobileOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
};

const PartnerSidebarContext = createContext<PartnerSidebarContextType | null>(
  null
);

export function PartnerSidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const openMobileSidebar = useCallback(() => setIsMobileOpen(true), []);
  const closeMobileSidebar = useCallback(() => setIsMobileOpen(false), []);
  const toggleMobileSidebar = useCallback(
    () => setIsMobileOpen((prev) => !prev),
    []
  );

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  return (
    <PartnerSidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        isMobileOpen,
        openMobileSidebar,
        closeMobileSidebar,
        toggleMobileSidebar,
      }}
    >
      {children}
    </PartnerSidebarContext.Provider>
  );
}

export function usePartnerSidebar() {
  const ctx = useContext(PartnerSidebarContext);
  if (!ctx) {
    throw new Error(
      "usePartnerSidebar must be used within a PartnerSidebarProvider"
    );
  }
  return ctx;
}
