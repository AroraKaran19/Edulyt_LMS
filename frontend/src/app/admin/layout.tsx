"use client";
import React from "react";
import FlexBox from "@/components/ui/FlexBox";
import { SidebarProvider } from "./context/SidebarProvider";
import SidebarContainer from "./components/SidebarContainer";
import { usePathname } from "next/navigation";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {

  const pathname = usePathname();
  const showLayout = !pathname.startsWith("/admin/auth");

  return (
    <SidebarProvider>
      <FlexBox className="w-full h-screen">
        {showLayout && <SidebarContainer />}
        <FlexBox className="w-full h-full">{children}</FlexBox>
      </FlexBox>
    </SidebarProvider>
  );
};

export default AdminLayout;
