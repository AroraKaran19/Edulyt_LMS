import { cn } from "@/lib/utils";
import { Instructor } from "@/types";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const InstructorCard = ({
  instructor,
  ...props
}: { instructor: Instructor } & {
  className?: string;
  style?: React.CSSProperties;
}) => {

  return (
    <Link
      href={`/instructors/${instructor?.firstName} ${instructor?.lastName
        ?.toLowerCase()
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
        src={instructor.profilePicture || "/courseDefaultTestimonial.png"}
        alt={instructor.firstName + " " + instructor.lastName}
        className="size-5 rounded-full flex-shrink-0"
        width={20}
        height={20}
        draggable={false}
        loading="eager"
        unoptimized
        priority
      />
      <span className="flex-1 text-ellipsis overflow-hidden whitespace-nowrap min-w-0">
        {instructor.firstName + " " + instructor.lastName}
      </span>
    </Link>
  );
};

export default InstructorCard;
