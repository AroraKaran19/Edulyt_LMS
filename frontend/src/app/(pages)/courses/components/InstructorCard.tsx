"use client";
import { Instructor } from "@/types";
import Image from "next/image";
import React from "react";
import { Loader2, Star } from "lucide-react";
import Link from "next/link";
import { cn, fetcher } from "@/lib/utils";
import useSWR from "swr";
import { ENDPOINTS } from "@/constants/endpoints";
import Error from "@/components/ui/Error";
import { getErrorUIConfig } from "@/configs/errorUIConfig";

const InstructorCard = ({
  instructorId,
  ...props
}: { instructorId: Instructor["_id"] } & {
  className?: string;
  style?: React.CSSProperties;
}) => {
  const { data, isLoading, error } = useSWR(
    ENDPOINTS.instructors.slug + instructorId,
    fetcher
  );
  const instructor: Instructor = data?.data.instructor || {};

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#f77124]" />
          <p className="text-gray-600">Loading instructor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorConfig = getErrorUIConfig(error);
    return (
      <Error
        icon={errorConfig.icon}
        iconSize="lg"
        iconColor={errorConfig.iconColor}
        title={errorConfig.title}
        description={errorConfig.description}
        containerHeight="h-64"
      />
    );
  }

  if (!instructor) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-gray-600">No instructor found.</p>
        </div>
      </div>
    );
  }

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
              {instructor.currentPosition
                ? `${instructor.currentPosition} at ${instructor.currentCompany}`
                : `${instructor.experience} of experience`}
            </p>
            <p className="rating text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap">
              <Star className="size-3 text-yellow-500 fill-yellow-500" />
              {instructor.rating}{" "}
              {instructor.totalStudents > 1 ? `students` : `student`}
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
