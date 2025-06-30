"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "usehooks-ts";
import { NavItem } from "@/types";

const Navlink = ({ href, label, featureBox }: NavItem) => {
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isActive =
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-semibold px-5 py-2.5 transition-colors duration-400 ease-in-out rounded-full select-none",
        {
          "text-[#F77124] bg-[#FFE9DB]": isActive,
          "text-[#2B1508] hover:text-[#F77124]": !isActive && !isMobile,
          "flex items-center gap-1": !!featureBox,
        }
      )}
      draggable={false}
    >
      {label}
      {!!featureBox && (
        <span
          className={cn(
            "text-[10px] font-medium bg-black text-white py-0.25 px-2 rounded-full transition-colors duration-400 ease-in-out select-none",
            {
              "bg-[#2B1508] text-white": isActive,
            }
          )}
        >
          {featureBox}
        </span>
      )}
    </Link>
  );
};

export default Navlink;
