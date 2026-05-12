import React from "react";
import DashboardNavbar from "./components/DashboardNavbar";
import { Metadata } from "next";
import AuthGuard from "@/app/providers/AuthGuard";
import LayoutManager from "./LayoutManager";

export const metadata: Metadata = {
  title: "Dashboard | Airkrit India",
  description: "Dashboard | Airkrit India",
  keywords: ["Dashboard", "Airkrit India", "Dashboard | Airkrit India"],
  openGraph: {
    title: "Dashboard | Airkrit India",
    description: "Dashboard | Airkrit India",
    url: "https://www.airkrit.com/dashboard",
    siteName: "Airkrit India",
    images: [
      {
        url: "https://www.airkrit.com/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    title: "Dashboard | Airkrit India",
    description: "Dashboard | Airkrit India",
    images: [
      {
        url: "https://www.airkrit.com/logo.png",
        width: 1200,
        height: 630,
      },
    ],
    card: "summary_large_image",
  },
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthGuard requiredUserType={["student"]} wrongRoleShowsNotFound>
      <DashboardNavbar />
      <LayoutManager>{children}</LayoutManager>
    </AuthGuard>
  );
};

export default DashboardLayout;
