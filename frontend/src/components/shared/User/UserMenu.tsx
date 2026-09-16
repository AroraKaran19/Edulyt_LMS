"use client";
import ImageComponent from "@/components/ui/ImageComponent";
import useAuth from "@/hooks/useAuth";
import {
  BookOpen,
  Briefcase,
  ChevronDown,
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import ReferAndEarnModal from "@/components/shared/Referral/ReferAndEarnModal";
import { getPostLoginRedirectPath } from "@/lib/postLoginRedirect";

const UserMenu = () => {
  const { user: userFromAuth, handleSignOut } = useAuth();
  const { data: session } = useSession();
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [referModalOpen, setReferModalOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [canHover, setCanHover] = useState(false);

  // Only wire hover up on devices that actually hover, so a tap on a touch
  // screen (which emulates mouseenter then click) doesn't open the menu and
  // immediately toggle it shut.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    setCanHover(window.matchMedia("(hover: hover)").matches);
  }, []);

  // Clean up any pending close timer on unmount.
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Open at once on hover; close on leave after a short grace period so the
  // cursor can cross the gap between the trigger and the menu without it
  // snapping shut. The menu is a child of the wrapper, so moving onto it fires
  // the wrapper's mouseenter again and cancels the pending close.
  const openMenu = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsUserOpen(true);
  };
  const scheduleClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setIsUserOpen(false), 150);
  };

  // Use session user data directly to ensure reactivity to session updates
  // This ensures that when updateSession() is called elsewhere, this component updates
  const user = (session?.user as typeof userFromAuth) || userFromAuth;
  const userMenuItems = [
    {
      label: "Dashboard",
      icon: Home,
      href: "/dashboard",
    },
    {
      label: "Profile",
      icon: User,
      href: "/profile",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
    },
    {
      label: "Logout",
      icon: LogOut,
      href: "",
    },
  ];

  const collaboratorMenuItems = [
    {
      label: "Home",
      icon: Home,
      href: "/",
    },
    {
      label: "Profile",
      icon: User,
      href: "/profile",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
    },
    {
      label: "Logout",
      icon: LogOut,
      href: "",
    },
  ];

  const partnerMenuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/partner/dashboard",
    },
    {
      label: "Courses",
      icon: BookOpen,
      href: "/partner/courses",
    },
    {
      label: "Internships",
      icon: Briefcase,
      href: "/partner/internships",
    },
    {
      label: "Profile",
      icon: User,
      href: "/profile",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
    },
    {
      label: "Logout",
      icon: LogOut,
      href: "",
    },
  ];

  const instructorMenuItems = [
    {
      label: "Instructor dashboard",
      icon: LayoutDashboard,
      href: "/instructor",
    },
    {
      label: "Course reviews",
      icon: Star,
      href: "/instructor/reviews",
    },
    {
      label: "Profile",
      icon: User,
      href: "/profile",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
    },
    {
      label: "Logout",
      icon: LogOut,
      href: "",
    },
  ];
  /**
   * Marketer and sales are staff too, but "/admin" is the Dashboard page their
   * role map does not grant, so they are pointed at their own home instead.
   */
  const isRoleGatedStaff =
    user.userType === "marketer" || user.userType === "sales";
  const staffHome = isRoleGatedStaff
    ? getPostLoginRedirectPath(user, undefined)
    : "/admin";

  const adminMenuItems = [
    {
      label: isRoleGatedStaff ? "Admin panel" : "Dashboard",
      icon: Home,
      href: staffHome,
    },
    {
      label: "Profile",
      icon: User,
      href: "/profile",
    },
    {
      label: "Logout",
      icon: LogOut,
      href: "",
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest(".user-menu") ||
        target.closest(".user-icon") ||
        target.closest(".user") ||
        target.closest("[class*='user-menu']")
      )
        return;
      setIsUserOpen(false);
    };
    if (isUserOpen) {
      document.addEventListener("click", handleClickOutside);
      // Prevent body scroll on mobile when menu is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isUserOpen]);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email?.split("@")[0] ||
    "User";

  const menuItemClass =
    "w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg transition-colors duration-150 cursor-pointer group";
  const iconWrapperClass =
    "flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 transition-colors shrink-0";
  const iconClass = "size-4 text-gray-600 group-hover:text-orange-600";

  const primaryNavItems =
    user.userType === "instructor"
      ? instructorMenuItems
      : user.userType === "partner"
        ? partnerMenuItems
        : user.userType === "collaborator"
          ? collaboratorMenuItems
          : userMenuItems;

  if (
    user.userType === "admin" ||
    user.userType === "super-admin" ||
    isRoleGatedStaff
  ) {
    return (
      <div
        className="flex items-center gap-3 cursor-pointer relative user-icon select-none"
        onClick={() => setIsUserOpen(!isUserOpen)}
        onMouseEnter={canHover ? openMenu : undefined}
        onMouseLeave={canHover ? scheduleClose : undefined}
        role="button"
        aria-haspopup="menu"
        aria-expanded={isUserOpen}
        aria-label="User menu"
      >
        <div className="w-10 h-10 bg-[#F2ECF9] rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
          {user.profilePicture ? (
            <ImageComponent
              src={user.profilePicture}
              alt=""
              width={40}
              height={40}
              className="size-10 object-cover"
              draggable={false}
              loading="eager"
            />
          ) : (
            <span className="text-gray-600 text-sm font-semibold">
              {user?.firstName && user?.lastName
                ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
                : user?.email?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <span className="hidden sm:block text-[#1D2939] font-semibold text-sm truncate max-w-[120px]">
          {displayName}
        </span>
        <ChevronDown
          className={`size-5 text-gray-500 shrink-0 transition-transform duration-200 ${
            isUserOpen ? "rotate-180" : ""
          }`}
        />
        {isUserOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/15 z-40 lg:hidden backdrop-blur-[1px]"
              onClick={() => setIsUserOpen(false)}
              aria-hidden
            />
            <div
              className="user-menu absolute w-full sm:w-auto min-w-[220px] top-full mt-2 right-0 z-50 bg-white rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50 py-2 animate-in fade-in-0 zoom-in-95 duration-150"
              role="menu"
            >
              {/* User header */}
              <div className="px-3 py-2.5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                    {user.profilePicture ? (
                      <ImageComponent
                        src={user.profilePicture}
                        alt=""
                        width={40}
                        height={40}
                        className="size-10 object-cover"
                        draggable={false}
                      />
                    ) : (
                      <span className="text-gray-600 text-sm font-semibold">
                        {user?.firstName && user?.lastName
                          ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
                          : user?.email?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1.5">
                {adminMenuItems
                  .filter((item) => item.label !== "Logout")
                  .map((item) => (
                    <Link
                      href={item.href}
                      key={item.label}
                      className={`${menuItemClass} mx-2 hover:bg-orange-50`}
                      onClick={() => setIsUserOpen(false)}
                      role="menuitem"
                    >
                      <div className={`${iconWrapperClass} group-hover:bg-orange-100`}>
                        <item.icon className={iconClass} />
                      </div>
                      <span className="font-medium text-gray-700 group-hover:text-gray-900">
                        {item.label}
                      </span>
                    </Link>
                  ))}
                <div className="my-1.5 border-t border-gray-100" />
                <button
                  type="button"
                  className={`${menuItemClass} mx-2 hover:bg-red-50 w-[calc(100%-1rem)]`}
                  onClick={() => {
                    setIsUserOpen(false);
                    handleSignOut();
                  }}
                  role="menuitem"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-red-100 transition-colors shrink-0">
                    <LogOut className="size-4 text-gray-600 group-hover:text-red-600" />
                  </div>
                  <span className="font-medium text-gray-700 group-hover:text-red-700">
                    Logout
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className="user flex gap-2 items-center cursor-pointer relative select-none"
      onClick={() => setIsUserOpen(!isUserOpen)}
      onMouseEnter={canHover ? openMenu : undefined}
      onMouseLeave={canHover ? scheduleClose : undefined}
      role="button"
      aria-haspopup="menu"
      aria-expanded={isUserOpen}
      aria-label="User menu"
    >
      {user.profilePicture ? (
        <ImageComponent
          src={user.profilePicture}
          alt=""
          width={40}
          height={40}
          className="size-9 rounded-lg object-cover"
          draggable={false}
          loading="eager"
        />
      ) : (
        <div className="size-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
          <span className="text-gray-600 text-sm font-semibold">
            {user?.firstName && user?.lastName
              ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
              : user?.email?.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <div className="user-info hidden lg:flex flex-col min-w-0">
        <span className="user-name text-text-primary text-sm font-semibold truncate">
          {displayName}
        </span>
        <span className="user-email text-gray-500 text-xs truncate">
          {user.email}
        </span>
      </div>
      <ChevronDown
        className={`size-4 text-gray-500 shrink-0 ml-0.5 transition-transform duration-200 lg:block hidden ${
          isUserOpen ? "rotate-180" : ""
        }`}
      />
      {isUserOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/15 z-40 lg:hidden backdrop-blur-[1px]"
            onClick={() => setIsUserOpen(false)}
            aria-hidden
          />
          <div
            className="user-menu absolute min-w-full w-max sm:min-w-[220px] top-full mt-2 right-0 z-50 bg-white rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50 py-2 animate-in fade-in-0 zoom-in-95 duration-150"
            role="menu"
          >
            {/* User header */}
            <div className="px-3 py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                  {user.profilePicture ? (
                    <ImageComponent
                      src={user.profilePicture}
                      alt=""
                      width={40}
                      height={40}
                      className="size-10 object-cover"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-gray-600 text-sm font-semibold">
                      {user?.firstName && user?.lastName
                        ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
                        : user?.email?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1.5">
              {primaryNavItems
                .filter((item) => item.label !== "Logout")
                .map((item) => (
                  <Link
                    href={item.href}
                    key={item.label}
                    className={`${menuItemClass} mx-2 hover:bg-orange-50`}
                    onClick={() => setIsUserOpen(false)}
                    role="menuitem"
                  >
                    <div
                      className={`${iconWrapperClass} group-hover:bg-orange-100`}
                    >
                      <item.icon className={iconClass} />
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-gray-900">
                      {item.label}
                    </span>
                  </Link>
                ))}
              {/* Learner-only: Refer & Earn modal trigger. */}
              {(!user.userType || user.userType === "student") && (
                <button
                  type="button"
                  className={`${menuItemClass} mx-2 hover:bg-orange-50 w-[calc(100%-1rem)]`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsUserOpen(false);
                    setReferModalOpen(true);
                  }}
                  role="menuitem"
                >
                  <div
                    className={`${iconWrapperClass} group-hover:bg-orange-100`}
                  >
                    <Sparkles className={iconClass} />
                  </div>
                  <span className="font-medium text-gray-700 group-hover:text-gray-900">
                    Refer &amp; Earn
                  </span>
                </button>
              )}
              <div className="my-1.5 border-t border-gray-100" />
              <button
                type="button"
                className={`${menuItemClass} mx-2 hover:bg-red-50 w-[calc(100%-1rem)]`}
                onClick={() => {
                  setIsUserOpen(false);
                  handleSignOut();
                }}
                role="menuitem"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-red-100 transition-colors shrink-0">
                  <LogOut className="size-4 text-gray-600 group-hover:text-red-600" />
                </div>
                <span className="font-medium text-gray-700 group-hover:text-red-700">
                  Logout
                </span>
              </button>
            </div>
          </div>
        </>
      )}
      <ReferAndEarnModal
        isOpen={referModalOpen}
        onClose={() => setReferModalOpen(false)}
      />
    </div>
  );
};

export default UserMenu;
