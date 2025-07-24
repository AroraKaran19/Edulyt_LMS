import React from "react";
import { Course, Instructor } from "@/types";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import BestsellerBadge from "@/components/ui/course/BestsellerBadge";
import RatingContainer from "@/components/ui/course/RatingContainer";
import DiscountBadge from "@/components/ui/course/DiscountBadge";
import InstructorCard from "@/components/ui/course/InstructorCard";
import OrangeButton from "@/components/ui/OrangeButton";
import { useRouter } from "next/navigation";
import Image from "next/image";

const TopCourseCard = ({
  course,
  ...props
}: { course: Course } & {
  className?: string;
  style?: React.CSSProperties;
}) => {
  const router = useRouter();

  return (
    <div
      className={cn(
        "top-course-card h-full bg-white rounded-2xl shadow-[0_0_2px_5px_rgba(247,113,36,0.3)] p-3 cursor-default flex flex-col",
        props.className
      )}
    >
      <div className="course-card-image rounded-2xl h-1/2 w-full relative">
        <Image
          src={course.thumbnail || "/CourseCardDemo.jpg"}
          alt={course.title}
          className="rounded-2xl max-h-[200px] select-none w-full h-full"
          draggable={false}
          width={100}
          height={100}
          priority
          loading="eager"
        />
        {course.discount && course.discount.isActive && (
          <DiscountBadge
            discount={course.discount.value}
            className="absolute top-2 right-2"
          />
        )}
      </div>
      <BestsellerBadge enrollStudents={course.enrolledCount} className="mt-3" />
      <p
        className={cn(
          "text-2xl font-bold mt-2 font-coolvetica select-none text-balance"
        )}
      >
        {course.title}
      </p>
      <RatingContainer
        ratings={course.featuredReviews}
        className="mt-2"
        courseId={course.slug}
      />
      <div
        className={cn("instructors mt-2 flex gap-2 items-center select-none")}
      >
        {course.instructor.map((instructor: Instructor, index: number) => {
          if (index < 2) {
            return <InstructorCard key={index} instructor={instructor} />;
          }
        })}
        {course.instructor.length > 2 && (
          <div className="instructor flex items-center bg-[#EEEEEE] rounded-full p-1">
            <Plus className="w-3 h-3 text-text-primary" fill="#2B1508" />
            <p className="text-xs font-bold text-text-primary">
              {course.instructor.length - 2}
            </p>
          </div>
        )}
      </div>
      <div className="price mt-auto flex flex-col sm:flex-row gap-2 sm:items-center select-none">
        <div className="pricing flex flex-row lg:flex-col xl:flex-row gap-2 sm:items-center flex-wrap">
          <p className="text-xl font-bold text-black">
            ₹
            {course.discount && course.discount.isActive
              ? Math.round(
                  (course.plans.essential?.price ||
                    course.plans.elite?.price ||
                    0 -
                      (course.plans.essential?.price ||
                        course.plans.elite?.price ||
                        0) *
                        (course.discount.value / 100)) * 100
                ) / 100
              : course.plans.essential?.price || course.plans.elite?.price || 0}
          </p>
          {course.discount && course.discount.isActive && (
            <span className="text-sm font-normal text-black line-through opacity-50">
              ₹{course.plans.essential?.price || course.plans.elite?.price || 0}
            </span>
          )}
          <p className="text-sm font-normal text-black">onwards/-</p>
        </div>
        <OrangeButton
          className="sm:ml-auto font-bold text-sm px-8 py-4"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/courses/${course.slug}`);
          }}
        >
          View Details
        </OrangeButton>
      </div>
    </div>
  );
};

export default TopCourseCard;
