"use client";
import { Course } from "@/types";
import { Enrollment } from "@/types/enrollment";
import ImageComponent from "@/components/ui/ImageComponent";
import { Download, Clock, BookOpen, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  course: Course;
  enrollment: Enrollment;
  progress: number;
  showCertificate: boolean;
}

const CourseCard = ({
  course,
  enrollment,
  progress,
  showCertificate,
}: CourseCardProps) => {
  const isTrial = enrollment.isTrial;
  const isExpired =
    isTrial && enrollment.trialExpiresAt
      ? new Date(enrollment.trialExpiresAt) < new Date()
      : false;

  // Get category name(s)
  const getCategoryName = (): string => {
    if (!course.category) return "Course";
    if (Array.isArray(course.category)) {
      const firstItem = course.category[0];
      if (
        typeof firstItem === "object" &&
        firstItem !== null &&
        "name" in firstItem
      ) {
        return course.category.map((c: any) => c.name || String(c)).join(", ");
      }
      // Ensure we always return a string
      const firstCategory = course.category[0];
      if (typeof firstCategory === "string") {
        return firstCategory;
      }
      if (
        typeof firstCategory === "object" &&
        firstCategory !== null &&
        "name" in firstCategory
      ) {
        return (firstCategory as any).name || "Course";
      }
      return String(firstCategory || "Course");
    }
    // Handle case where category might be an object
    if (
      typeof course.category === "object" &&
      course.category !== null &&
      "name" in course.category
    ) {
      return (course.category as any).name || "Course";
    }
    return String(course.category);
  };

  // Get instructor name(s)
  const getInstructors = () => {
    if (!course.instructor) {
      return [{ name: "Instructor", profilePicture: "/user.svg" }];
    }

    // Handle array of instructors
    if (Array.isArray(course.instructor)) {
      if (course.instructor.length === 0) {
        return [{ name: "Instructor", profilePicture: "/user.svg" }];
      }

      return course.instructor.slice(0, 2).map((instructor: any) => {
        // If instructor is a populated object
        if (typeof instructor === "object" && instructor !== null) {
          const firstName = instructor.firstName || "";
          const lastName = instructor.lastName || "";
          const fullName =
            [firstName, lastName].filter(Boolean).join(" ") || "Instructor";

          return {
            name: fullName,
            profilePicture: instructor.profilePicture || "/user.svg",
          };
        }

        // If instructor is a string ID (not populated)
        return {
          name: "Instructor",
          profilePicture: "/user.svg",
        };
      });
    }

    // Handle single instructor (shouldn't happen based on schema, but handle it)
    if (typeof course.instructor === "object" && course.instructor !== null) {
      const firstName = (course.instructor as any).firstName || "";
      const lastName = (course.instructor as any).lastName || "";
      const fullName =
        [firstName, lastName].filter(Boolean).join(" ") || "Instructor";

      return [
        {
          name: fullName,
          profilePicture:
            (course.instructor as any).profilePicture || "/user.svg",
        },
      ];
    }

    // Fallback
    return [{ name: "Instructor", profilePicture: "/user.svg" }];
  };

  const instructors = getInstructors();
  const categoryName = getCategoryName();

  // Helper function to get initials from a name
  const getInitials = (name: string): string => {
    if (!name || name === "Instructor") return "I";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  // Helper function to check if profile picture is valid
  const hasValidProfilePicture = (
    profilePicture: string | undefined
  ): boolean => {
    return (
      !!profilePicture &&
      profilePicture !== "/user.svg" &&
      profilePicture.trim() !== ""
    );
  };

  return (
    <div className="group bg-white border border-gray-200 rounded-xl flex flex-col h-full shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Image Section */}
      <div className="relative w-full aspect-video overflow-hidden bg-gray-100">
        <ImageComponent
          src={course.thumbnail || "/courses-demo-image.png"}
          alt={course.title || "Course thumbnail"}
          width={400}
          height={225}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {/* Trial Badge */}
          {isTrial && (
            <div
              className={cn(
                "px-3 py-1.5 w-fit rounded-full text-xs font-semibold backdrop-blur-sm border",
                isExpired
                  ? "bg-red-500/90 text-white border-red-600"
                  : "bg-orange-500/90 text-white border-orange-600"
              )}
            >
              {isExpired ? "Trial Expired" : "Trial"}
            </div>
          )}

          {/* Duration & Category Badge */}
          <div className="px-3 py-1.5 bg-black/70 text-white text-xs rounded-full backdrop-blur-sm flex items-center gap-1.5 font-medium">
            <Clock className="w-3 h-3" />
            <span className="hidden sm:inline">
              {course.duration || "N/A"} Duration
            </span>
            <span className="sm:hidden">{course.duration || "N/A"}</span>
            <span>•</span>
            <BookOpen className="w-3 h-3" />
            <span className="hidden sm:inline truncate max-w-[100px]">
              {categoryName}
            </span>
            <span className="sm:hidden truncate max-w-[60px]">
              {categoryName}
            </span>
          </div>
        </div>

        {/* Progress Overlay */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200/50">
            <div
              className={cn(
                "h-full transition-all duration-500",
                progress === 100
                  ? "bg-green-500"
                  : progress > 0
                  ? "bg-purple-500"
                  : "bg-gray-300"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {/* Title */}
        <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-3 line-clamp-2 min-h-10 group-hover:text-orange-600 transition-colors">
          {course.title || "Untitled Course"}
        </h3>

        {/* Instructors */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {instructors.map((instructor, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 bg-gray-100 rounded-full px-2 py-1 border border-gray-200 shrink-0"
            >
              {hasValidProfilePicture(instructor.profilePicture) ? (
                <ImageComponent
                  src={instructor.profilePicture}
                  alt={instructor.name}
                  width={20}
                  height={20}
                  className="w-5 h-5 rounded-full border border-white"
                />
              ) : (
                <div className="w-5 h-5 rounded-full border border-white bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-[10px] font-semibold">
                  {getInitials(instructor.name)}
                </div>
              )}
              <span className="text-xs text-gray-700 font-medium hidden sm:inline">
                {instructor.name}
              </span>
              <span className="text-xs text-gray-700 font-medium sm:hidden">
                {instructor.name.charAt(0)}
              </span>
            </div>
          ))}
          {course.instructor &&
            Array.isArray(course.instructor) &&
            course.instructor.length > 2 && (
              <div className="flex items-center justify-center bg-gray-100 rounded-full px-2 py-1 border border-gray-200 shrink-0">
                <span className="text-xs text-gray-700 font-medium">
                  +{course.instructor.length - 2}
                </span>
              </div>
            )}
        </div>

        {/* Progress & Action Section */}
        <div className="mt-auto flex items-center gap-3 pt-3 border-t border-gray-100">
          {/* Progress Circle */}
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 -rotate-90"
              viewBox="0 0 40 40"
            >
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke="#F3F4F6"
                strokeWidth="3"
              />
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke={
                  progress === 100
                    ? "#22C55E"
                    : progress > 0
                    ? "#A259FF"
                    : "#E5E7EB"
                }
                strokeWidth="3"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18 * (1 - progress / 100)}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] sm:text-xs font-bold text-gray-900">
                {progress}%
              </span>
            </div>
          </div>

          {/* Progress Text */}
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-gray-900">
              {progress}% Complete
            </span>
            <span className="text-[10px] text-gray-500 truncate">
              {progress === 100
                ? "Course completed"
                : progress > 0
                ? "In progress"
                : "Not started"}
            </span>
          </div>

          {/* Action Button */}
          <div className="ml-auto shrink-0">
            {isExpired ? (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-semibold hidden sm:inline">
                  Expired
                </span>
                <span className="text-xs font-semibold sm:hidden">Exp</span>
              </div>
            ) : progress === 100 && showCertificate ? (
              <Link
                href={`/courses/${course.slug}/watch`}
                className="flex items-center gap-1.5 sm:gap-2 bg-linear-to-b from-orange-500 to-orange-600 text-white rounded-lg px-3 sm:px-4 py-2 text-xs font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Certificate</span>
                <span className="sm:hidden">Cert</span>
              </Link>
            ) : progress > 0 ? (
              <Link
                href={`/courses/${course.slug}/watch`}
                className="flex items-center gap-1.5 sm:gap-2 bg-white border border-gray-300 text-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow"
              >
                Continue
              </Link>
            ) : (
              <Link
                href={`/courses/${course.slug}/watch`}
                className="flex items-center gap-1.5 sm:gap-2 bg-white border border-gray-300 text-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow"
              >
                Start
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
