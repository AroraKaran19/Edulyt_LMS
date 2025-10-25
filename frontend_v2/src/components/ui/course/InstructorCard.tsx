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
    const name = getDisplayName();
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  return (
    <Link
      href={`/instructors/${getSlug()}`}
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
        alt={getDisplayName()}
        className="size-5 rounded-full shrink-0"
        width={20}
        height={20}
        draggable={false}
        loading="eager"
        unoptimized
        priority
      />
      <span className="flex-1 text-ellipsis overflow-hidden whitespace-nowrap min-w-0">
        {getDisplayName()}
      </span>
    </Link>
  );
};

export default InstructorCard;
