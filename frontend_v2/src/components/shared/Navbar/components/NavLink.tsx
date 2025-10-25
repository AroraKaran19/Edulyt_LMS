"use client";
import { cn } from "@/lib/utils";
import { NavItem } from "@/types";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NavLink = ({
  href,
  label,
  count,
  className,
  active,
  ...props
}: NavItem & React.HTMLAttributes<HTMLAnchorElement>) => {
  const pathname = usePathname();
  const isActive = pathname === href || active;

  return (
    <Link
      href={href}
      key={href}
      className={cn(
        "text-sm font-semibold flex items-center gap-2 px-5 py-2.5 transition-colors duration-400 ease-in-out rounded-full select-none",
        isActive && "bg-[#FFE9DB] text-[#f77124]",
        className
      )}
      draggable={false}
      {...props}
    >
      <span className="text-sm font-semibold">
        {label.charAt(0).toUpperCase() + label.slice(1)}
      </span>
      {count && (
        <span
          className={cn(
            "text-[10px] font-medium py-0.25 px-2 rounded-full transition-colors duration-400 ease-in-out select-none bg-black text-white",
            isActive && "bg-[#F77124] text-white"
          )}
        >
          {count && count > 100 ? "100+" : count}
        </span>
      )}
    </Link>
  );
};

export default NavLink;
