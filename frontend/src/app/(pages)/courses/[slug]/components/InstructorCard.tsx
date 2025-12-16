import { Instructor } from "@/types";
import Image from "next/image";
import React from "react";
import { Star, Users } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const InstructorCard = ({
  instructor,
  ...props
}: { instructor: Instructor } & {
  className?: string;
  style?: React.CSSProperties;
}) => {
  const getDisplayName = () => {
    if (instructor.firstName && instructor.lastName) {
      return `${instructor.firstName} ${instructor.lastName}`;
    } else if (instructor.firstName) {
      return instructor.firstName;
    } else if (instructor.lastName) {
      return instructor.lastName;
    } else if (instructor.email) {
      return instructor.email;
    }
    return "Instructor";
  };

  const getSlug = () => {
    return `${instructor.firstName}${
      instructor.lastName ? "-" + instructor.lastName : ""
    }`
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  return (
    <Link
      href={`/instructor/${getSlug()}`}
      className={cn(
        "instructor-card w-full max-w-[500px] mx-auto h-full bg-white rounded-2xl flex flex-col p-3 border-2 border-gray-200 gap-2 hover:border-[#f77124] hover:shadow-[0_0_2px_3px_rgba(233,117,0,0.5)] hover:bg-linear-to-br from-white to-[#f77124]/5 transition-all duration-300 ease-in-out",
        props.className
      )}
      target="_blank"
      rel="noopener"
      title={`Click to view ${getDisplayName()}'s profile`}
    >
      <div className="card-top w-full flex items-center justify-center gap-2 lg:gap-4">
        <div className="instructor-image min-w-[30px] h-[50px] lg:h-[100px] aspect-square rounded-full flex items-center justify-center shrink-0">
          {instructor.profilePicture ? (
            <Image
              src={instructor.profilePicture}
              alt={getDisplayName()}
              width={100}
              height={100}
              draggable={false}
              className="object-cover select-none rounded-full"
            />
          ) : (
            <div className="w-full h-full select-none rounded-full bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <span className="text-white text-lg font-bold">
                {getDisplayName().charAt(0)}
                {getDisplayName().split(" ").slice(1).join(" ").charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div className="instructor-details text-base font-medium text-black flex flex-col items-start gap-1">
          <p className="instructor-name text-xs sm:text-sm lg:text-base font-bold flex items-center gap-4">
            <span className="whitespace-nowrap">{getDisplayName()}</span>
            {instructor.accounts.linkedin && (
              <span
                className="instructor-linkedin w-full flex items-center cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
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
          <div className="instructor-info flex flex-col gap-2">
            {instructor.field && (
              <p className="text-xs text-gray-500 whitespace-nowrap">
                {instructor.field}
              </p>
            )}
            {instructor.currentPosition && instructor.currentCompany && (
              <p className="text-xs text-gray-500 whitespace-nowrap">
                {instructor.currentPosition}
              </p>
            )}
            {instructor.currentCompany && (
              <p className="text-xs text-gray-500 whitespace-nowrap">
                {instructor.currentCompany}
              </p>
            )}
            <p className="rating text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap">
              <span className="flex items-center gap-1">
                <Star className="size-3 text-yellow-500 fill-yellow-500" />
                {instructor.rating || 0}{" "}
              </span>
              <span className="flex items-center gap-1">
                <Users className="size-3 text-yellow-500 fill-yellow-500" />
                {instructor.totalStudents || 0}{" "}
              </span>
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
