"use client";
import UserMenu from "@/components/shared/User/UserMenu";
import ImageComponent from "@/components/ui/ImageComponent";
import Searchbar2 from "@/components/ui/Searchbar2";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const DashboardNavbar = () => {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Home",
      href: "/dashboard",
    },
    {
      label: "My Courses",
      href: "/dashboard/courses",
    },
    // {
    //   label: "My Applications",
    //   href: "/dashboard/applications",
    // },
    {
      label: "Certificates",
      href: "/dashboard/certificates",
    },
  ];

  return (
    <div className="dashboard-navbar w-full fixed top-0 left-0 z-9999 bg-white">
      <div className="w-full py-4 px-4 lg:px-20 flex items-center gap-4">
        <Link href="/" className="w-max">
          <ImageComponent
            src="/logo.svg"
            alt="logo"
            width={100}
            height={100}
            loading="eager"
            className="h-[52px] w-max"
            draggable={false}
          />
        </Link>
        <div className="hidden lg:flex max-w-[350px] items-center gap-3 sm:gap-5 flex-1 min-w-0 mt-2">
          <Searchbar2
            className="w-full"
            placeholder="Search a course by its name, title or author name"
            value=""
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {}}
            onSearch={() => {}}
          />
        </div>
        <div className="ml-auto flex items-center gap-4">
          {/* Notification Icon */}
          {/* <div className="p-2 hover:bg-gray-100 rounded-md active:shadow-[inset_0_2px_6px_rgba(255,255,255,0.8)] transition-colors duration-300 ease-in-out cursor-pointer">
            <Bell className="size-6 text-text-primary shrink-0" />
          </div> */}
          <UserMenu />
        </div>
      </div>
      <div className="w-full py-4.25 px-4 lg:px-20 shadow-[0_2px_0_rgba(0,0,0,0.1)]">
        <nav className="w-full flex items-center gap-4">
          {navItems.map((item, index) => (
            <Link
              href={item.href}
              key={index}
              className={cn(
                "text-text-primary text-sm font-medium px-5 py-2.5 rounded-full transition-colors duration-200 ease-in-out",
                pathname === item.href && "bg-[#FFE9DB] text-orange-600"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default DashboardNavbar;
