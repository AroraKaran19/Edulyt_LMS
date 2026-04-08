"use client";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/utils/slugify";
import { Instructor } from "@/types";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const InstructorCard = ({
  instructor,
  ...props
}: { instructor: Partial<Instructor> } & {
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

  const getInitials = () => {
    if (instructor.firstName && instructor.lastName) {
      return `${instructor.firstName[0]}${instructor.lastName[0]}`.toUpperCase();
    } else if (instructor.firstName) {
      return instructor.firstName[0].toUpperCase();
    } else if (instructor.lastName) {
      return instructor.lastName[0].toUpperCase();
    } else if (instructor.email) {
      return instructor.email[0].toUpperCase();
    }
    return "I";
  };

  const getSlug = () => {
    if (instructor.slug) return instructor.slug;
    return slugify(getDisplayName());
  };

  return (
    <Link
      href={`/mentor/${getSlug()}`}
      className={cn(
        "instructor w-max flex gap-1 items-center bg-[#EEEEEE] rounded-full p-1 text-xs font-bold text-text-primary select-none cursor-pointer max-w-[150px]",
        props.className
      )}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {instructor.profilePicture ? (
        <Image
          src={instructor.profilePicture}
          alt={getDisplayName()}
          className="size-5 rounded-full shrink-0"
          width={20}
          height={20}
          draggable={false}
          loading="eager"
          unoptimized
          priority
        />
      ) : (
        <div className="size-5 rounded-full shrink-0 bg-orange-500 flex items-center justify-center text-white text-[10px] font-bold">
          {getInitials()}
        </div>
      )}
      <span className="flex-1 text-ellipsis overflow-hidden whitespace-nowrap min-w-0">
        {getDisplayName()}
      </span>
    </Link>
  );
};

export default InstructorCard;
