import React from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Metadata } from "next";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Edulyt India | Courses",
  description:
    "Explore our wide range of courses and find the perfect one for you.",
  keywords: ["course", "edulyt", "learn", "education"],
};

const CoursesLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={`min-h-[calc(100vh-78px)] w-full flex flex-col gap-10 p-6 bg-[rgba(226,226,226,0.4)] ${plusJakartaSans.className}`}
    >
      {children}
    </div>
  );
};

export default CoursesLayout;
