import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import OrangeButton from "../../ui/buttons/OrangeButton";
import Navlink from "./Navlink";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
import { cn, fetcher } from "@/lib/utils";
import { NavItem } from "@/types";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import {
  HelpCircle,
  Home,
  LogOut,
  Menu,
  Search,
  Settings,
  User2,
  X,
} from "lucide-react";
import HoverContainer from "./HoverContainer";
import useSWR from "swr";
import { ENDPOINTS } from "@/constants/endpoints";
import { signOut, useSession } from "next-auth/react";
import FloatingContainer from "@/components/ui/FloatingContainer";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const formatNumber = (number: number) => {
  if (number > 100) {
    return "100+";
  } else {
    if (number > 10) {
      return "10+";
    } else {
      return `${number}`;
    }
  }
};

// interface Notification {
//   id: string;
//   title: string;
//   message: string;
//   time: string;
//   isRead: boolean;
// }

const Navbar = () => {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  // TODO: implement redux to store the course count
  const [courseCount, setCourseCount] = useState(0);
  const { data } = useSWR(ENDPOINTS.courses.all, fetcher);
  const courses = data?.data.courses;
  const { data: session } = useSession();
  const user = session?.user;

  useEffect(() => {
    setCourseCount(courses?.length || 0);
  }, [courses]);

  const navItems: NavItem[] = [
    {
      label: "Courses",
      href: "/courses",
      featureBox: formatNumber(courseCount),
    },
    {
      label: "Internships",
      // TODO: change to the actual link when the internship page is ready
      href: "https://edulyt.com/internships.php",
      featureBox: "100+",
    },
  ];

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHoverContainerVisible, setIsHoverContainerVisible] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [activeNavLink, setActiveNavLink] = useState<NavItem | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  // Dynamic notifications data - can be fetched from API
  // const notificationsList: Notification[] = [
  //   {
  //     id: "1",
  //     title: "Course Enrollment",
  //     message: "New student enrolled in React Fundamentals",
  //     time: "2 minutes ago",
  //     isRead: false,
  //   },
  //   {
  //     id: "2",
  //     title: "Assignment Submitted",
  //     message: "John submitted JavaScript Advanced assignment",
  //     time: "1 hour ago",
  //     isRead: false,
  //   },
  //   {
  //     id: "3",
  //     title: "Payment Received",
  //     message: "Payment of ₹299 received for Premium Course",
  //     time: "3 hours ago",
  //     isRead: true,
  //   },
  //   {
  //     id: "4",
  //     title: "Review Posted",
  //     message: "Sarah left a 5-star review on your course",
  //     time: "1 day ago",
  //     isRead: true,
  //   },
  // ];

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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setActiveNavLink(null);
  };

  const showHoverContainer = (navLink?: NavItem) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    if (navLink) {
      setActiveNavLink(navLink);
    }
    setIsHoverContainerVisible(true);
  };

  const hideHoverContainer = () => {
    const timeout = setTimeout(() => {
      setIsHoverContainerVisible(false);
    }, 150); // Small delay to allow mouse to move to container
    const timeout2 = setTimeout(() => {
      setActiveNavLink(null);
    }, 300);
    setHoverTimeout(timeout);
    setHoverTimeout(timeout2);
  };

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
    <>
      <header
        className={cn(
          "navbar w-full fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md h-[78px] flex items-center px-4 sm:px-6 lg:px-8 justify-between shadow-[0_0_1px_2px_rgba(0,0,0,0.1)]",
          "transition-all duration-300 ease-in-out"
        )}
      >
        <div className="logo h-[52px] min-h-[24px] flex-none w-1/3 flex items-center lg:w-1/4">
          <Link
            href="/"
            className="h-full cursor-pointer select-none"
            draggable={false}
          >
            <Image
              src="/logo.svg"
              alt="Airkrit Logo"
              width={100}
              height={100}
              quality={100}
              className="h-full w-full select-none"
              priority
              loading="eager"
              draggable={false}
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav
          className={cn(
            "items-center gap-4 shrink w-2/4 justify-center hidden lg:flex",
            manrope.className,
            "lg:gap-5",
            "xl:gap-9"
          )}
        >
          {navItems.map((item, index) => (
            <Navlink
              href={item.href}
              key={index}
              label={item.label}
              featureBox={item.featureBox}
              onMouseEnter={() => showHoverContainer(item)}
              active={activeNavLink?.label === item.label}
            />
          ))}
        </nav>

        {/* Desktop Auth Options */}
        <div
          className={cn(
            "auth-options flex items-center justify-end gap-2 flex-none w-1/3 lg:w-1/4",
            plusJakartaSans.className,
            "lg:gap-3",
            "xl:gap-4"
          )}
        >
          {isAuthenticated ? (
            <>
              {/* Right Section - Actions */}
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-6">
                {/* Mobile Search Button */}
                <button
                  type="button"
                  title="Search"
                  // onClick={toggleMobileSearch}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Search className="size-5 text-text-primary" />
                </button>

                {/* Notifications */}
                {/* <div
                  className="notification-wrapper relative cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={handleClick}
                >
                  <Bell className="size-5 sm:size-6 text-text-primary" />
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
                      onMarkerClick={() => { }}
                      onViewAll={() => { }}
                      onElementClick={() => { }}
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
                </div> */}

                {/* User Profile */}
                <div
                  className="user-wrapper relative flex items-center gap-1 cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={handleClick}
                >
                  <div className="user-image size-8 sm:size-9 rounded-xl overflow-hidden">
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || "User"}
                        width={36}
                        height={36}
                        className="cursor-pointer w-full h-full object-cover"
                      />
                    ) : (
                      <div className="size-8 sm:size-9 bg-[#5E00FF] rounded-xl overflow-hidden flex items-center justify-center">
                        <span className="text-white text-sm sm:text-base font-bold select-none">
                          {user?.name
                            ? user.name.split(" ").length === 1
                              ? user.name.substring(0, 2).toUpperCase()
                              : (
                                  user.name.split(" ")[0]?.substring(0, 1) +
                                  user.name.split(" ")[1]?.substring(0, 1)
                                ).toUpperCase()
                            : user?.email
                            ? user.email.substring(0, 2).toUpperCase()
                            : "U"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="user-info hidden sm:flex flex-col select-none">
                    <div className="user-name text-text-primary text-xs font-bold">
                      {user?.name || "User"}
                    </div>
                    <div className="user-title text-gray-500 text-xs font-normal">
                      {(user?.role?.charAt(0)?.toUpperCase() || "") +
                        user?.role?.slice(1) || "User"}
                    </div>
                  </div>
                  {isUserOpen && (
                    <FloatingContainer
                      className="mt-2 w-64"
                      title="User's Settings"
                      onViewAll={() => {}}
                      onElementClick={() => {}}
                      elements={[
                        <Link key="dashboard-link" href="/dashboard">
                          <div
                            className="flex items-center gap-1 p-0.5 hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <div className="p-0.5 bg-[#FFF1E9] rounded-full">
                              <Home className="size-4 text-[#F77124]" />
                            </div>
                            <span className="font-medium text-text-primary">
                              Dashboard
                            </span>
                          </div>
                        </Link>,
                        <Link key="settings-link" href="/profile/settings">
                          <div
                            className="flex items-center gap-1 p-0.5 hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <div className="p-0.5 bg-[#FFF1E9] rounded-full">
                              <Settings className="size-4 text-[#F77124]" />
                            </div>
                            <span className="font-medium text-text-primary">
                              Settings
                            </span>
                          </div>
                        </Link>,
                        <div
                          key={"help-link"}
                          className="flex items-center gap-1 p-0.5 hover:bg-gray-50 rounded-md transition-colors"
                        >
                          <div className="p-0.5 bg-[#FFF1E9] rounded-full">
                            <HelpCircle className="size-4 text-[#F77124]" />
                          </div>
                          <span className="font-medium text-text-primary">
                            Help
                          </span>
                        </div>,
                        <div
                          key={"logout-link"}
                          className="flex items-center gap-1 p-0.5 hover:bg-[#FFF1E9] rounded-md transition-colors"
                          onClick={() => {
                            localStorage.removeItem("adminToken");
                            localStorage.removeItem("adminProfile");
                            signOut({ callbackUrl: "/" });
                          }}
                        >
                          <div className="p-0.5 bg-[#FFF1E9] rounded-full">
                            <LogOut className="size-4 text-[#F77124]" />
                          </div>
                          <span className="font-medium text-[#F77124]">
                            Logout
                          </span>
                        </div>,
                      ]}
                      showViewAll={false}
                    />
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={toggleMenu}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {isMenuOpen ? (
                    <X className="size-5 text-text-primary" />
                  ) : (
                    <Menu className="size-5 text-text-primary" />
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hidden sm:block">
                <WhiteButton className="text-xs font-semibold">
                  Log In
                </WhiteButton>
              </Link>
              <Link href="/auth/register" className="hidden lg:block">
                <OrangeButton
                  className="text-xs font-semibold lg:px-4 lg:py-2.5"
                  blinkIcon
                  glow
                >
                  Register Now
                </OrangeButton>
              </Link>
              {/* Mobile Menu Button for non-authenticated users */}
              <button
                onClick={toggleMenu}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6 text-gray-700" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-700" />
                )}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hover Container - Hidden on mobile */}
      <div
        onMouseEnter={() => showHoverContainer()}
        onMouseLeave={hideHoverContainer}
      >
        {activeNavLink && (
          <HoverContainer
            navLink={activeNavLink}
            closeHoverContainer={hideHoverContainer}
            isVisible={isHoverContainerVisible}
          />
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={toggleMenu} />
          <div className="fixed top-[78px] left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg">
            <nav
              className={cn("flex flex-col p-6 space-y-4", manrope.className)}
            >
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={toggleMenu}
                  className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-medium text-gray-900">
                    {item.label}
                  </span>
                  <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                    {item.featureBox}
                  </span>
                </Link>
              ))}

              {/* Mobile Auth Options */}
              <div
                className={cn(
                  "flex flex-col gap-3 pt-4 border-t border-gray-200",
                  plusJakartaSans.className
                )}
              >
                {!isAuthenticated ? (
                  <>
                    <Link href="/auth/login" onClick={toggleMenu}>
                      <WhiteButton className="w-full text-sm font-semibold justify-center">
                        Log In
                      </WhiteButton>
                    </Link>
                    <Link href="/auth/register" onClick={toggleMenu}>
                      <OrangeButton
                        className="w-full text-sm font-semibold justify-center"
                        blinkIcon
                        glow
                      >
                        Register Now
                      </OrangeButton>
                    </Link>
                  </>
                ) : (
                  <>
                    {/* Mobile User Profile Section */}

                    {/* Mobile User Actions */}
                    <div className="space-y-2">
                      <button
                        onClick={toggleMenu}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                      >
                        <div className="p-2 bg-[#FFF1E9] rounded-full">
                          <User2 className="size-5 text-[#F77124]" />
                        </div>
                        <span className="font-medium text-text-primary">
                          Profile
                        </span>
                      </button>

                      <button
                        onClick={toggleMenu}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                      >
                        <div className="p-2 bg-[#FFF1E9] rounded-full">
                          <Settings className="size-5 text-[#F77124]" />
                        </div>
                        <span className="font-medium text-text-primary">
                          Settings
                        </span>
                      </button>

                      <button
                        onClick={toggleMenu}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                      >
                        <div className="p-2 bg-[#FFF1E9] rounded-full">
                          <HelpCircle className="size-5 text-[#F77124]" />
                        </div>
                        <span className="font-medium text-text-primary">
                          Help
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          localStorage.removeItem("adminToken");
                          localStorage.removeItem("adminProfile");
                          signOut({ callbackUrl: "/" });
                          toggleMenu();
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-[#FFF1E9] rounded-lg transition-colors text-left"
                      >
                        <div className="p-2 bg-[#FFF1E9] rounded-full">
                          <LogOut className="size-5 text-[#F77124]" />
                        </div>
                        <span className="font-medium text-[#F77124]">
                          Logout
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
