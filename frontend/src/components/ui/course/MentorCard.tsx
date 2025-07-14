"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

const MentorCard = ({
  image,
  name,
  className,
}: {
  image: string;
  name: string;
  className?: string;
}) => {
  const router = useRouter();

  return (
    <div
      className={cn(
        "mentor flex gap-1 items-center bg-[#EEEEEE] rounded-full p-1 text-xs font-bold text-[#2B1508] select-none cursor-pointer max-w-[150px]",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        router.push(
          `/mentors/${name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")}`
        );
      }}
    >
      <Image
        src={image}
        alt={name}
        className="size-5 rounded-full flex-shrink-0"
        width={20}
        height={20}
        draggable={false}
        loading="lazy"
        unoptimized
        priority
      />
      <span className="flex-1 text-ellipsis overflow-hidden whitespace-nowrap min-w-0">
        {name}
      </span>
    </div>
  );
};

export default MentorCard;
