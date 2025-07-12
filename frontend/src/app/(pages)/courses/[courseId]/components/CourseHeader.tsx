import BestsellerBadge from "@/components/ui/course/BestsellerBadge";
import { Course } from "@/types";
import React from "react";
import DiscountCountdown from "../../components/DiscountCountdown";
import OrangeButton from "@/components/ui/OrangeButton";
import { cn } from "@/lib/utils";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Star } from "lucide-react";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const CourseHeader = ({ course }: { course: Course }) => {

  console.log(course);

  const formattedReviews = course?.featuredReviews.length >= 1000000 
    ? `${(course?.featuredReviews.length / 1000000).toFixed(1).replace(/\.0$/, '')}M`
    : course?.featuredReviews.length >= 1000 
    ? `${(course?.featuredReviews.length / 1000).toFixed(1).replace(/\.0$/, '')}K`
    : course?.featuredReviews.length.toString();


  if (!course) return null;

  return (
    <div className="course-header-content w-full my-6 flex flex-col gap-6">
      <div className="course-details w-full flex flex-col lg:flex-row">
        <div className="course-details-content-left w-full lg:w-3/5">
          {course?.isFeatured && (
            <BestsellerBadge
              enrollStudents={course.enrolledCount}
              className="flex-row justify-center items-center md:justify-start"
              text1ClassName="text-sm"
              text2ClassName="text-sm"
            />
          )}
          <div className="course-info flex flex-col gap-2 font-coolvetica text-[#2B1508] mt-5">
            <h1
              className={cn("font-bold text-balance", "text-2xl md:text-3xl text-center md:text-left")}
            >
              {course?.title}
            </h1>
            <p
              className={cn(
                "text-[16px] font-normal text-center md:text-left",
                plusJakartaSans.className
              )}
            >
              {course?.subtitle}
            </p>
          </div>
        </div>
        <div className="course-details-content-right w-full lg:w-2/5 flex flex-col gap-4 mt-3 lg:mt-0 items-center lg:items-end justify-center">
          {course?.discount && (
            <div className="course-discount flex flex-col gap-2">
              <DiscountCountdown
                hours={0}
                minutes={0}
                seconds={10}
                className={`${plusJakartaSans.className} text-sm md:text-base`}
              />
            </div>
          )}
          {course && (
            <OrangeButton className="font-bold text-sm md:text-base">Enroll Now</OrangeButton>
          )}
        </div>
      </div>
      <hr className="w-full border-t-3 border-gray-200" />
      <div className="course-information w-full flex flex-row flex-wrap sm:flex-nowrap justify-center lg:justify-start gap-4 md:gap-20">
        <div className="rating-container w-max flex flex-col items-center md:items-start">
          <p className="text-base font-normal text-[#2B1508]">Rating</p>
          <div className="course-rating w-full flex flex-wrap gap-1 md:gap-2 items-center justify-center md:justify-start">
            <Star className="size-4 md:size-5 text-[#F7AD24]" fill="#F7AD24" />
            <span className="text-base md:text-2xl font-normal text-[#2B1508] font-coolvetica tracking-wide">
              {course?.totalRatings?.toFixed(1)}
            </span>
            <span className="text-sm md:text-base font-normal text-[#2B1508]">
              ({course?.featuredReviews.length > 100
                ? `(more than ${formattedReviews} reviews)`
                : formattedReviews === "1"
                ? `${formattedReviews} review`
                : `${formattedReviews} reviews`})
            </span>
          </div>
        </div>
        <div className="course-proficency w-max flex flex-col items-center md:items-start">
          <p className="text-sm md:text-base font-normal text-[#2B1508]">Proficency</p>
          <p className="text-base md:text-2xl font-normal text-[#2B1508] font-coolvetica tracking-wide">
            {course?.skillLevel}
          </p>
        </div>
        <div className="course-total-time w-max flex flex-col items-center md:items-start">
          <p className="text-sm md:text-base font-normal text-[#2B1508]">Total Time</p>
          <p className="text-base md:text-2xl font-normal text-[#2B1508] font-coolvetica tracking-wide">
            {course?.duration}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CourseHeader;
