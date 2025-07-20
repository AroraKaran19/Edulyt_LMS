"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavItem } from "@/types";

const Navlink = ({ href, label, featureBox, onMouseEnter, active, isDashboard }: NavItem) => {
  const pathname = usePathname();
  const [windowWidth, setWindowWidth] = useState(0);
  
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const isMobile = windowWidth > 0 && windowWidth <= 768;
  const isActive = isDashboard
    ? pathname === href
    : pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-semibold px-5 py-2.5 transition-colors duration-400 ease-in-out rounded-full select-none",
        {
          "text-[#F77124] bg-[#FFE9DB]": isActive,
          "text-text-primary hover:text-[#F77124] group": !isActive && !isMobile,
          "flex items-center gap-1": !!featureBox,
        },
        active && "text-[#F77124] bg-[#FFE9DB]"
      )}
      draggable={false}
      onMouseEnter={() => onMouseEnter?.({ href, label, featureBox })}
    >
      {label}
      {!!featureBox && (
        <span
          className={cn(
            "text-[10px] font-medium bg-black text-white py-0.25 px-2 rounded-full transition-colors duration-400 ease-in-out select-none",
            {
              "bg-[#F77124] text-white": isActive,
            },
            "group-hover:bg-[#F77124]/80 group-hover:text-white",
            active && "bg-[#F77124] text-white"
          )}
        >
          {featureBox}
        </span>
      )}
    </Link>
  );
};

export default Navlink;
