"use client";
import { useEffect } from "react";
import { useSidebar } from "../context/SidebarProvider";
import { cn } from "@/lib/utils";
import AdminSidebar from "./Sidebar";

const SidebarContainer = () => {
  const {
    isCollapsed,
    setIsCollapsed,
    isMobileOpen,
    closeMobileSidebar,
  } = useSidebar();

  // Close mobile sidebar on resize to desktop
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
      {/* Mobile backdrop - tap outside sidebar to close; hidden on desktop */}
      <button
        type="button"
        aria-label="Close menu"
        className={cn(
          "fixed inset-0 z-40 bg-black/15 backdrop-blur-sm transition-opacity lg:hidden",
          isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={closeMobileSidebar}
        tabIndex={isMobileOpen ? 0 : -1}
      />

      {/* Sidebar: overlay on mobile, inline on desktop */}
      <div
        className={cn(
          "flex h-full shrink-0 z-50 lg:z-10 transition-all duration-200 ease-out overflow-visible",
          // Mobile: fixed overlay, slides in from left
          "fixed lg:relative inset-y-0 left-0",
          "lg:!translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // Desktop: collapse or expand
          isCollapsed ? "w-12 lg:w-12" : "w-[280px] lg:w-1/6 min-w-[250px] lg:min-w-[250px]",
          // Mobile overlay: add shadow for depth
          isMobileOpen && "shadow-xl"
        )}
      >
        <AdminSidebar
          isCollapsed={isMobileOpen ? false : isCollapsed}
          setIsCollapsed={setIsCollapsed}
          onNavigate={closeMobileSidebar}
          isMobileOverlay={isMobileOpen}
        />
      </div>
    </>
  );
};

export default SidebarContainer;
