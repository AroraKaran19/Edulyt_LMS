import React from "react";
import { CourseCardProps } from "@/types";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

const CourseCard = ({
  image,
  title,
  bestSeller,
  enrollStudents,
  rating,
  totalRating,
  mentors,
  startingPrice,
  className,
}: CourseCardProps) => {
  return (
    <div
      className={cn(
        "course-card h-[420px] bg-white rounded-2xl shadow-[0_0_2px_5px_rgba(247,113,36,0.3)] p-3",
        className
      )}
    >
      <div className="course-card-image rounded-2xl h-1/2 w-full">
        <img
          src={image}
          alt={title}
          className="rounded-2xl select-none w-full h-full object-cover"
          draggable={false}
        />
      </div>
      {bestSeller && (
        <div
          className={cn(
            "best-seller-badge mt-3 px-2 bg-[linear-gradient(-270deg,rgba(247,191,36,0.4)_0%,rgba(255,217,195,0.23)_100%)] flex gap-2 items-center select-none"
          )}
        >
          <p className="text-[#F7AD24] text-sm font-bold">Best seller</p>
          <span className="text-[#f7ad2499] text-xs font-bold">
            (enrolled by {enrollStudents} students)
          </span>
        </div>
      )}
      <p className={cn("text-2xl font-bold mt-2 font-coolvetica select-none")}>
        {title}
      </p>
      <div className="rating mt-2 flex gap-2 items-center select-none">
        <Star className="w-4 h-4 text-[#F7AD24]" fill="#F7AD24" />
        <span className="text-sm font-bold text-[#F7AD24]">
          {rating} Rating
        </span>
        <span className="text-sm font-normal text-gray-500">
          (more than {totalRating} reviews)
        </span>
      </div>
      <div className={cn("mentors mt-2 flex gap-2 items-center select-none")}>
        {mentors.map((mentor, index) => {
          if (index < 2) {
            return (
              <div
                className="mentor flex gap-1 items-center bg-[#EEEEEE] rounded-full p-1"
                key={index}
              >
                <img
                  src={mentor.image}
                  alt={mentor.name}
                  className="size-6 rounded-full"
                />
                <p className="text-xs font-bold text-[#2B1508]">
                  {mentor.name}
                </p>
              </div>
            );
          }
        })}
        {mentors.length > 2 && (
          <div className="mentor flex gap-1 items-center bg-[#EEEEEE] rounded-full p-1">
            <p className="text-xs font-bold text-[#2B1508]">
              +{mentors.length - 2}
            </p>
          </div>
        )}
      </div>
      <div className={cn("price mt-4 flex gap-2 items-center select-none")}>
        <p className="text-2xl font-bold text-black">${startingPrice}</p>
        <span className="text-xl font-normal text-black line-through">
          ${startingPrice + 100}
        </span>
      </div>
    </div>
  );
};

export default CourseCard;
