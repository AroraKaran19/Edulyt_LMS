import React from "react";
import { Course } from "@/types";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import BestsellerBadge from "@/components/ui/course/BestsellerBadge";
import RatingContainer from "@/components/ui/course/RatingContainer";
import DiscountBadge from "@/components/ui/course/DiscountBadge";
import MentorCard from "@/components/ui/course/MentorCard";
import OrangeButton from "@/components/ui/OrangeButton";
import { useRouter } from "next/navigation";

const TopCourseCard = ({
  thumbnail,
  title,
  enrolledCount,
  instructor,
  totalRatings,
  featuredReviews,
  plan,
  discount,
  slug,
  ...props
}: Course & { className?: string; style?: React.CSSProperties }) => {
  
  const router = useRouter();

  return (
    <div
      className={cn(
        "top-course-card min-h-[420px] bg-white rounded-2xl shadow-[0_0_2px_5px_rgba(247,113,36,0.3)] p-3 cursor-default",
        props.className
      )}
    >
      <div className="course-card-image rounded-2xl h-1/2 w-full relative">
        <img
          src={thumbnail}
          alt={title}
          className="rounded-2xl max-h-[200px] select-none w-full h-full object-cover"
          draggable={false}
        />
        {discount && (
          <DiscountBadge
            discount={discount}
            className="absolute top-2 right-2"
          />
        )}
      </div>
      <BestsellerBadge enrollStudents={enrolledCount} className="mt-3" />
      <p
        className={cn(
          "text-2xl font-bold mt-2 font-coolvetica select-none text-balance"
        )}
      >
        {title}
      </p>
      <RatingContainer
        rating={totalRatings}
        ratingCount={featuredReviews.length}
        className="mt-2"
        courseId={slug}
      />
      <div className={cn("mentors mt-2 flex gap-2 items-center select-none")}>
        {instructor.map((mentor, index) => {
          if (index < 2) {
            return (
              <MentorCard
                key={index}
                image={mentor?.profileImage || ""}
                name={mentor.name}
              />
            );
          }
        })}
        {instructor.length > 2 && (
          <div className="mentor flex items-center bg-[#EEEEEE] rounded-full p-1">
            <Plus className="w-3 h-3 text-[#2B1508]" fill="#2B1508" />
            <p className="text-xs font-bold text-[#2B1508]">
              {instructor.length - 2}
            </p>
          </div>
        )}
      </div>
      <div className="price mt-auto flex flex-col sm:flex-row gap-2 sm:items-center select-none">
        <div className="pricing flex flex-row lg:flex-col xl:flex-row gap-2 sm:items-center flex-wrap">
          <p className="text-xl font-bold text-black">
            $
            {plan.collegeStudents.price -
              (discount
                ? Math.round(plan.collegeStudents.price * (discount / 100))
                : 0)}
          </p>
          {discount && (
            <span className="text-sm font-normal text-black line-through opacity-50">
              ${plan.collegeStudents.price}
            </span>
          )}
          <p className="text-sm font-normal text-black">onwards/-</p>
        </div>
        <OrangeButton
          className="sm:ml-auto font-bold text-sm px-8 py-4"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/courses/${slug}`);
          }}
        >
          Enroll Now
        </OrangeButton>
      </div>
    </div>
  );
};

export default TopCourseCard;
