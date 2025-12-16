"use client";
import ImageComponent from "@/components/ui/ImageComponent";
import useAuth from "@/hooks/useAuth";
import { Home, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const UserMenu = () => {
  const { user: userFromAuth, handleSignOut } = useAuth();
  const { data: session } = useSession();
  const [isUserOpen, setIsUserOpen] = useState(false);

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
      href: "/dashboard/profile",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
    },
    {
      label: "Logout",
      icon: LogOut,
      href: "",
    },
  ];
  const adminMenuItems = [
    {
      label: "Dashboard",
      icon: Home,
      href: "/admin",
    },
    {
      label: "Profile",
      icon: User,
      href: "/dashboard/profile",
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

  if (user.userType == "admin") {
    return (
      <div
        className="flex items-center gap-3 cursor-pointer relative user-icon"
        onClick={() => setIsUserOpen(!isUserOpen)}
      >
        <div className="w-10 h-10 bg-[#F2ECF9] rounded-md flex items-center justify-center">
          {user.profilePicture ? (
            <ImageComponent
              src={user.profilePicture}
              alt="user"
              width={36}
              height={36}
              className="size-9 rounded-md"
              draggable={false}
              loading="eager"
            />
          ) : (
            <div className="size-9 rounded-md bg-gray-100 flex items-center justify-center">
              <span className="text-gray-500 text-xs font-bold capitalize select-none">
                {user?.firstName && user?.lastName
                  ? `${user.firstName.charAt(0).toUpperCase()}${user.lastName
                      .charAt(0)
                      .toUpperCase()}`
                  : user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <span className="hidden sm:block text-[#1D2939] font-bold text-base select-none">
          {user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.email.split("@")[0]}
        </span>
        <ImageComponent
          src="/admin/down-arrow.svg"
          alt="down-arrow"
          width={20}
          height={20}
        />
        {isUserOpen && (
          <>
            {/* Mobile backdrop */}
            <div
              className="fixed inset-0 bg-black/20 z-40 lg:hidden"
              onClick={() => setIsUserOpen(false)}
            />
            <div className="user-menu absolute w-full sm:w-auto min-w-[200px] top-full mt-1.5 right-0 text-text-primary rounded-xl shadow-2xl z-50 bg-white">
              <div className="bg-linear-to-r from-gray-50 to-gray-100/30 rounded-lg">
                {adminMenuItems.map((item, index) => {
                  if (item.label === "Logout") {
                    return (
                      <button
                        key={index}
                        className="w-full flex items-center gap-3 p-3 hover:bg-white/80 hover:shadow-sm rounded-lg transition-all duration-200 ease-in-out cursor-pointer group"
                        onClick={() => handleSignOut()}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-orange-100 transition-colors duration-200">
                          <item.icon className="size-4 text-gray-600 group-hover:text-orange-600 transition-colors duration-200" />
                        </div>

                        <span className="font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                          {item.label}
                        </span>
                      </button>
                    );
                  }

                  return (
                    <Link
                      href={item.href}
                      key={index}
                      className="w-full flex items-center gap-3 p-3 hover:bg-white/80 hover:shadow-sm rounded-lg transition-all duration-200 ease-in-out cursor-pointer group"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-orange-100 transition-colors duration-200">
                        <item.icon className="size-4 text-gray-600 group-hover:text-orange-600 transition-colors duration-200" />
                      </div>
                      <span className="font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className="user flex gap-2 items-center cursor-pointer relative"
      onClick={() => setIsUserOpen(!isUserOpen)}
    >
      {user.profilePicture ? (
        <ImageComponent
          src={user.profilePicture}
          alt="user"
          width={36}
          height={36}
          className="size-9 rounded-md"
          draggable={false}
          loading="eager"
        />
      ) : (
        <div className="size-9 rounded-md bg-gray-100 flex items-center justify-center">
          <span className="text-gray-500 text-xs font-bold select-none">
            {user?.firstName && user?.lastName
              ? `${user.firstName.charAt(0).toUpperCase()}${user.lastName
                  .charAt(0)
                  .toUpperCase()}`
              : user?.email?.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <div className="user-info hidden lg:flex flex-col">
        <span className="user-name text-text-primary text-xs font-bold">
          {user?.firstName && user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : user?.email.split("@")[0]}
        </span>
        <span className="user-email text-gray-500 text-xs font-normal">
          {user.email}
        </span>
      </div>
      {isUserOpen && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setIsUserOpen(false)}
          />
          <div className="user-menu absolute min-w-full w-max sm:min-w-[200px] top-full mt-1.5 right-0 text-text-primary rounded-xl shadow-[0px_0px_24px_4px_rgba(0,0,0,0.1)] z-50 bg-white">
            <div className="bg-linear-to-r from-gray-50 to-gray-100/30 rounded-lg">
              {userMenuItems.map((item, index) => {
                if (item.label === "Logout") {
                  return (
                    <button
                      key={index}
                      className="w-full flex items-center gap-3 p-3 hover:bg-white/80 hover:shadow-sm rounded-lg transition-all duration-200 ease-in-out cursor-pointer group"
                      onClick={() => handleSignOut()}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-orange-100 transition-colors duration-200">
                        <item.icon className="size-4 text-gray-600 group-hover:text-orange-600 transition-colors duration-200" />
                      </div>

                      <span className="font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                        {item.label}
                      </span>
                    </button>
                  );
                }

                return (
                  <Link
                    href={item.href}
                    key={index}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/80 hover:shadow-sm rounded-lg transition-all duration-200 ease-in-out cursor-pointer group"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-orange-100 transition-colors duration-200">
                      <item.icon className="size-4 text-gray-600 group-hover:text-orange-600 transition-colors duration-200" />
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
