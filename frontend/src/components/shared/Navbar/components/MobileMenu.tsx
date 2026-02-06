"use client";
import { cn } from "@/lib/utils";
import { NavItem } from "@/types";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileMenuProps {
  isOpen: boolean;
  navItems: NavItem[];
  onClose: () => void;
}

const MobileMenu = ({ isOpen, navItems, onClose }: MobileMenuProps) => {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "fixed top-[78px] left-0 right-0 bg-white z-50 lg:hidden shadow-lg transition-all duration-300 ease-in-out overflow-hidden",
        isOpen
          ? "max-h-screen opacity-100"
          : "max-h-0 opacity-0 pointer-events-none",
      )}
    >
      <nav className="flex flex-col p-6 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const displayCount =
            typeof item.count === "number"
              ? item.count > 200
                ? "200+"
                : item.count > 100
                  ? "100+"
                  : `${item.count}`
              : undefined;

          return (
            <Link
              key={item.href}
              href={
                item.href === "/internships"
                  ? "https://edulyt.com/internships.php"
                  : item.href
              }
              className={cn(
                "flex items-center justify-between py-3 px-4 text-base font-semibold capitalize transition-colors rounded-full",
                isActive
                  ? "bg-[#FFE9DB] text-[#F77124]"
                  : "text-gray-700 hover:text-[#F77124] hover:bg-orange-50",
              )}
              onClick={onClose}
            >
              <span>{item.label}</span>
              {displayCount !== undefined && (
                <span
                  className={cn(
                    "text-[10px] font-medium py-0.5 px-2 rounded-full transition-colors",
                    isActive
                      ? "bg-[#F77124] text-white"
                      : "bg-black text-white",
                  )}
                >
                  {displayCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileMenu;
