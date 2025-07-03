import Image from "next/image";
import Link from "next/link";
import React from "react";
import OrangeButton from "../../ui/OrangeButton";
import Navlink from "./Navlink";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { NavItem } from "@/types";
import WhiteButton from "@/components/ui/WhiteButton";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const Navbar = () => {
  const navItems: NavItem[] = [
    {
      label: "Courses",
      href: "/courses",
      featureBox: "10+",
    },
    {
      label: "Internships",
      href: "/internships",
      featureBox: "100+",
    },
  ];

  return (
    <header className="navbar w-full fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md h-[78px] flex items-center px-8 justify-between shadow-[0_0_1px_2px_rgba(0,0,0,0.1)]">
      <div className="logo h-[52px] min-h-[24px] flex-none w-1/3 flex items-center lg:w-1/4">
        <Link
          href="/"
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
      <nav
        className={cn(
          "items-center gap-4 shrink w-2/4 justify-center hidden lg:flex",
          manrope.className,
          "lg:gap-5",
          "xl:gap-9",
        )}
      >
        {navItems.map((item) => (
          <Navlink
            href={item.href}
            key={item.label}
            label={item.label}
            featureBox={item.featureBox}
          />
        ))}
      </nav>
      <div
        className={cn(
          "auth-options flex items-center justify-end gap-2 flex-none w-1/3 lg:w-1/4",
          plusJakartaSans.className,
          "lg:gap-3",
          "xl:gap-4"
        )}
      >
        <Link href="/login">
          <WhiteButton className="text-xs font-semibold">
            Log In
          </WhiteButton>
        </Link>
        <Link href="/signup" className="hidden lg:block">
          <OrangeButton className="text-xs font-semibold lg:px-4 lg:py-2.5" blinkIcon glow>
            Register Now
          </OrangeButton>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
