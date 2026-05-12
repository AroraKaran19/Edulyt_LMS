"use client";

import { usePathname } from "next/navigation";
import DashboardBanner from "./components/DashboardBanner";
import FreeInternshipCreditBanner from "./components/FreeInternshipCreditBanner";

function isFocusRoute(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  return (
    parts.length >= 4 &&
    parts[0] === "dashboard" &&
    parts[1] === "internships"
  );
}

const LayoutManager = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const focus = isFocusRoute(pathname);

  if (focus) {
    return (
      <div className="pt-14 min-h-screen bg-[#F9F8F6] w-full">
        <div className="px-4 lg:px-20 py-6 w-full">{children}</div>
      </div>
    );
  }

  return (
    <div className="pt-40 w-full">
      <DashboardBanner />
      <FreeInternshipCreditBanner />
      <div className="px-4 lg:px-20 min-h-screen w-full">{children}</div>
    </div>
  );
};

export default LayoutManager;
