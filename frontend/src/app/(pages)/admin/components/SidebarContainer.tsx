"use client";
import React from "react";
import { useSidebar } from "../context/SidebarProvider";
import FlexBox from "@/components/ui/FlexBox";
import { cn } from "@/lib/utils";
import AdminSidebar from "./Sidebar";

const SidebarContainer = () => {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  return (
    <FlexBox
      className={cn(
        "h-full shrink-0 z-10 lg:z-0 transition-all duration-300",
        isCollapsed
          ? "w-12 lg:w-12"
          : "w-1/6 absolute lg:relative min-w-[250px] lg:w-1/6 lg:min-w-[250px]",
        !isCollapsed && "-translate-x-full lg:translate-x-0"
      )}
    >
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
    </FlexBox>
  );
};

export default SidebarContainer;
