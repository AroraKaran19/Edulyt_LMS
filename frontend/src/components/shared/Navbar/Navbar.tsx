import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import OrangeButton from "../../ui/buttons/OrangeButton";
import Navlink from "./Navlink";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
import { cn, fetcher } from "@/lib/utils";
import { NavItem } from "@/types";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Menu, X } from "lucide-react";
import HoverContainer from "./HoverContainer";
import useSWR from "swr";
import { ENDPOINTS } from "@/constants/endpoints";
import { useSession } from "next-auth/react";

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

const Navbar = () => {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  // TODO: implement redux to store the course count
  const [courseCount, setCourseCount] = useState(0);
  const { data } = useSWR(ENDPOINTS.courses.all, fetcher);
  const courses = data?.data.courses;

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

  return (
    <>
      <header
        className={cn(
          "navbar w-full fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md h-[78px] flex items-center px-8 justify-between shadow-[0_0_1px_2px_rgba(0,0,0,0.1)]",
          "transition-all duration-300 ease-in-out"
        )}
      >
        <div className="logo h-[52px] min-h-[24px] flex-none w-1/3 flex items-center lg:w-1/4">
          <Link
            href="https://edulyt.com"
            target="_blank"
            className="h-full cursor-pointer select-none"
            draggable={false}
          >
            <Image
              src="/logo.svg"
              alt="Edulyt Logo"
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
          {!isAuthenticated && (
            <>
              <Link href="/auth/login" className="hidden sm:block">
                <WhiteButton className="text-xs font-semibold">Log In</WhiteButton>
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
            </>
          )}

          {/* Hamburger Menu Button */}
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
                {!isAuthenticated && (
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
