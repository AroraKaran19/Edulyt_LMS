"use client";
import FlexBox from "@/components/ui/FlexBox";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import React from "react";
import SidebarMenuItem from "./SidebarMenuItem";
import { cn } from "@/lib/utils";

interface MenuItem {
  icon?: React.ComponentType<{ className?: string }>;
  iconSrc?: string;
  label: string;
  href: string;
  submenu?: MenuItem[];
}

interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const AdminSidebar = ({ isCollapsed, setIsCollapsed }: AdminSidebarProps) => {

  const menuItems: MenuItem[] = [
    {
      iconSrc: "/dashboard-icon.svg",
      label: "Dashboard",
      href: "/admin",
    },
    {
      iconSrc: "/courses-icon.svg",
      label: "Courses",
      href: "/admin/courses",
      submenu: [
        {
          label: "Analytics",
          href: "/admin/courses/analytics",
        },
        {
          label: "Manage Courses",
          href: "/admin/courses/manage-courses",
        },
      ],
    },
    {
      iconSrc: "/Internship.svg",
      label: "Internships",
      href: "/admin/internships",
      submenu: [
        {
          label: "Analytics",
          href: "/admin/internships/analytics",
        },
        {
          label: "All Internships",
          href: "/admin/internships/all-internships",
        },
        {
          label: "Manage Internships",
          href: "/admin/internships/manage-internships",
        },
      ],
    },
    {
      iconSrc: "/all-users-icon.svg",
      label: "All Users",
      href: "/admin/users",
      submenu: [
        {
          label: "All Users",
          href: "/admin/users/all-users",
        },
        {
          label: "Manage Users",
          href: "/admin/users/manage-users",
        },
      ],
    },
  ];

  return (
    <FlexBox className={cn(
      "admin-sidebar h-full bg-orange-500/10 transition-all duration-300 relative",
      isCollapsed ? "w-12 py-4" : "w-full py-10 flex-col gap-4"
    )}>
      {/* Collapse/Expand Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 z-[9999] bg-orange-500 hover:bg-orange-600 text-white rounded-full p-1.5 shadow-lg transition-all duration-300"
      >
        {isCollapsed ? (
          <ChevronRight className="size-4" />
        ) : (
          <ChevronLeft className="size-4" />
        )}
      </button>

      {!isCollapsed && (
        <>
          <FlexBox className="admin-sidebar-header w-full justify-center">
            <Image
              src="/logo.svg"
              alt="logo"
              width={170}
              height={50}
              className="object-contain aspect-video select-none"
              priority
              quality={100}
              unoptimized
              loading="eager"
              draggable={false}
            />
          </FlexBox>

          <FlexBox className="admin-sidebar-menu w-full flex-col gap-4 px-8">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              MENU
            </h2>
            <FlexBox className="admin-sidebar-menu-items w-full flex-col gap-4">
              {menuItems.map((item, index) => (
                <SidebarMenuItem key={index} menuItem={item} isCollapsed={isCollapsed} />
              ))}
            </FlexBox>
          </FlexBox>

          <FlexBox className="admin-sidebar-footer w-full mt-auto px-8">
            <div className="flex gap-2 items-center cursor-pointer">
              <Image src="/logout-icon.svg" alt="logout" width={20} height={20} />
              <span className="text-base text-[#00000099] font-medium">Sign Out</span>
            </div>
          </FlexBox>

          <FlexBox className="admin-sidebar-footer w-full px-8 mt-2">
            <div className="flex gap-2 items-center cursor-pointer">
              <Image src="/help-support-icon.svg" alt="logout" width={20} height={20} />
              <span className="text-base text-[#00000099] font-medium">Help & Support</span>
            </div>
          </FlexBox>

        </>
      )}
    </FlexBox>
  );
};

export default AdminSidebar;
