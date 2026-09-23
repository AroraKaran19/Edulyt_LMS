"use client";
import {
  ChevronLeft,
  ChevronRight,
  FileBarChart,
  GraduationCap,
  HelpCircle,
  KeyRound,
  Megaphone,
  MessageSquare,
  Settings,
  ShoppingCart,
  Target,
  Tag,
  UserPlus,
  Users,
} from "lucide-react";
import ImageComponent from "@/components/ui/ImageComponent";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import SidebarMenuItem, { matchesHref } from "./SidebarMenuItem";
import { cn } from "@/lib/utils";
import useAuth from "@/hooks/useAuth";
import {
  canAccessPageAsRole,
  resolvePageKeyFromPath,
} from "@/config/adminPermissions";
import Link from "next/link";

interface MenuItem {
  icon?: React.ReactNode;
  iconSrc?: string;
  label: string;
  href: string;
  submenu?: MenuItem[];
}

/**
 * Admin pages intentionally absent from `ADMIN_PERMISSION_CATALOG`, because the
 * endpoints behind them are super-admin-only. Cataloguing them would let a
 * super-admin grant an admin a page whose every request returns 403.
 * `RequirePageAccess` gates the same paths server-side of the router.
 */
const SUPER_ADMIN_ONLY_HREFS = new Set([
  "/admin/users/create-marketer",
  "/admin/users/create-sales",
]);

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
  const { user, handleSignOut } = useAuth();
  const pathname = usePathname();
  /**
   * Which group is open, and the route it was opened on. Held here rather than
   * per item so opening one closes the rest; a click only overrides the
   * route-derived default while the reader stays on that route.
   */
  const [opened, setOpened] = useState<{ path: string; href: string | null }>({
    path: "",
    href: null,
  });
  const isSuperAdmin = user?.userType === "super-admin";
  const permissions = user?.permissions ?? [];

  const canSeeHref = (href: string): boolean => {
    // Pages kept out of the permission catalog on purpose, because the API
    // behind them is super-admin-only and so must never be grantable.
    if (SUPER_ADMIN_ONLY_HREFS.has(href)) return isSuperAdmin;

    const key = resolvePageKeyFromPath(href);
    // Role-aware: a marketer has an empty permissions array, so the
    // permission-only check would leave it with a completely blank sidebar.
    return key ? canAccessPageAsRole(user?.userType, permissions, key) : false;
  };

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
          label: "Course Internships",
          href: "/admin/courses/course-internships/manage",
        },
        {
          label: "Moderation",
          href: "/admin/courses/moderation",
        },
      ],
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
          label: "Doc Review",
          href: "/admin/internships/doc-review",
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
        {
          label: "Live meetings",
          href: "/admin/internships/live-meetings",
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
          label: "Referral Withdrawals",
          href: "/admin/users/referral-withdrawals",
        },
        {
          label: "Create Instructor",
          href: "/admin/users/create-instructor",
        },
        ...(isSuperAdmin
          ? [
              {
                label: "Create Marketer",
                href: "/admin/users/create-marketer",
              },
              {
                label: "Create Sales",
                href: "/admin/users/create-sales",
              },
            ]
          : []),
      ],
    },
    {
      icon: <MessageSquare className="size-6" />,
      label: "Community",
      href: "/admin/community/moderation",
      submenu: [
        {
          label: "Moderation",
          href: "/admin/community/moderation",
        },
      ],
    },
    {
      icon: <Target className="size-6" />,
      label: "CRM",
      href: "/admin/crm/analytics",
      submenu: [
        {
          label: "Analytics",
          href: "/admin/crm/analytics",
        },
        {
          label: "Team",
          href: "/admin/crm/team",
        },
        {
          label: "All leads",
          href: "/admin/leads",
        },
        {
          label: "CA leads",
          href: "/admin/crm/ca-leads",
        },
        {
          label: "CA tasks",
          href: "/admin/crm/ca-tasks",
        },
        {
          label: "CA meetings",
          href: "/admin/crm/ca-meetings",
        },
        {
          label: "CA reviews",
          href: "/admin/crm/ca-reviews",
        },
        {
          label: "My leads",
          href: "/admin/crm/my-leads",
        },
        {
          label: "My team",
          href: "/admin/crm/my-team",
        },
        {
          label: "My performance",
          href: "/admin/crm/performance",
        },
      ],
    },
    {
      icon: <UserPlus className="size-6" />,
      label: "Enquiry Page",
      href: "/admin/enquiry-page",
    },
    {
      icon: <Megaphone className="size-6" />,
      label: "CA Page",
      href: "/admin/ca-page",
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
      icon: <Tag className="size-6" />,
      label: "Coupons",
      href: "/admin/coupons",
    },
    {
      icon: <GraduationCap className="size-6" />,
      label: "Scholarship",
      href: "/admin/scholarship/campaigns",
    },
    {
      icon: <FileBarChart className="size-6" />,
      label: "Reports",
      href: "/admin/reports/success-points",
      submenu: [
        {
          label: "Success Points",
          href: "/admin/reports/success-points",
        },
        {
          label: "Referrals",
          href: "/admin/reports/referrals",
        },
      ],
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
          label: "Terms & Conditions",
          href: "/admin/settings/terms-and-conditions",
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
          label: "Invoice Jobs",
          href: "/admin/settings/invoice-jobs",
        },
        {
          label: "Offer Letter Jobs",
          href: "/admin/settings/offer-letter-jobs",
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
        {
          label: "Announcements",
          href: "/admin/settings/announcements",
        },
        {
          label: "Referral Commission Tiers",
          href: "/admin/settings/referral-commission-tiers",
        },
        {
          label: "Lead Pipeline",
          href: "/admin/settings/lead-pipeline",
        },
      ],
    },
  ];

  // Filter the menu to what the viewer may see. Sections keep only their
  // accessible submenu items and disappear entirely when none remain.
  const visibleMenuItems: MenuItem[] = menuItems
    .map((item) => {
      if (item.submenu && item.submenu.length > 0) {
        const submenu = item.submenu.filter((s) => canSeeHref(s.href));
        if (submenu.length === 0) return null;
        // A group links to its first VISIBLE child, never a hardcoded one.
        // Otherwise a marketer clicking "CRM" is sent to Analytics, which they
        // have no permission for, and lands on a 404 instead of the section
        // they can actually use.
        return { ...item, submenu, href: submenu[0].href };
      }
      return canSeeHref(item.href) ? item : null;
    })
    .filter((item): item is MenuItem => item !== null);

  const activeHref =
    visibleMenuItems.find(
      (item) =>
        matchesHref(item.href, pathname) ||
        item.submenu?.some((sub) => matchesHref(sub.href, pathname)),
    )?.href ?? null;

  // A click wins only while the reader stays on the route they clicked from,
  // so navigating away re-opens whichever group owns the new route.
  const openHref = opened.path === pathname ? opened.href : activeHref;

  const toggleGroup = (href: string) =>
    setOpened({ path: pathname, href: openHref === href ? null : href });

  // Super-admin-only entry point to admin/permission management. Placed right
  // after Dashboard so it's visible without scrolling the menu.
  if (isSuperAdmin) {
    const adminAccessItem: MenuItem = {
      icon: <KeyRound className="size-6" />,
      label: "Admin Access",
      href: "/admin/access",
    };
    const dashboardIndex = visibleMenuItems.findIndex(
      (item) => item.href === "/admin",
    );
    visibleMenuItems.splice(
      dashboardIndex >= 0 ? dashboardIndex + 1 : 0,
      0,
      adminAccessItem,
    );
  }

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
          <Link href="/" draggable={false}>
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
          </Link>

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
                {visibleMenuItems.map((item, index) => (
                  <SidebarMenuItem
                    key={index}
                    menuItem={item}
                    isCollapsed={isCollapsed}
                    onNavigate={onNavigate}
                    isOpen={openHref === item.href}
                    onToggle={toggleGroup}
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
