"use client";

import { useEffect } from "react";
import PartnerSidebar from "./PartnerSidebar";
import { cn } from "@/lib/utils";
import { usePartnerSidebar } from "../state/PartnerSidebarProvider";

export default function PartnerSidebarContainer() {
  const { isCollapsed, setIsCollapsed, isMobileOpen, closeMobileSidebar } =
    usePartnerSidebar();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        closeMobileSidebar();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [closeMobileSidebar]);

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        className={cn(
          "fixed inset-0 z-40 cursor-pointer bg-black/15 backdrop-blur-sm transition-opacity duration-300 ease-in-out lg:hidden",
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={closeMobileSidebar}
        tabIndex={isMobileOpen ? 0 : -1}
      />

      <div
        className={cn(
          "flex shrink-0 self-stretch overflow-hidden",
          "z-50 lg:z-10",
          "h-dvh max-h-dvh min-h-0 lg:h-full lg:max-h-none",
          "fixed inset-y-0 left-0 lg:relative",
          "lg:translate-x-0!",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "w-[52px] lg:w-[52px]" : "w-[280px] lg:w-[280px]",
          "max-lg:transition-transform max-lg:duration-300 max-lg:ease-in-out",
          "lg:transition-[width] lg:duration-300 lg:ease-in-out",
          isMobileOpen && "shadow-xl",
        )}
      >
        <PartnerSidebar
          isCollapsed={isMobileOpen ? false : isCollapsed}
          setIsCollapsed={setIsCollapsed}
          onNavigate={closeMobileSidebar}
          isMobileOverlay={isMobileOpen}
          onCloseMobile={closeMobileSidebar}
        />
      </div>
    </>
  );
}
