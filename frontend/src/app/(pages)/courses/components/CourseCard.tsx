import BestsellerBadge from "@/components/ui/course/BestsellerBadge";
import DiscountBadge from "@/components/ui/course/DiscountBadge";
import MentorCard from "@/components/ui/course/MentorCard";
import RatingContainer from "@/components/ui/course/RatingContainer";
import OrangeButton from "@/components/ui/OrangeButton";
import { cn } from "@/lib/utils";
import { CourseCardProps } from "@/types";
import { Plus } from "lucide-react";
import React from "react";

const CourseCard = ({
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
  style,
}: CourseCardProps) => {
  return (
    <div
      className={cn(
        "course-card w-full bg-white rounded-2xl p-3 flex items-stretch border-2 border-[rgb(233,117,0)] shadow-[0_0_2px_4px_rgba(233,117,0,0.3)] gap-4",
        className
      )}
      style={style}
    >
      <div className="course-image w-2/5 h-full rounded-2xl overflow-hidden relative">
        <img
          src={image}
          alt={title}
          className="rounded-2xl select-none w-full h-full object-cover opacity-90"
          draggable={false}
        />
        {discount && (
          <DiscountBadge
            discount={discount}
            className="absolute top-2 right-2"
          />
        )}
      </div>
      <div className="course-content w-3/5 h-full flex flex-col">
        {bestSeller && <BestsellerBadge enrollStudents={enrollStudents} />}
        <p
          className="text-2xl font-bold mt-2 font-coolvetica select-none"
        >
          {title}
        </p>
        <RatingContainer
          rating={rating}
          totalRating={totalRating}
          className="mt-2 text-xs"
          courseId={id}
        />
        <div className="mentors mt-2 flex gap-2 select-none mb-2 flex-col sm:flex-row items-start sm:items-center">
          {mentors.map((mentor, index) => {
            if (index < 2) {
              return (
                <MentorCard
                  key={index}
                  image={mentor.image}
                  name={mentor.name}
                />
              );
            }
          })}
          {mentors.length > 2 && (
            <div className="mentor-count flex gap-0.25 items-center bg-[#EEEEEE] rounded-full p-1">
              <Plus className="w-3 h-3 text-[#2B1508]" fill="#2B1508" />
              <p className="text-xs font-bold text-[#2B1508]">
                {mentors.length - 2}
              </p>
            </div>
          )}
        </div>
        <div className="price mt-auto flex flex-col sm:flex-row gap-2 sm:items-center select-none">
          <div className="pricing flex flex-row lg:flex-col xl:flex-row gap-2 sm:items-center">
            <p className="text-xl font-bold text-black">${startingPrice}</p>
            <span className="text-sm font-normal text-black line-through opacity-50">
              ${startingPrice + 100}
            </span>
          </div>
          <OrangeButton className="sm:ml-auto font-bold text-sm px-8 py-4">
            Enroll Now
          </OrangeButton>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
