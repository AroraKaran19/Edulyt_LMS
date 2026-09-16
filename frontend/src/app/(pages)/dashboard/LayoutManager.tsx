"use client";

import DashboardBanner from "./components/DashboardBanner";

const LayoutManager = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="pt-40 w-full">
      <DashboardBanner />
      <div className="px-4 lg:px-20 min-h-screen w-full">{children}</div>
    </div>
  );
};

export default LayoutManager;
