"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { PartnerSidebarProvider } from "./state/PartnerSidebarProvider";
import { PartnerAccessProvider } from "./state/PartnerAccessProvider";
import PartnerSidebarContainer from "./components/PartnerSidebarContainer";
import PartnerTopHeader from "./components/PartnerTopHeader";
import AuthGuard from "@/app/providers/AuthGuard";
import { cn } from "@/lib/utils";

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/partner" || pathname.startsWith("/partner/login");

  if (isAuthPage) return children;

  return (
    <AuthGuard requiredUserType={["partner"]} fallbackPath="/partner/login">
      <PartnerAccessProvider>
        <PartnerSidebarProvider>
          <div
            className={cn(
              "flex w-full min-h-0 flex-1 bg-[#FFF7F2]",
              "h-full max-h-full overflow-hidden",
            )}
          >
            <PartnerSidebarContainer />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <header className="shrink-0">
                <PartnerTopHeader />
              </header>
              <div className="flex-1 overflow-auto">{children}</div>
            </div>
          </div>
        </PartnerSidebarProvider>
      </PartnerAccessProvider>
    </AuthGuard>
  );
}
