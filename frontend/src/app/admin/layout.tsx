"use client";
import React from "react";
import FlexBox from "@/components/ui/FlexBox";
import { SidebarProvider } from "./context/SidebarProvider";
import SidebarContainer from "./components/SidebarContainer";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <FlexBox className="w-full h-screen">
        <SidebarContainer />
        <FlexBox className="w-full h-full">{children}</FlexBox>
      </FlexBox>
    </SidebarProvider>
  );
};

export default AdminLayout;
