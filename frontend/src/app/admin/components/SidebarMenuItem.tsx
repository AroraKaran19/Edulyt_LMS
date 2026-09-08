"use client";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import Image from "next/image";

interface MenuItem {
  icon?: React.ReactNode;
  iconSrc?: string;
  label: string;
  href: string;
  submenu?: MenuItem[];
}

export const matchesHref = (href: string, pathname: string) =>
  href === "/admin"
    ? pathname === "/admin"
    : pathname === href || pathname.startsWith(href + "/");

const SidebarMenuItem = ({
  menuItem,
  isCollapsed,
  onNavigate,
  isOpen = false,
  onToggle,
}: {
  menuItem: MenuItem;
  isCollapsed?: boolean;
  onNavigate?: () => void;
  /** Owned by the sidebar so only one group is ever open. */
  isOpen?: boolean;
  onToggle?: (href: string) => void;
}) => {
  const pathname = usePathname();

  // A group is active on its own subtree, and also when one of its items is.
  // The item test is prefix-based, not exact, which is the only way a group
  // whose item sits outside its own path stays lit and open on that item's
  // subroutes.
  const isParentActive =
    matchesHref(menuItem.href, pathname) ||
    !!menuItem.submenu?.some((submenu) => matchesHref(submenu.href, pathname));

  const handleSubmenuToggle = (item: MenuItem) => {
    if (item.submenu) onToggle?.(item.href);
  };

  return (
    <div className="relative flex flex-col gap-2">
      <Link
        // Already the first child the reader is allowed to open: Sidebar
        // rewrites a group's href after filtering its submenu by permission.
        href={menuItem.href}
        className={cn(
          `w-full p-3 rounded-lg transition-all duration-300 relative`,
          {
            "bg-orange-500 shadow-[inset_0_4px_10px_rgba(255,255,255,0.4)] text-white":
              isParentActive,
          },
          isCollapsed && "flex justify-center"
        )}
        onClick={() => {
          handleSubmenuToggle(menuItem);
          onNavigate?.();
        }}
        draggable={false}
        title={isCollapsed ? menuItem.label : undefined}
      >
        <div className="flex admin-sidebar-menu-item w-full gap-2 items-center">
          <div
            className={cn(
              "flex gap-2 items-center",
              isCollapsed ? "justify-center" : "w-full"
            )}
          >
            {menuItem.icon && menuItem.icon}
            {menuItem.iconSrc && (
              <Image
                src={menuItem.iconSrc}
                alt={menuItem.label}
                width={24}
                height={24}
                className={cn("size-6", {
                  "filter brightness-0 invert": isParentActive,
                })}
              />
            )}
            {!isCollapsed && (
              <span className="text-base font-medium">{menuItem.label}</span>
            )}
          </div>
          {menuItem.submenu && !isCollapsed && (
            <ChevronDownIcon
              className={`size-5 transition-transform duration-300 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </div>
      </Link>
      {isOpen && menuItem.submenu && !isCollapsed && (
        <div className="flex admin-sidebar-menu-item-submenu w-full flex-col gap-6 bg-white p-3 rounded-lg shadow-md animate-fade-from-top duration-300">
          {menuItem.submenu.map((submenu, index) => {
            const isSubmenuActive = matchesHref(submenu.href, pathname);
            return (
              <Link
                key={index}
                href={submenu.href}
                className="w-full flex items-center transition-all duration-300"
                onClick={onNavigate}
                draggable={false}
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
        </div>
      )}
    </div>
  );
};

export default SidebarMenuItem;
