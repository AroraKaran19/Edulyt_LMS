import { getErrorUIConfig } from "@/configs/errorUIConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { cn, fetcher } from "@/lib/utils";
import { Instructor } from "@/types";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import useSWR from "swr";
import Error from "../Error";
import { Loader2 } from "lucide-react";

const InstructorCard = ({
  instructorId,
  ...props
}: { instructorId: Instructor["_id"] } & {
  className?: string;
  style?: React.CSSProperties;
}) => {

  const { data, isLoading, error } = useSWR(ENDPOINTS.instructors.slug + instructorId, fetcher)
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
      href={`/instructors/${instructor.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")}`}
      className={cn(
        "instructor flex gap-1 items-center bg-[#EEEEEE] rounded-full p-1 text-xs font-bold text-text-primary select-none cursor-pointer max-w-[150px]",
        props.className
      )}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <Image
        src={instructor.profileImage || "/courseDefaultTestimonial.png"}
        alt={instructor.name}
        className="size-5 rounded-full flex-shrink-0"
        width={20}
        height={20}
        draggable={false}
        loading="eager"
        unoptimized
        priority
      />
      <span className="flex-1 text-ellipsis overflow-hidden whitespace-nowrap min-w-0">
        {instructor.name}
      </span>
    </Link>
  );
};

export default InstructorCard;
