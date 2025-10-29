import React from "react";
import DashboardNavbar from "./components/DashboardNavbar";
import { Metadata } from "next";
import AuthGuard from "@/app/providers/AuthGuard";
import LayoutManager from "./LayoutManager";

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
      <LayoutManager>{children}</LayoutManager>
    </AuthGuard>
  );
};

export default DashboardLayout;
