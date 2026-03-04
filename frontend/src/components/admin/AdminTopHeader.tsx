"use client";

import UserMenu from "../shared/User/UserMenu";
import { Menu } from "lucide-react";
import { useSidebar } from "@/app/admin/context/SidebarProvider";

const AdminTopHeader = () => {
  const { toggleMobileSidebar } = useSidebar();

  return (
    <div className="flex items-center justify-between w-full bg-white py-4 px-4 sm:px-6 gap-3">
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={toggleMobileSidebar}
        aria-label="Open menu"
        className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
      >
        <Menu className="size-6" />
      </button>

      {/* Search Bar */}
      {/* <div className="relative">
        <input
          type="text"
          placeholder="Search"
          className="w-80 h-10 text-[#667085] font-medium font-coolvetica rounded-md border border-[#F2F4F7] text-sm pl-4 pr-10 placeholder:text-[#667085]"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <ImageComponent
            src="/admin/search-icon.svg"
            alt="search"
            width={20}
            height={20}
          />
        </div>
      </div> */}

      {/* Spacer for mobile (balances hamburger on left) */}
      <div className="flex-1 min-w-0" />

      {/* User Profile Section */}
      <div className="flex items-center gap-4 sm:gap-8 shrink-0">
        {/* Notifications */}
        {/* <div className="relative">
          <div className="w-10 h-10 bg-white border border-[#F2F4F7] rounded-xl flex items-center justify-center cursor-pointer">
            <ImageComponent
              src="/admin/notification-icon.svg"
              alt="notification"
              width={20}
              height={20}
            />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-medium">1</span>
          </div>
        </div> */}

        {/* Vertical Separator */}
        {/* <div className="w-px h-6 bg-[#EAECF0]"></div> */}

        {/* User Profile */}
        <UserMenu />
      </div>
    </div>
  );
};

export default AdminTopHeader;
