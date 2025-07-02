import React from "react";
import { CourseCardProps } from "@/types";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import BestsellerBadge from "@/components/ui/course/BestsellerBadge";
import RatingContainer from "@/components/ui/course/RatingContainer";
import DiscountBadge from "@/components/ui/course/DiscountBadge";
import MentorCard from "@/components/ui/course/MentorCard";
import OrangeButton from "@/components/ui/OrangeButton";

const TopCourseCard = ({
  id,
  image,
  title,
  bestSeller,
  enrollStudents,
  rating,
  totalRating,
  mentors,
  startingPrice,
  discount,
  className,
}: CourseCardProps) => {
  return (
    <div
      className={cn(
        "top-course-card min-h-[420px] bg-white rounded-2xl shadow-[0_0_2px_5px_rgba(247,113,36,0.3)] p-3",
        className
      )}
    >
      <div className="course-card-image rounded-2xl h-1/2 w-full relative">
        <img
          src={image}
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
      {bestSeller && (
        <BestsellerBadge enrollStudents={enrollStudents} className="mt-3" />
      )}
      <p className={cn("text-2xl font-bold mt-2 font-coolvetica select-none")}>
        {title}
      </p>
      <RatingContainer
        rating={rating}
        totalRating={totalRating}
        className="mt-2"
        courseId={id}
      />
      <div className={cn("mentors mt-2 flex gap-2 items-center select-none")}>
        {mentors.map((mentor, index) => {
          if (index < 2) {
            return (
              <MentorCard key={index} image={mentor.image} name={mentor.name} />
            );
          }
        })}
        {mentors.length > 2 && (
          <div className="mentor flex items-center bg-[#EEEEEE] rounded-full p-1">
            <Plus className="w-3 h-3 text-[#2B1508]" fill="#2B1508" />
            <p className="text-xs font-bold text-[#2B1508]">
              {mentors.length - 2}
            </p>
          </div>
        )}
      </div>
      <div className={cn("price mt-4 flex gap-2 items-center select-none")}>
        <p className="text-xl font-bold text-black">${startingPrice}</p>
        <span className="text-sm font-normal text-black line-through opacity-50">
          ${startingPrice + 100}
        </span>
        <OrangeButton className="ml-auto">View Details</OrangeButton>
      </div>
    </div>
  );
};

export default TopCourseCard;
