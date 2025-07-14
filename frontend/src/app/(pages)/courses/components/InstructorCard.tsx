"use client";
import { Instructor } from "@/types";
import Image from "next/image";
import React from "react";
import { Star } from "lucide-react";
import Link from "next/link";

const InstructorCard = ({ instructor }: { instructor: Instructor }) => {
  return (
    <Link
      href={`/instructor/${instructor.id}`}
      className="instructor-card h-full bg-white rounded-2xl flex flex-col p-3 border-2 border-gray-200 gap-2 hover:border-[#f77124] hover:shadow-[0_0_2px_3px_rgba(233,117,0,0.5)] hover:bg-gradient-to-br from-[#fff] to-[#f77124]/5 transition-all duration-300 ease-in-out"
      target="_blank"
      rel="noopener"
      title={`Click to view ${instructor.name}'s profile`}
    >
      <div className="card-top w-full flex items-center gap-2 lg:gap-4 justify-center">
        <div className="instructor-image min-w-[30px] max-h-[50px] lg:max-h-[100px] aspect-square rounded-full flex items-center justify-center shrink-0">
          <Image
            src={instructor.profileImage || "/courseDefaultTestimonial.png"}
            alt={instructor.name || "Instructor Image"}
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
                onClick={() => window.open(instructor.linkedinUrl, "_blank")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="size-4 text-blue-500"
                  viewBox="0 0 16 16"
                >
                  <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" />
                </svg>
              </span>
            )}
          </p>
          <div className="instructor-info flex items-center gap-2 flex-wrap">
            <p className="experience text-xs text-gray-500 whitespace-nowrap">
              {instructor.experience} of experience
            </p>
            <p className="rating text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap">
              <Star className="size-3 text-yellow-500 fill-yellow-500" />
              {instructor.rating} ({instructor.totalStudents} students)
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
