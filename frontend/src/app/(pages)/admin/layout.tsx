"use client";
import React, { useState } from "react";
import AdminSidebar from "./components/Sidebar";
import FlexBox from "@/components/ui/FlexBox";
import { cn } from "@/lib/utils";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <FlexBox className="w-full h-screen">
      <FlexBox
        className={cn(
          "h-full shrink-0 z-10 lg:z-0 transition-all duration-300",
          isCollapsed
            ? "w-12 lg:w-12"
            : "w-1/6 absolute lg:relative min-w-[250px] lg:w-1/6 lg:min-w-[250px]",
          !isCollapsed && "-translate-x-full lg:translate-x-0"
        )}
      >
        <AdminSidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
      </FlexBox>
      <FlexBox className="w-full h-full">{children}</FlexBox>
    </FlexBox>
  );
};

export default AdminLayout;
