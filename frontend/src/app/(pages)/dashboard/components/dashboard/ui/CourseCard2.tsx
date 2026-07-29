"use client";
import InstructorCard from "@/components/ui/course/InstructorCard";
import ProgressChart from "@/components/ui/charts/ProgressChart";
import { Course, CourseModule, Instructor } from "@/types";
import { Enrollment } from "@/types/enrollment";
import { Plus, BookOpen, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

interface CourseCard2Props {
  course?: Course | null;
  enrollment?: Enrollment;
}

const CourseCard2 = ({ course, enrollment }: CourseCard2Props) => {
  const router = useRouter();

  const calculateProgress = useCallback((enrollment: Enrollment): number => {
    if (!enrollment?.progress) return 0;
    return Math.round(enrollment.progress.overallCompletion || 0);
  }, []);

  // Course was deleted/unlinked — render a disabled "no longer available"
  // container (after hooks, so they're never conditionally skipped) instead of
  // crashing on course.thumbnail / course.title.
  if (!course) {
    const name = enrollment?.courseName || "Course no longer available";
    return (
      <div className="flex course-card-2 w-full h-full flex-col gap-4 rounded-lg border border-gray-200 p-3 opacity-80 cursor-default">
        <div className="image-container relative w-full">
          <div className="flex aspect-video max-h-[132px] w-full items-center justify-center rounded-lg bg-gray-100">
            <BookOpen className="h-8 w-8 text-gray-300" />
          </div>
          <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-gray-700/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            <AlertCircle className="h-3 w-3" /> Unavailable
          </div>
        </div>
        <div className="flex h-full w-full flex-col gap-1">
          <h2 className="line-clamp-1 text-ellipsis text-base font-bold text-gray-700">
            {name}
          </h2>
          <p className="text-[11px] text-gray-400">
            Course no longer available, enrollment kept for records.
          </p>
        </div>
      </div>
    );
  }

  const lessonCountFromApi = (course as unknown as { lessonCount?: number })
    ?.lessonCount;

  const totalLessons =
    typeof lessonCountFromApi === "number"
      ? lessonCountFromApi
      : ((course?.modules as CourseModule[]) || []).reduce(
          (acc, module) => acc + (module.lessons || []).length,
          0,
        );

  const progress = enrollment ? calculateProgress(enrollment) : 0;

  // Disabled course: the watch page 404s, so the card must stop leading there
  // (same treatment as the My Programs card).
  const isCourseDisabled = course.isActive === false;

  const handleClick = () => {
    if (isCourseDisabled) return;
    if (course.slug) {
      router.push(`/programs/${course.slug}/watch`);
    }
  };

  return (
    <div
      className={cn(
        "flex course-card-2 w-full h-full flex-col gap-4 border border-gray-200 rounded-lg p-3 transition-shadow",
        isCourseDisabled
          ? "opacity-80 cursor-default"
          : "cursor-pointer hover:shadow-md",
      )}
      onClick={handleClick}
    >
      <div className="image-container w-full relative">
        <Image
          src={course.thumbnail || "/courses-demo-image.png"}
          alt={course.title || "Course thumbnail"}
          width={150}
          height={122}
          className={cn(
            "object-fill w-full max-h-[132px] aspect-video rounded-lg select-none",
            isCourseDisabled && "grayscale",
          )}
          loading="lazy"
          quality={100}
          draggable={false}
        />
        <div className="absolute top-0 left-0 w-full h-full rounded-lg">
          <div className="content-length absolute top-2 left-2 px-1 py-0.5 bg-black/75 rounded-md text-white text-xs font-semibold">
            {`${totalLessons} ${totalLessons === 1 ? "Module" : "Modules"}`}
          </div>
          {isCourseDisabled && (
            <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-gray-700/90 px-2 py-0.5 text-[10px] font-semibold text-white">
              <AlertCircle className="h-3 w-3" /> No longer available
            </div>
          )}
        </div>
      </div>
      <div className="flex w-full h-full flex-col gap-2">
        <h2
          className={cn(
            "text-base font-bold line-clamp-1 text-ellipsis",
            isCourseDisabled && "text-gray-500",
          )}
        >
          {course.title || "Untitled Course"}
        </h2>
        <div className="instructors flex gap-2">
          {course.instructor && Array.isArray(course.instructor) ? (
            course.instructor
              .slice(0, 2)
              .map((instructor, index) => (
                <InstructorCard
                  key={index}
                  instructor={instructor as Instructor}
                />
              ))
          ) : (
            <div className="text-xs text-gray-500">No instructors</div>
          )}
          {course.instructor &&
            Array.isArray(course.instructor) &&
            course.instructor.length > 2 && (
              <div className="instructor-count hidden sm:flex gap-0.25 items-center bg-[#EEEEEE] rounded-md p-1">
                <Plus className="w-3 h-3 text-text-primary" fill="#2B1508" />
                <span className="text-xs font-semibold text-text-primary">
                  {course.instructor.length - 2}
                </span>
              </div>
            )}
        </div>

        {/* Progress Section */}
        {enrollment && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <ProgressChart
              percentage={progress}
              primaryColor={
                progress === 100
                  ? "#22C55E"
                  : progress > 0
                    ? "#714ACA"
                    : "#E5E7EB"
              }
              secondaryColor="hsla(0,0%,100%,.55)"
              className="size-5"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-gray-900">
                {progress}% Complete
              </span>
              <span className="text-[10px] text-gray-500">
                {progress === 100
                  ? "Course completed"
                  : progress > 0
                    ? "In progress"
                    : "Not started"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard2;
