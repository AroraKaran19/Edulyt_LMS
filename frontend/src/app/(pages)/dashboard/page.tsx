import React from "react";
import DashboardPage from "./DashboardPage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export const generateMetadata = () => {
  return {
    title: "Dashboard | Airkrit",
    description: "Dashboard | Airkrit",
    keywords: ["Dashboard", "Airkrit", "Dashboard | Airkrit"],
  };
};

const UserDashboard = async () => {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return <DashboardPage />;
};

export default UserDashboard;
