"use client";
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Settings,
  ShoppingCart,
  Tag,
  Users,
} from "lucide-react";
import ImageComponent from "@/components/ui/ImageComponent";
import React from "react";
import SidebarMenuItem from "./SidebarMenuItem";
import { cn } from "@/lib/utils";
import useAuth from "@/hooks/useAuth";

interface MenuItem {
  icon?: React.ReactNode;
  iconSrc?: string;
  label: string;
  href: string;
  submenu?: MenuItem[];
}

interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onNavigate?: () => void;
  isMobileOverlay?: boolean;
}

const AdminSidebar = ({
  isCollapsed,
  setIsCollapsed,
  onNavigate,
  isMobileOverlay = false,
}: AdminSidebarProps) => {
  const { handleSignOut } = useAuth();
  const menuItems: MenuItem[] = [
    {
      iconSrc: "/admin/dashboard-icon.svg",
      label: "Dashboard",
      href: "/admin",
    },
    {
      iconSrc: "/admin/courses-icon.svg",
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
        {
          label: "Enrollments",
          href: "/admin/courses/enrollments",
        },
        {
          label: "Live Classes",
          href: "/admin/courses/live-classes",
        },
        {
          label: "Moderation",
          href: "/admin/courses/moderation",
        },
      ],
    },
    {
      icon: <HelpCircle className="size-6" />,
      label: "FAQs",
      href: "/admin/faq",
    },
    {
      icon: <Users className="size-6" />,
      label: "Testimonials",
      href: "/admin/testimonials",
    },
    {
      icon: <ShoppingCart className="size-6" />,
      label: "Orders",
      href: "/admin/orders",
    },
    {
      iconSrc: "/admin/internship.svg",
      label: "Internships",
      href: "/admin/internships",
      submenu: [
        {
          label: "Analytics",
          href: "/admin/internships/analytics",
        },
        {
          label: "Manage Internships",
          href: "/admin/internships/manage-internships",
        },
        {
          label: "Enrollments",
          href: "/admin/internships/enrollments",
        },
        {
          label: "Entrance exams",
          href: "/admin/internships/entrance-exams",
        },
        {
          label: "Certification exams",
          href: "/admin/internships/certification-exams",
        },
        {
          label: "Question bank",
          href: "/admin/internships/questions",
        },
        {
          label: "Exam templates",
          href: "/admin/internships/exams",
        },
        {
          label: "Task templates",
          href: "/admin/internships/tasks",
        },
      ],
    },
    {
      iconSrc: "/admin/all-users-icon.svg",
      label: "All Users",
      href: "/admin/users",
      submenu: [
        {
          label: "Manage Users",
          href: "/admin/users/manage-users",
        },
        {
          label: "Create Instructor",
          href: "/admin/users/create-instructor",
        },
      ],
    },
    {
      icon: <Tag className="size-6" />,
      label: "Coupons",
      href: "/admin/coupons",
    },
    {
      icon: <Settings className="size-6" />,
      label: "Settings",
      href: "/admin/settings",
      submenu: [
        {
          label: "Authentication Media",
          href: "/admin/settings/authentication-media",
        },
        {
          label: "Points (INR)",
          href: "/admin/settings/points",
        },
        {
          label: "Home Page",
          href: "/admin/settings/home-page",
        },
        {
          label: "Colleges List",
          href: "/admin/settings/colleges",
        },
        {
          label: "Certificate Jobs",
          href: "/admin/settings/certificate-jobs",
        },
        {
          label: "Collaboration Jobs",
          href: "/admin/settings/collaboration-jobs",
        },
        {
          label: "Collaboration Domains",
          href: "/admin/settings/collaboration-domains",
        },
        {
          label: "Partnerships",
          href: "/admin/settings/partnership-import",
        },
      ],
    },
  ];

  return (
    <div
      className={cn(
        "flex admin-sidebar h-full bg-orange-50 transition-[width] duration-200 ease-out relative overflow-visible",
        isCollapsed ? "w-12 py-4" : "w-full py-10 flex-col gap-4",
      )}
    >
      {/* Collapse/Expand Button - on mobile when overlay open; always on desktop */}
      <button
        onClick={() =>
          isMobileOverlay ? onNavigate?.() : setIsCollapsed(!isCollapsed)
        }
        className={cn(
          "absolute -right-3 top-8 z-100 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-1.5 shadow-lg transition-colors duration-150 shrink-0 items-center justify-center cursor-pointer",
          isMobileOverlay ? "flex" : "hidden lg:flex",
        )}
        aria-label={
          isMobileOverlay
            ? "Close menu"
            : isCollapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
        }
      >
        {isCollapsed ? (
          <ChevronRight className="size-4" />
        ) : (
          <ChevronLeft className="size-4" />
        )}
      </button>

      {!isCollapsed && (
        <div className="flex flex-col h-full min-h-0">
          {/* Fixed header - logo */}
          <ImageComponent
            src="/logo.svg"
            alt="logo"
            width={170}
            height={50}
            className="object-contain aspect-video h-[70px] select-none mx-auto"
            loading="eager"
            draggable={false}
            unoptimized
          />

          {/* Scrollable menu */}
          <div
            className="flex flex-col flex-1 min-h-0 overflow-y-auto px-8"
            style={{ scrollbarWidth: "thin" }}
          >
            <div className="flex admin-sidebar-menu w-full flex-col gap-4">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                MENU
              </h2>
              <div className="flex admin-sidebar-menu-items w-full flex-col gap-4">
                {menuItems.map((item, index) => (
                  <SidebarMenuItem
                    key={index}
                    menuItem={item}
                    isCollapsed={isCollapsed}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Fixed footer - Sign Out & Help & Support */}
          <div className="flex flex-col shrink-0 gap-4 px-8 py-4 border-t border-gray-200/50">
            <div
              className="flex gap-2 items-center cursor-pointer"
              onClick={() => {
                onNavigate?.();
                handleSignOut();
              }}
            >
              <ImageComponent
                src="/admin/logout-icon.svg"
                alt="logout"
                width={20}
                height={20}
              />
              <span className="text-base text-[#00000099] font-medium">
                Sign Out
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSidebar;
