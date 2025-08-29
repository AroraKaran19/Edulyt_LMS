"use client";
import FlexBox from "@/components/ui/FlexBox";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import Image from "next/image";

interface MenuItem {
  icon?: React.ComponentType<{ className?: string }>;
  iconSrc?: string;
  label: string;
  href: string;
  submenu?: MenuItem[];
}

const SidebarMenuItem = ({
  menuItem,
  isCollapsed,
}: {
  menuItem: MenuItem;
  isCollapsed?: boolean;
}) => {
  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  // Auto-open submenu if current route is a child route or matches any submenu item
  useEffect(() => {
    const newOpenSubmenus: Record<string, boolean> = {};
    if (menuItem.submenu) {
      const hasActiveSubmenuItem = menuItem.submenu.some(
        (submenu: MenuItem) => submenu.href === pathname
      );
      const isChildRoute =
        pathname.startsWith(menuItem.href + "/") && menuItem.href !== "/admin";
      const isParentActive = pathname === menuItem.href;

      newOpenSubmenus[menuItem.href] =
        hasActiveSubmenuItem || isChildRoute || isParentActive;
    }
    setOpenSubmenus(newOpenSubmenus);
  }, [pathname, menuItem]);

  const handleSubmenuToggle = (item: MenuItem) => {
    if (item.submenu) {
      setOpenSubmenus((prev) => ({
        ...prev,
        [item.href]: !prev[item.href],
      }));
    }
  };

  const getRedirectHref = (item: MenuItem) => {
    if (item.submenu) {
      if (item.href === "/admin/courses") {
        return "/admin/courses/manage-courses";
      } else if (item.href === "/admin/internships") {
        return "/admin/internships/manage-internships";
      } else if (item.href === "/admin/users") {
        return "/admin/users/manage-users";
      }
    }
    return item.href;
  };

  const isActiveRoute = (itemHref: string) => {
    if (itemHref === "/admin") {
      return pathname === "/admin";
    }
    // Check if current path matches exactly or starts with the href followed by "/"
    return pathname === itemHref || pathname.startsWith(itemHref + "/");
  };

  return (
    <div className="relative flex flex-col gap-2">
      <Link
        href={getRedirectHref(menuItem)}
        className={cn(
          `w-full p-3 rounded-lg transition-all duration-300 relative`,
          {
            "bg-orange-500 shadow-[inset_0_4px_10px_rgba(255,255,255,0.4)] text-white":
              isActiveRoute(menuItem.href),
          },
          isCollapsed && "flex justify-center"
        )}
        onClick={() => handleSubmenuToggle(menuItem)}
        title={isCollapsed ? menuItem.label : undefined}
      >
        <FlexBox className="admin-sidebar-menu-item w-full gap-2 items-center">
          <FlexBox
            className={cn(
              "gap-2 items-center",
              isCollapsed ? "justify-center" : "w-full"
            )}
          >
            {menuItem.icon && (
              <menuItem.icon
                className={cn("size-6", {
                  "fill-white":
                    isActiveRoute(menuItem.href) &&
                    menuItem.href === "/admin/courses",
                })}
              />
            )}
            {menuItem.iconSrc && (
              <Image
                src={menuItem.iconSrc}
                alt={menuItem.label}
                width={24}
                height={24}
                className={cn("size-6", {
                  "filter brightness-0 invert": isActiveRoute(menuItem.href),
                })}
              />
            )}
            {!isCollapsed && (
              <span className="text-base font-medium">{menuItem.label}</span>
            )}
          </FlexBox>
          {menuItem.submenu && !isCollapsed && (
            <ChevronDownIcon
              className={`size-5 transition-transform duration-300 ${
                openSubmenus[menuItem.href] ? "rotate-180" : ""
              }`}
            />
          )}
        </FlexBox>
      </Link>
      {openSubmenus[menuItem.href] && menuItem.submenu && !isCollapsed && (
        <FlexBox className="admin-sidebar-menu-item-submenu w-full flex-col gap-6 bg-white p-3 rounded-lg shadow-md animate-fade-from-top duration-300">
          {menuItem.submenu.map((submenu, index) => {
            const isSubmenuActive =
              pathname === submenu.href ||
              pathname.startsWith(submenu.href + "/");
            return (
              <Link
                key={index}
                href={submenu.href}
                className="w-full flex items-center transition-all duration-300"
              >
                {isSubmenuActive && (
                  <span className="text-orange-500 mx-2 animate-fade-from-left duration-300">
                    •
                  </span>
                )}
                <span
                  className={`text-base font-medium ${
                    isSubmenuActive ? "text-black" : "text-gray-500"
                  }`}
                >
                  {submenu.label}
                </span>
              </Link>
            );
          })}
        </FlexBox>
      )}
    </div>
  );
};

export default SidebarMenuItem;
