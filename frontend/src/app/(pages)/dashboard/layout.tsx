import React from "react";
import DashboardNavbar from "./components/DashboardNavbar";
import { Metadata } from "next";
import DashboardBanner from "./components/DashboardBanner";
import AuthGuard from "@/app/providers/AuthGuard";

export const metadata: Metadata = {
  title: "Dashboard | Airkrit",
  description: "Dashboard | Airkrit",
  keywords: ["Dashboard", "Airkrit", "Dashboard | Airkrit"],
  openGraph: {
    title: "Dashboard | Airkrit",
    description: "Dashboard | Airkrit",
    url: "https://www.airkrit.com/dashboard",
    siteName: "Airkrit",
    images: ["https://www.airkrit.com/logo.png"],
  },
  twitter: {
    title: "Dashboard | Airkrit",
    description: "Dashboard | Airkrit",
    images: ["https://www.airkrit.com/logo.png"],
    card: "summary_large_image",
  },
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthGuard>
      <DashboardNavbar />
      <div className="pt-40 w-full">
        <DashboardBanner />
        <div className="px-10 lg:px-20 min-h-screen w-full">{children}</div>
      </div>
    </AuthGuard>
  );
};

export default DashboardLayout;
