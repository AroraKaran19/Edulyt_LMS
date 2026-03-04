"use client";
import React from "react";
import { SidebarProvider } from "./context/SidebarProvider";
import SidebarContainer from "./components/SidebarContainer";
import AdminTopHeader from "@/components/admin/AdminTopHeader";
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
    <AuthGuard requiredUserType={["admin"]} fallbackPath="/login">
      <SidebarProvider>
        <div className="flex w-full min-h-screen lg:h-screen">
          {showLayout && <SidebarContainer />}
          <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
            {showLayout && (
              <header className="shrink-0 border-b border-gray-200">
                <AdminTopHeader />
              </header>
            )}
            <div className="flex-1 overflow-auto">{children}</div>
          </div>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
};

export default AdminLayout;
