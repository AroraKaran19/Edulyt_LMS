import React from "react";
import DashboardPage from "./DashboardPage";

export const generateMetadata = () => {
  return {
    title: "Dashboard | Airkrit",
    description: "Dashboard | Airkrit",
    keywords: ["Dashboard", "Airkrit", "Dashboard | Airkrit"],
  };
};

const UserDashboard = async () => {
  return <DashboardPage />;
};

export default UserDashboard;
