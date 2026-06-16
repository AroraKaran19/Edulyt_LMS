"use client";
import { cn } from "@/lib/utils";
import { NavItem } from "@/types";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NavLink = ({
  href,
  label,
  displayLabel,
  count,
  className,
  active,
  ...props
}: NavItem & React.HTMLAttributes<HTMLAnchorElement>) => {
  const pathname = usePathname();
  const isActive = pathname === href || active;

  const displayCount =
    typeof count === "number"
      ? count > 200
        ? "200+"
        : count > 100
          ? "100+"
          : `${count}`
      : undefined;

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
        {displayLabel ?? label.charAt(0).toUpperCase() + label.slice(1)}
      </span>
      {displayCount !== undefined && (
        <span
          className={cn(
            "text-[10px] font-medium py-px px-2 rounded-full transition-colors duration-400 ease-in-out select-none bg-black text-white",
            isActive && "bg-[#F77124] text-white"
          )}
        >
          {displayCount}
        </span>
      )}
    </Link>
  );
};

export default NavLink;
