"use client";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import ImageComponent from "@/components/ui/ImageComponent";
import Link from "next/link";
import NavLink from "./components/NavLink";
import { useCallback, useEffect, useRef, useState } from "react";
import NavbarContent from "./components/NavbarContent";
import MobileMenu from "./components/MobileMenu";
import { NavItem } from "@/types";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Manrope } from "next/font/google";
import useAuth from "@/hooks/useAuth";
import UserMenu from "../User/UserMenu";
import { API_BASE_URL } from "@/constants/endpoints";
import { Menu, X } from "lucide-react";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const Navbar = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [coursesCount, setCoursesCount] = useState<number | undefined>(
    undefined,
  );
  const [internshipsCount, setInternshipsCount] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!API_BASE_URL) return;

    const controller = new AbortController();

    (async () => {
      try {
        // Fetch a single course page only to get `total`
        const res = await fetch(`${API_BASE_URL}/courses?page=1&limit=1`, {
          signal: controller.signal,
        });

        if (!res.ok) return;

        const json = (await res.json()) as any;
        const data = json?.data;

        if (Array.isArray(data)) {
          // Backend returns [] for "no courses found"
          setCoursesCount(data.length);
          return;
        }

        const total = data?.total;
        if (typeof total === "number") {
          setCoursesCount(total);
        }
      } catch {
        // ignore navbar count fetch errors
      }
    })();

    (async () => {
      try {
        // Counts the same set the dropdown lists, closed programs included.
        const res = await fetch(
          `${API_BASE_URL}/internships?page=1&limit=1&includeClosed=true`,
          { signal: controller.signal },
        );

        if (!res.ok) return;

        const json = (await res.json()) as any;
        const data = json?.data;

        if (Array.isArray(data)) {
          setInternshipsCount(data.length);
          return;
        }

        const total = data?.total;
        if (typeof total === "number") {
          setInternshipsCount(total);
        }
      } catch {
        // ignore
      }
    })();

    return () => controller.abort();
  }, []);

  const navItems: NavItem[] = [
    {
      // `label` stays "courses" — it keys the mega-menu dropdown logic.
      label: "courses",
      displayLabel: "Program",
      href: "/programs",
      count: coursesCount,
    },
    {
      label: "internship",
      href: "/internships",
      count: internshipsCount,
    },
    {
      label: "community",
      href: "/community",
    },
  ];
  const [hoveredNavLink, setHoveredNavLink] = useState<NavItem | null>(null);
  const [isHoverContainerVisible, setIsHoverContainerVisible] = useState(false);
  // Track ALL pending hover timers so every one can be cancelled on re-hover.
  // A single state slot could only hold one id, which let a stale "hide" timer
  // fire after the user re-hovered and tear down the mega-menu mid-interaction.
  const hoverTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearHoverTimeouts = useCallback(() => {
    hoverTimeoutsRef.current.forEach(clearTimeout);
    hoverTimeoutsRef.current = [];
  }, []);
  const scheduleHoverTimeout = useCallback((cb: () => void, ms: number) => {
    const id = setTimeout(cb, ms);
    hoverTimeoutsRef.current.push(id);
    return id;
  }, []);
  // Cancel any pending timers when the navbar unmounts.
  useEffect(() => () => clearHoverTimeouts(), [clearHoverTimeouts]);

  const [isAnimating, setIsAnimating] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDropdownClicked, setIsDropdownClicked] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinkHasHoverDropdown = (item: NavItem) =>
    item.label === "courses" || item.label === "internship";

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
    // Cancel every pending hide/reset timer so re-hovering can't be undone by a
    // stale timer that was scheduled while leaving.
    clearHoverTimeouts();

    // Switching between two dropdown tabs: swap the content but keep the panel
    // open. Re-assert visibility so a hide already in flight can't win the race.
    if (navLink && hoveredNavLink && navLink.label !== hoveredNavLink.label) {
      setIsTransitioning(true);
      setHoveredNavLink(navLink);
      setIsHoverContainerVisible(true);
      setIsDropdownClicked(false);
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
    scheduleHoverTimeout(() => {
      setIsHoverContainerVisible(false);
    }, 150); // Small delay to allow mouse to move to container
    scheduleHoverTimeout(() => {
      setHoveredNavLink(null);
    }, 300);
  };

  const handleNavLinkMouseLeave = () => {
    // Don't hide immediately if we're transitioning between links or dropdown was clicked
    if (isTransitioning || isDropdownClicked) {
      return;
    }

    scheduleHoverTimeout(() => {
      if (!isTransitioning && !isDropdownClicked) {
        hideHoverContainer();
      }
    }, 100); // Slightly longer delay to allow for transitions
  };

  const handleDropdownClick = () => {
    setIsDropdownClicked(true);
  };

  return (
    <>
      <header
        className={cn(
          "navbar w-full h-[78px] fixed top-0 bg-white z-9999 flex items-center justify-between",
          "px-4 sm:px-6 lg:px-8",
          !isHoverContainerVisible && "shadow-[0_0_10px_2px_rgba(0,0,0,0.2)]",
          isHoverContainerVisible && "border-b border-gray-200",
          manrope.className,
        )}
      >
        <Link
          href="/"
          className="h-full flex items-center shrink-0 select-none"
          draggable={false}
        >
          <ImageComponent
            src="/logo.svg"
            alt="Logo"
            width={100}
            height={100}
            className="h-11 sm:h-[52px] w-auto"
            loading="eager"
            draggable={false}
            unoptimized
          />
        </Link>
        <nav
          className="hidden lg:flex h-full absolute left-1/2 -translate-x-1/2 items-center gap-4 lg:gap-5 xl:gap-9"
          onMouseEnter={() => setIsTransitioning(false)}
        >
          {navItems.map((item, index) => (
            <NavLink
              href={item.href}
              key={index}
              label={item.label}
              displayLabel={item.displayLabel}
              count={item.count}
              onMouseEnter={() => {
                clearHoverTimeouts();
                if (navLinkHasHoverDropdown(item)) {
                  showHoverContainer(item);
                } else {
                  setIsTransitioning(false);
                  setIsDropdownClicked(false);
                  // If the mega menu is open, let it play the exit transition before unmounting
                  if (
                    isHoverContainerVisible &&
                    hoveredNavLink &&
                    navLinkHasHoverDropdown(hoveredNavLink)
                  ) {
                    setIsHoverContainerVisible(false);
                    scheduleHoverTimeout(() => {
                      setHoveredNavLink(null);
                    }, 300);
                  } else {
                    setIsHoverContainerVisible(false);
                    setHoveredNavLink(null);
                  }
                }
              }}
              onMouseLeave={handleNavLinkMouseLeave}
              active={hoveredNavLink?.label === item.label}
            />
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isLoading ? (
            <div className="flex items-center gap-2 animate-pulse" aria-hidden>
              <div className="size-9 rounded-lg bg-gray-200" />
              <div className="hidden lg:flex flex-col gap-1.5">
                <div className="h-3 w-24 rounded bg-gray-200" />
                <div className="h-2.5 w-32 rounded bg-gray-200" />
              </div>
            </div>
          ) : isAuthenticated ? (
            // Role-specific links (e.g. partner college portal vs learner dashboard).
            <UserMenu />
          ) : (
            <OrangeButton
              className="text-xs font-semibold px-4 py-2 sm:px-5 lg:px-4 lg:py-2.5 whitespace-nowrap"
              blinkIcon
              onClick={() => router.push("/register")}
            >
              Get Started
            </OrangeButton>
          )}
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 hover:bg-orange-50 rounded-lg text-gray-700 hover:text-[#F77124] transition-all"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        navItems={navItems}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Hover Container - Hidden on mobile */}
      {hoveredNavLink &&
        (isAnimating ? (
          <div
            className={`fixed top-[78px] h-[60vh] left-0 right-0 z-40 bg-white/95 backdrop-blur-md shadow-[0_0_1px_2px_rgba(0,0,0,0.1)] hidden lg:block p-8 rounded-b-4xl transition-all duration-300 ${
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
