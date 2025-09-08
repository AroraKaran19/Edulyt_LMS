import BestsellerBadge from "@/components/ui/course/BestsellerBadge";
import DiscountBadge from "@/components/ui/course/DiscountBadge";
import InstructorCard from "@/components/ui/course/InstructorCard";
import RatingContainer from "@/components/ui/course/RatingContainer";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { cn } from "@/lib/utils";
import { Course } from "@/types";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

const CourseCard = ({
  course,
  ...props
}: { course: Course } & {
  className?: string;
  style?: React.CSSProperties;
}) => {
  const router = useRouter();
  const originalPrice =
    course.plans.essential?.price || course.plans.elite?.price || 0;
  const hasActiveDiscount =
    !!course.discount && course.discount.isActive && course.discount.value > 0;
  let discountedPrice = originalPrice;
  if (
    course.discount &&
    course.discount.isActive &&
    course.discount.value > 0
  ) {
    if (course.discount.discount === "percentage") {
      discountedPrice = Math.round(
        originalPrice - (originalPrice * course.discount.value) / 100
      );
    } else if (course.discount.discount === "fixed") {
      discountedPrice = Math.max(
        0,
        Math.round(originalPrice - course.discount.value)
      );
    }
  }

  return (
    <div
      className={cn(
        "course-card w-full h-full bg-white rounded-2xl p-3 flex flex-col border-2 border-[rgb(233,117,0)] shadow-[0_0_2px_4px_rgba(233,117,0,0.3)] gap-4 cursor-default",
        "md:flex-row md:items-stretch",
        props.className
      )}
      style={props.style}
    >
      <div className="course-image w-full md:w-2/5 rounded-2xl overflow-hidden relative flex-shrink-0">
        <img
          src={course?.thumbnail || "/CourseCardDemo.jpg"}
          alt={course?.title}
          className="rounded-2xl w-full h-full object-fill max-h-[150px] md:max-h-full opacity-90"
          draggable={false}
          loading="lazy"
        />
        {course?.discount && course.discount.isActive && (
          <DiscountBadge
            discount={course.discount}
            className="absolute top-2 right-2"
          />
        )}
      </div>
      <div className="course-content w-full md:w-3/5 flex flex-col justify-between">
        {course?.isFeatured ? (
          <BestsellerBadge enrollStudents={course?.enrolledCount} />
        ) : (
          <div className="w-full h-4" />
        )}
        <p className="text-2xl font-bold mt-2 font-coolvetica select-none text-balance break-words line-clamp-2">
          {course?.title}
        </p>
        <RatingContainer
          reviewCount={course?.reviews.length}
          totalRating={course.totalRatings}
          className="mt-2 text-xs"
          courseSlug={course?.slug}
        />
        <div className="instructors mt-2 flex gap-2 select-none mb-2 flex-col sm:flex-row items-start sm:items-center">
          {course?.instructor.map((instructor, index) => {
            if (index < 2) {
              return <InstructorCard key={index} instructor={instructor} />;
            }
          })}
          {course?.instructor.length > 2 && (
            <div className="instructor-count flex gap-0.25 items-center bg-[#EEEEEE] rounded-full p-1">
              <Plus className="w-3 h-3 text-text-primary" fill="#2B1508" />
              <p className="text-xs font-bold text-text-primary">
                {course?.instructor.length - 2}
              </p>
            </div>
          )}
        </div>
        <div className="mt-auto flex flex-col sm:flex-row gap-2 sm:items-center select-none">
          <div className="pricing flex flex-row lg:flex-col xl:flex-row gap-2 sm:items-center flex-wrap">
            {hasActiveDiscount ? (
              <>
                <span className="text-xl font-bold text-black">
                  ₹{discountedPrice}
                </span>
                <p className="text-sm font-normal text-black line-through opacity-50">
                  ₹{originalPrice}
                </p>
              </>
            ) : (
              <span className="text-xl font-bold text-black">
                ₹{originalPrice}
              </span>
            )}
            <p className="text-sm font-normal text-black">onwards/-</p>
          </div>
          <OrangeButton
            className="sm:ml-auto font-bold text-sm px-8 py-4"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/courses/${course?.slug}`);
            }}
          >
            View Details
          </OrangeButton>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
