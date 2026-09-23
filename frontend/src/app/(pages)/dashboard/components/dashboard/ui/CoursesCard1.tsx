"use client";
import InstructorCard from "@/components/ui/course/InstructorCard";
import ProgressChart from "@/components/ui/charts/ProgressChart";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Course, Instructor } from "@/types";
import { Enrollment } from "@/types/enrollment";
import { Plus, BookOpen, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useCallback } from "react";

interface CoursesCard1Props {
  course?: Course | null;
  enrollment?: Enrollment;
}

/**
 * "Continue", or an inert "Unavailable" chip when the course has been disabled.
 * Module-level so it isn't re-created (and its subtree re-mounted) every render.
 */
const ContinueAction = ({
  disabled,
  className,
  onClick,
}: {
  disabled: boolean;
  className: string;
  onClick: () => void;
}) =>
  disabled ? (
    <span
      className={`inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-400 cursor-not-allowed select-none ${className}`}
      title="This course is currently unavailable"
    >
      Unavailable
    </span>
  ) : (
    <WhiteButton className={className} onClick={onClick}>
      Continue
    </WhiteButton>
  );

const CoursesCard1 = ({ course, enrollment }: CoursesCard1Props) => {
  const calculateProgress = useCallback((enrollment: Enrollment): number => {
    if (!enrollment.progress) return 0;
    return Math.round(enrollment.progress.overallCompletion || 0);
  }, []);

  const getCurrentLesson = useCallback((enrollment: Enrollment): { lesson: number; module: number } => {
    // This would ideally come from lastContentAccessed or progress tracking
    // For now, we'll calculate based on progress
    const progress = calculateProgress(enrollment);
    const totalModules = enrollment.progress?.totalModules || 1;
    const totalLessons = enrollment.progress?.totalLessons || 1;
    
    const currentModule = Math.ceil((progress / 100) * totalModules);
    const currentLesson = Math.ceil((progress / 100) * totalLessons);
    
    return {
      lesson: Math.max(1, currentLesson),
      module: Math.max(1, currentModule)
    };
  }, [calculateProgress]);

  const progress = enrollment ? calculateProgress(enrollment) : 0;
  const currentPosition = enrollment ? getCurrentLesson(enrollment) : { lesson: 1, module: 1 };

  // Course was deleted/unlinked — render a disabled "no longer available"
  // container (after hooks, so they're never conditionally skipped) instead of
  // crashing on course.thumbnail / course.title.
  if (!course) {
    const name = enrollment?.courseName || "Course no longer available";
    return (
      <div className="flex flex-col sm:flex-row w-full p-2 sm:p-1 border border-gray-200 rounded-lg items-stretch gap-3 opacity-80">
        <div className="flex items-center justify-center bg-gray-100 rounded-lg select-none w-full sm:w-[150px] h-[100px] shrink-0">
          <BookOpen className="w-8 h-8 text-gray-300" />
        </div>
        <div className="flex w-full flex-col gap-1.5 justify-center items-start min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-700/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            <AlertCircle className="w-3 h-3" /> Course no longer available
          </span>
          <h2 className="text-sm sm:text-base font-bold line-clamp-2 sm:line-clamp-1 text-ellipsis w-full text-gray-700">
            {name}
          </h2>
          <p className="text-[11px] text-gray-400">
            This course has been removed. Your enrollment is kept for records.
          </p>
        </div>
        <div className="flex items-center justify-end sm:pr-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-400 cursor-not-allowed select-none">
            Unavailable
          </span>
        </div>
      </div>
    );
  }

  // Course still exists but has been disabled. The watch page gates on
  // `isActive`, so "Continue" would dead-end — surface that up front instead of
  // letting the learner click into nothing.
  const isDisabled = course.isActive === false;

  const handleContinue = () => {
    if (isDisabled) return;
    if (course.slug) {
      window.open(`/programs/${course.slug}/watch`, '_blank');
    }
  };

  return (
    <div
      className={`flex flex-col sm:flex-row w-full p-2 sm:p-1 border border-gray-200 rounded-lg items-stretch gap-3 ${
        isDisabled ? "opacity-80" : ""
      }`}
    >
      {/* Image - responsive sizing */}
      <div className="relative w-full sm:w-[150px] shrink-0">
        <Image
          src={course.thumbnail || "/courses-demo-image.png"}
          alt={course.title || "Course thumbnail"}
          width={150}
          height={100}
          className="object-cover aspect-video rounded-lg select-none w-full sm:w-[150px] sm:h-[100px] h-auto"
          loading="lazy"
          quality={100}
          draggable={false}
        />
        {enrollment?.grantSource === "ca-voucher" && (
          <span
            className="absolute top-1.5 right-1.5 rounded-full bg-orange-500/90 px-2 py-0.5 text-[10px] font-semibold text-white border border-orange-600 backdrop-blur-sm"
            title="Unlocked with your Campus Ambassador voucher"
            aria-label="Unlocked with your Campus Ambassador voucher"
          >
            CA perk
          </span>
        )}
      </div>

      {/* Title and Instructors Section */}
      <div className="flex w-full flex-col gap-2 justify-center items-start min-w-0 flex-1">
        {isDisabled && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-700/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            <AlertCircle className="w-3 h-3" /> No longer available
          </span>
        )}
        <h2
          className={`text-sm sm:text-base font-bold line-clamp-2 sm:line-clamp-1 text-ellipsis w-full ${
            isDisabled ? "text-gray-700" : ""
          }`}
        >
          {course.title || "Untitled Course"}
        </h2>
        <div className="flex instructors gap-2 flex-wrap">
          {course.instructor && Array.isArray(course.instructor) ? (
            course.instructor.slice(0, 2).map((instructor, index) => (
              <InstructorCard
                key={index}
                instructor={instructor as Instructor}
              />
            ))
          ) : (
            <div className="text-xs text-gray-500">No instructors</div>
          )}
          {course.instructor && Array.isArray(course.instructor) && course.instructor.length > 2 && (
            <div className="instructor-count hidden sm:flex gap-0.25 items-center bg-[#EEEEEE] rounded-md p-1">
              <Plus className="w-3 h-3 text-text-primary" fill="#2B1508" />
              <span className="text-xs font-semibold text-text-primary">
                {course.instructor.length - 2}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress and Action Section - responsive layout */}
      <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 sm:gap-2 justify-between sm:justify-center items-stretch sm:items-end sm:pr-2">
        {/* Mobile: Show progress and lesson info in a row */}
        <div className="flex sm:hidden w-full gap-3 items-center justify-between">
          <div className="flex gap-2 items-center">
            <ProgressChart
              percentage={progress}
              primaryColor="#714ACA"
              secondaryColor="hsla(0,0%,100%,.55)"
              className="size-6"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-black">{progress}%</span>
              <span className="text-xs text-gray-500">Lesson {currentPosition.lesson}</span>
            </div>
          </div>
          <ContinueAction
            disabled={isDisabled}
            onClick={handleContinue}
            className="text-xs font-bold text-gray-500 px-3 py-1.5"
          />
        </div>

        {/* Desktop: Original layout */}
        <div className="hidden sm:flex w-full h-full gap-4 lg:gap-6 items-center justify-end">
          <div className="flex current-lesson w-max h-full flex-col justify-center items-end">
            <span className="text-sm font-semibold">Lesson {currentPosition.lesson}</span>
            <span className="text-xs text-gray-500 font-semibold">
              Module {currentPosition.module}
            </span>
          </div>
          <div className="h-1/2 w-0.25 bg-gray-300 shrink-0" />
          <div className="flex progress w-max h-full justify-center items-center gap-2">
            <span className="text-sm font-semibold shrink-0">
              <ProgressChart
                percentage={progress}
                primaryColor="#714ACA"
                secondaryColor="hsla(0,0%,100%,.55)"
                className="size-6.5"
              />
            </span>
            <div className="flex w-full h-full flex-col justify-center items-start">
              <span className="text-sm text-black font-semibold">{progress}%</span>
              <span className="text-xs text-gray-500 font-normal">
                Your Progress
              </span>
            </div>
          </div>
          <div className="h-1/2 w-0.25 bg-gray-300 shrink-0" />
          <ContinueAction
            disabled={isDisabled}
            onClick={handleContinue}
            className="w-max text-sm font-bold text-gray-500"
          />
        </div>
      </div>
    </div>
  );
};

export default CoursesCard1;
