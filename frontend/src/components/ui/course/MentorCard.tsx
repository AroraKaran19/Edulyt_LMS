"use client";
import { cn } from "@/lib/utils";
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
      className={cn("mentor flex gap-1 items-center bg-[#EEEEEE] rounded-full p-1 text-xs font-bold text-[#2B1508] select-none cursor-pointer", className)}
      onClick={() => router.push(`/mentors/${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`)}
    >
      <img
        src={image}
        alt={name}
        className="size-6 rounded-full"
      />
      <span>{name}</span>
    </div>
  );
};

export default MentorCard;
