import React from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import CourseFilterProvider from "@/contexts/CourseFilterProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const CoursesLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={`min-h-screen w-full flex flex-col gap-10 p-6 bg-[rgba(226,226,226,0.4)] ${plusJakartaSans.className}`}>
      <CourseFilterProvider>
        {children}
      </CourseFilterProvider>
    </div>
  );
};

export default CoursesLayout;
