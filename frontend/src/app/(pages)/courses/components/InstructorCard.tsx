import { CourseInstructor } from "@/types";
import Image from "next/image";
import React from "react";
import { Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const InstructorCard = ({
  instructor,
  ...props
}: { instructor: CourseInstructor } & {
  className?: string;
  style?: React.CSSProperties;
}) => {

  return (
    <Link
      href={`/instructors/${instructor._id}`}
      className={cn(
        "instructor-card h-full bg-white rounded-2xl flex flex-col p-3 border-2 border-gray-200 gap-2 hover:border-[#f77124] hover:shadow-[0_0_2px_3px_rgba(233,117,0,0.5)] hover:bg-gradient-to-br from-[#fff] to-[#f77124]/5 transition-all duration-300 ease-in-out",
        props.className
      )}
      target="_blank"
      rel="noopener"
      title={`Click to view ${instructor.name}'s profile`}
    >
      <div className="card-top w-full flex items-center gap-2 lg:gap-4 justify-center">
        <div className="instructor-image min-w-[30px] max-h-[50px] lg:max-h-[100px] aspect-square rounded-full flex items-center justify-center shrink-0">
          <Image
            src={instructor.profileImage || "/courseDefaultTestimonial.png"}
            alt={instructor.name || "Edulyt Instructor"}
            width={100}
            height={100}
            draggable={false}
            className="object-cover select-none rounded-full"
          />
        </div>
        <div className="instructor-details w-max text-base font-medium text-black flex flex-col gap-1">
          <p className="instructor-name text-xs sm:text-sm lg:text-base font-bold flex items-center gap-4">
            <span className="whitespace-nowrap">{instructor.name}</span>
            {instructor.linkedinUrl && (
              <span
                className="instructor-linkedin w-full flex items-center cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(instructor.linkedinUrl, "_blank");
                }}
              >
                <Image
                  src="/linkedin-icon.svg"
                  alt="Linkedin Icon"
                  width={16}
                  height={16}
                  className="size-4 text-blue-500"
                />
              </span>
            )}
          </p>
          <div className="instructor-info flex items-center gap-2 flex-wrap">
            <p className="text-xs text-gray-500 whitespace-nowrap">
              {instructor.currentPosition} at {instructor.currentCompany}
            </p>
            <p className="rating text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap">
              <Star className="size-3 text-yellow-500 fill-yellow-500" />
              {instructor.rating}{" "}
              {instructor.totalStudents && instructor.totalStudents > 1 ? `students` : `student`}
            </p>
          </div>
        </div>
      </div>
      <div className="card-bottom w-full flex justify-center">
        <p className="text-sm text-gray-500 line-clamp-2 lg:line-clamp-3 text-balance">
          {instructor.bio}
        </p>
      </div>
    </Link>
  );
};

export default InstructorCard;
