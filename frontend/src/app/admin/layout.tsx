"use client";
import React from "react";
import { SidebarProvider } from "./context/SidebarProvider";
import SidebarContainer from "./components/SidebarContainer";
import { usePathname } from "next/navigation";
import AuthGuard from "@/app/providers/AuthGuard";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const showLayout = !pathname.startsWith("/admin/auth");

  // Don't protect auth pages
  if (pathname.startsWith("/admin/auth")) {
    return children;
  }

  return (
    <AuthGuard requiredUserType={["admin"]} fallbackPath="/admin/auth/login">
      <SidebarProvider>
        <div className="flex w-full h-screen">
          {showLayout && <SidebarContainer />}
          <div className="flex w-full h-full overflow-auto">{children}</div>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
};

export default AdminLayout;
