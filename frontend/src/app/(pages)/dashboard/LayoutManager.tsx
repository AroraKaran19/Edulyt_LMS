"use client";

import { usePathname } from "next/navigation";
import DashboardBanner from "./components/DashboardBanner";
import { cn } from "@/lib/utils";

const LayoutManager = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  return (
    <div
      className={cn(
        "pt-40 w-full",
        pathname === "/dashboard/profile" && "pt-0"
      )}
    >
      {pathname !== "/dashboard/profile" && <DashboardBanner />}
      <div
        className={cn(
          "px-10 lg:px-20 min-h-screen w-full",
          pathname === "/dashboard/profile" && "px-0!"
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default LayoutManager;
