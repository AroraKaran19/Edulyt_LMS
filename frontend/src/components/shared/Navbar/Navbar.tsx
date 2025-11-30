"use client";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import ImageComponent from "@/components/ui/ImageComponent";
import Link from "next/link";
import NavLink from "./components/NavLink";
import { useEffect, useState } from "react";
import NavbarContent from "./components/NavbarContent";
import { NavItem } from "@/types";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Manrope } from "next/font/google";
import useAuth from "@/hooks/useAuth";
import UserMenu from "../User/UserMenu";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const Navbar = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const navItems: NavItem[] = [
    {
      label: "courses",
      href: "/courses",
      count: 1,
    },
    {
      label: "internships",
      href: "/internships",
      count: 101,
    },
  ];
  const [hoveredNavLink, setHoveredNavLink] = useState<NavItem | null>(null);
  const [isHoverContainerVisible, setIsHoverContainerVisible] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDropdownClicked, setIsDropdownClicked] = useState(false);

  useEffect(() => {
    if (isHoverContainerVisible) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isHoverContainerVisible]);

  const showHoverContainer = (navLink?: NavItem) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }

    // If we're transitioning between nav links, don't hide the container
    if (navLink && hoveredNavLink && navLink.label !== hoveredNavLink.label) {
      setIsTransitioning(true);
      setHoveredNavLink(navLink);
      // Keep container visible during transition
      return;
    }

    if (navLink) {
      setHoveredNavLink(navLink);
    }
    setIsHoverContainerVisible(true);
    setIsTransitioning(false);
    setIsDropdownClicked(false); // Reset click state when hovering
  };

  const hideHoverContainer = () => {
    const timeout = setTimeout(() => {
      setIsHoverContainerVisible(false);
    }, 150); // Small delay to allow mouse to move to container
    const timeout2 = setTimeout(() => {
      setHoveredNavLink(null);
    }, 300);
    setHoverTimeout(timeout);
    setHoverTimeout(timeout2);
  };

  const handleNavLinkMouseLeave = () => {
    // Don't hide immediately if we're transitioning between links or dropdown was clicked
    if (isTransitioning || isDropdownClicked) {
      return;
    }

    const timeout = setTimeout(() => {
      if (!isTransitioning && !isDropdownClicked) {
        hideHoverContainer();
      }
    }, 100); // Slightly longer delay to allow for transitions
    setHoverTimeout(timeout);
  };

  const handleDropdownClick = () => {
    setIsDropdownClicked(true);
  };

  return (
    <>
      <header
        className={cn(
          "navbar w-full h-[78px] fixed top-0 bg-white z-9999 px-8 flex items-center",
          !isHoverContainerVisible && "shadow-[0_0_10px_2px_rgba(0,0,0,0.2)]",
          isHoverContainerVisible && "border-b border-gray-200",
          manrope.className
        )}
      >
        <Link href="/" className="h-full w-max flex items-center shrink-0">
          <ImageComponent
            src="/logo.svg"
            alt="Logo"
            width={100}
            height={100}
            className="h-[52px] w-max"
            loading="eager"
            draggable={false}
            unoptimized
          />
        </Link>
        <nav
          className="hidden lg:flex h-full w-full items-center justify-center gap-4 lg:gap-5 xl:gap-9"
          onMouseEnter={() => setIsTransitioning(false)}
        >
          {navItems.map((item) => (
            <NavLink
              href={item.href}
              key={item.href}
              label={item.label}
              count={item.count}
              onMouseEnter={() => showHoverContainer(item)}
              onMouseLeave={handleNavLinkMouseLeave}
              active={hoveredNavLink?.label === item.label}
            />
          ))}
        </nav>
        <div className="ml-auto action-btns flex items-center gap-4 shrink-0">
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <>
              <OrangeButton
                className="text-xs font-semibold lg:px-4 lg:py-2.5"
                blinkIcon
                onClick={() => router.push("/register")}
              >
                Get Started
              </OrangeButton>
            </>
          )}
        </div>
      </header>

      {/* Hover Container - Hidden on mobile */}
      {hoveredNavLink &&
        (isAnimating ? (
          <div
            className={`fixed top-[78px] h-[40vh] left-0 right-0 z-40 bg-white/95 backdrop-blur-md shadow-[0_0_1px_2px_rgba(0,0,0,0.1)] hidden lg:block p-8 rounded-b-4xl transition-all duration-300 ${
              isHoverContainerVisible
                ? "animate-fade-from-top opacity-100 translate-y-0"
                : "opacity-0 -translate-y-4"
            }`}
            onMouseEnter={() => {
              // Keep the current nav link active when mouse enters dropdown
              if (hoveredNavLink) {
                showHoverContainer(hoveredNavLink);
              }
            }}
            onMouseLeave={hideHoverContainer}
            onClick={handleDropdownClick}
          >
            <NavbarContent
              navLink={hoveredNavLink}
              closeHoverContainer={hideHoverContainer}
            />
          </div>
        ) : null)}
    </>
  );
};

export default Navbar;
