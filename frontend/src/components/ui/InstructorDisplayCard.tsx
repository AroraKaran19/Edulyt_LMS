import React from "react";
import { CourseInstructor } from "@/types";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface InstructorDisplayCardProps {
  instructor: CourseInstructor;
  className?: string;
}

const InstructorDisplayCard: React.FC<InstructorDisplayCardProps> = ({
  instructor,
  className
}) => {

  return (
    <div className={cn(
      "flex items-center gap-2 px-2 py-1 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors",
      className
    )}>
      <div className="size-5 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
        {instructor.profilePicture ? (
          <Image
            src={instructor.profilePicture}
            alt={instructor.fullName}
            width={20}
            height={20}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
            <span className="text-[8px] text-gray-600 font-medium">
              {instructor.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <span className="text-xs text-gray-700 font-medium truncate max-w-[80px]">
        {instructor.fullName}
      </span>
    </div>
  );
};

export default InstructorDisplayCard; 