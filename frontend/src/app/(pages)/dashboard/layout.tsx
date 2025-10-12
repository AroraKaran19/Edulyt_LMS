import React, { Suspense } from "react";
import DashboardNavbar from "./components/DashboardNavbar";
import AuthGuard from "@/components/shared/AuthGuard";
import { FullScreenLoader } from "@/components/ui";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Airkrit",
  description: "Dashboard | Airkrit",
  keywords: ["Dashboard", "Airkrit", "Dashboard | Airkrit"],
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense
      fallback={
        <FullScreenLoader
          text="Loading dashboard..."
          variant="spinner"
          size="lg"
        />
      }
    >
      <AuthGuard>
        <DashboardNavbar />
        <div className="pt-96 lg:pt-76 min-h-screen w-full">{children}</div>
      </AuthGuard>
    </Suspense>
  );
};

export default DashboardLayout;
