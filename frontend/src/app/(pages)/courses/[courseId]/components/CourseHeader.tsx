import BestsellerBadge from "@/components/ui/course/BestsellerBadge";
import { Course } from "@/types";
import React from "react";
import DiscountCountdown from "../../components/DiscountCountdown";
import OrangeButton from "@/components/ui/OrangeButton";
import { cn } from "@/lib/utils";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const CourseHeader = ({ course }: { course: Course }) => {
  return (
    <div className="course-header-content w-full mt-6 flex flex-col gap-6">
      <div className="course-details w-full flex flex-col lg:flex-row">
        <div className="course-details-content-left w-full lg:w-3/5">
          {course?.isFeatured && (
            <BestsellerBadge
              enrollStudents={course.enrolledCount}
              text1ClassName="sm:text-lg"
              text2ClassName="sm:text-lg"
            />
          )}
          <div className="course-info flex flex-col gap-2 font-coolvetica text-[#2B1508] mt-5">
            <h1 className="text-5xl font-bold text-balance">{course?.title}</h1>
            <p
              className={cn(
                "text-[16px] font-normal",
                plusJakartaSans.className
              )}
            >
              {course?.description}
            </p>
          </div>
        </div>
        <div className="course-details-content-right w-full lg:w-2/5 flex flex-col gap-4 mt-3 sm:mt-0 items-center sm:items-end justify-center">
          {course?.discount && (
            <div className="course-discount flex flex-col gap-2">
              <DiscountCountdown
                hours={0}
                minutes={0}
                seconds={10}
                className={`${plusJakartaSans.className}`}
              />
            </div>
          )}
          {course && (
            <OrangeButton className="font-bold">Enroll Now</OrangeButton>
          )}
        </div>
      </div>
      <hr className="w-full border-t-3 border-gray-200" />
      <div className="course-information w-full flex flex-col gap-4">
        
      </div>
    </div>
  );
};

export default CourseHeader;
