import { NavItem } from "@/types";
import React, { useState, useEffect } from "react";
import GenerateNavbarContent from "./generateNavbarContent";

const HoverContainer = ({
  navLink,
  closeHoverContainer,
  isVisible,
}: {
  navLink: NavItem;
  closeHoverContainer: () => void;
  isVisible: boolean;
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Move conditional return after all hooks are called
  if (!isAnimating && !isVisible) return null;

  return (
    <div
      className={`fixed top-[78px] h-[35vh] left-0 right-0 z-40 bg-white/95 backdrop-blur-md shadow-[0_0_1px_2px_rgba(0,0,0,0.1)] hidden lg:block px-8 rounded-b-4xl transition-all duration-300 ${
        isVisible
          ? "animate-fade-from-top opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4"
      }`}
    >
      <GenerateNavbarContent navLink={navLink} closeHoverContainer={closeHoverContainer} />
    </div>
  );
};

export default HoverContainer;
