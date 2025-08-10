"use client";
import Navlink from "@/components/shared/Navbar/Navlink";
import FloatingContainer from "@/components/ui/FloatingContainer";
import Searchbar2 from "@/components/ui/Searchbar2";
import { NavItem } from "@/types";
import { Bell, HelpCircle, LogOut, Settings, User2 } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import AlertBanner from "@/components/ui/AlertBanner";
import FlexBox from "@/components/ui/FlexBox";
import DashboardBanner from "./DashboardBanner";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

const DashboardNavbar = () => {
  const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    image: "",
    title: "Admin",
  };
  const [search, setSearch] = useState("");
  
  // Dynamic notifications data - can be fetched from API
  const notificationsList: Notification[] = [
    {
      id: "1",
      title: "Course Enrollment",
      message: "New student enrolled in React Fundamentals",
      time: "2 minutes ago",
      isRead: false
    },
    {
      id: "2", 
      title: "Assignment Submitted",
      message: "John submitted JavaScript Advanced assignment",
      time: "1 hour ago",
      isRead: false
    },
    {
      id: "3",
      title: "Payment Received",
      message: "Payment of $299 received for Premium Course",
      time: "3 hours ago",
      isRead: true
    },
    {
      id: "4",
      title: "Review Posted",
      message: "Sarah left a 5-star review on your course",
      time: "1 day ago",
      isRead: true
    }
  ];
  
  const notifications = notificationsList.length; // Count for badge
  const navLinks: NavItem[] = [
    {
      label: "Home",
      href: "/dashboard",
      isDashboard: true,
    },
    {
      label: "My Courses",
      href: "/dashboard/courses",
    },
    {
      label: "My Applications",
      href: "/dashboard/applications",
    },
    {
      label: "Certificates",
      href: "/dashboard/certificates",
    },
  ];
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);

  // close all floating container in on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest(".notification-wrapper") ||
        target.closest(".user-wrapper")
      )
        return;
      setIsNotificationOpen(false);
      setIsUserOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isNotificationOpen, isUserOpen]);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    const target = event.target as HTMLElement;
    if (target.closest(".notification-wrapper")) {
      setIsUserOpen(false);
      setIsNotificationOpen(!isNotificationOpen);
    } else if (target.closest(".user-wrapper")) {
      setIsNotificationOpen(false);
      setIsUserOpen(!isUserOpen);
    }
  };

  return (
    <header className="dashboard-navbar fixed top-0 left-0 w-full bg-white z-50 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
      <FlexBox className="w-full flex items-stretch justify-between h-full px-10 md:px-20 border-b border-gray-300">
        <div className="navbar-left w-1/2 h-full flex flex-col gap-4 my-4">
          <div className="flex gap-5 w-full items-center">
            <Link href="/">
              <Image
                src="/logo.svg"
                alt="logo"
                width={100}
                height={100}
                className="w-[190px] h-full select-none"
                draggable={false}
              />
            </Link>
            <Searchbar2
              className="max-w-sm"
              placeholder="Search a course by its name, title or author name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSearch={() => {}} // TODO: Implement search functionality
            />
          </div>
          <nav className="flex gap-5">
            {navLinks.map((link, index) => (
              <Navlink key={index} {...link} />
            ))}
          </nav>
        </div>
        <div className="navbar-right h-max w-1/2 flex gap-10 items-center justify-end mt-5 relative">
          <div
            className="notification-wrapper relative cursor-pointer"
            onClick={handleClick}
          >
            <Bell className="size-6 text-text-primary" />
            {notifications > 0 && (
              <div className="absolute -top-1 -right-1 size-4 bg-[#F77124] rounded-full flex items-center justify-center">
                <span className="text-[10px] text-white font-semibold select-none leading-none">
                  {notifications}
                </span>
              </div>
            )}
            {isNotificationOpen && (
              <FloatingContainer
                title="Notifications"
                markerTitle="Mark all as read"
                onMarkerClick={() => {}}
                onViewAll={() => {}}
                onElementClick={() => {}}
                elements={notificationsList.map(notification => (
                  <div key={notification.id} className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${notification.isRead ? 'bg-gray-300' : 'bg-orange-500'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
                className="notification-floating-container"
              />
            )}
          </div>
          <div
            className="user-wrapper relative flex items-center gap-1 cursor-pointer"
            onClick={handleClick}
          >
            <div className="user-image size-9 rounded-xl overflow-hidden">
              {user.image ? (
                <Image
                  src="/user.png"
                  alt="user"
                  width={36}
                  height={36}
                  className="cursor-pointer"
                />
              ) : (
                <div className="size-9 bg-[#5E00FF] rounded-xl overflow-hidden flex items-center justify-center">
                  <span className="text-white text-base font-bold select-none">
                    {user.name.split(" ").length === 1
                      ? user.name.substring(0, 2).toUpperCase()
                      : (
                          user.name.split(" ")[0].substring(0, 1) +
                          user.name.split(" ")[1].substring(0, 1)
                        ).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="user-info flex flex-col select-none">
              <div className="user-name text-text-primary text-xs font-bold">
                {user.name}
              </div>
              <div className="user-title text-gray-500 text-xs font-normal">
                {user.title}
              </div>
            </div>
            {isUserOpen && (
              <FloatingContainer
                className="mt-2 w-64"
                title="User's Settings"
                onViewAll={() => {}}
                onElementClick={() => {}}
                elements={[
                  <div key={String(Math.random())} className="flex items-center gap-1 p-0.5 hover:bg-gray-50 rounded-md transition-colors">
                    <div className="p-0.5 bg-[#FFF1E9] rounded-full">
                      <User2 className="size-4 text-[#F77124]" />
                    </div>
                    <span className="font-medium text-text-primary">
                      Profile
                    </span>
                  </div>,
                  <div key={String(Math.random())} className="flex items-center gap-1 p-0.5 hover:bg-gray-50 rounded-md transition-colors">
                    <div className="p-0.5 bg-[#FFF1E9] rounded-full">
                      <Settings className="size-4 text-[#F77124]" />
                    </div>
                    <span className="font-medium text-text-primary">
                      Settings
                    </span>
                  </div>,
                  <div key={String(Math.random())} className="flex items-center gap-1 p-0.5 hover:bg-gray-50 rounded-md transition-colors">
                    <div className="p-0.5 bg-[#FFF1E9] rounded-full">
                      <HelpCircle className="size-4 text-[#F77124]" />
                    </div>
                    <span className="font-medium text-text-primary">Help</span>
                  </div>,
                  <div key={String(Math.random())} className="flex items-center gap-1 p-0.5 hover:bg-[#FFF1E9] rounded-md transition-colors">
                    <div className="p-0.5 bg-[#FFF1E9] rounded-full">
                      <LogOut className="size-4 text-[#F77124]" />
                    </div>
                    <span className="font-medium text-[#F77124]">Logout</span>
                  </div>,
                ]}
                showViewAll={false}
              />
            )}
          </div>
        </div>
      </FlexBox>
      <DashboardBanner />
      <AlertBanner
        message="50% off on every new course purchased!"
        type="limited-time-offer"
        className="px-20 py-[5px]"
      />
    </header>
  );
};

export default DashboardNavbar;
