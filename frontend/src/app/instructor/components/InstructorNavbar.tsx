"use client";

import Link from "next/link";
import ImageComponent from "@/components/ui/ImageComponent";
import UserMenu from "@/components/shared/User/UserMenu";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Star } from "lucide-react";

const InstructorNavbar = () => {
  const pathname = usePathname();

  const links = [
    { href: "/instructor", label: "Overview", icon: LayoutDashboard },
    { href: "/instructor/reviews", label: "Course reviews", icon: Star },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/instructor" className="flex items-center gap-3 shrink-0">
          <ImageComponent
            src="/logo.svg"
            alt="Airkrit"
            width={100}
            height={40}
            className="h-9 w-auto object-contain"
            draggable={false}
          />
          <span className="hidden sm:inline text-sm font-semibold text-gray-500 border-l border-gray-200 pl-3">
            Instructor
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-[#FFE9DB] text-orange-600"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="shrink-0">
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default InstructorNavbar;
