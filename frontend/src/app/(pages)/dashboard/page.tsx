import { redirect } from "next/navigation";
import React from "react";
import DashboardPage from "./DashboardPage";

export const generateMetadata = () => {
  return {
    title: "Dashboard | Airkrit",
    description: "Dashboard | Airkrit",
    keywords: ["Dashboard", "Airkrit", "Dashboard | Airkrit"],
  };
};

const UserDashboard = () => {
  const session = true;

  if (!session) {
    console.error("No session found");
    redirect("/auth/login");
  }

  return <DashboardPage />;
};

export default UserDashboard;
