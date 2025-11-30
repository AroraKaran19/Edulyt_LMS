"use client";
import InstructorCard from "@/components/ui/course/InstructorCard";
import ProgressChart from "@/components/ui/charts/ProgressChart";
import { Course, CourseModule, Instructor } from "@/types";
import { Enrollment } from "@/types/enrollment";
import { Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

interface CourseCard2Props {
  course: Course;
  enrollment?: Enrollment;
}

const CourseCard2 = ({ course, enrollment }: CourseCard2Props) => {
  const router = useRouter();

  const calculateProgress = useCallback((enrollment: Enrollment): number => {
    if (!enrollment?.progress) return 0;
    return Math.round(enrollment.progress.overallCompletion || 0);
  }, []);

  const totalLessons = ((course?.modules as CourseModule[]) || []).reduce(
    (acc, module) => acc + (module.lessons || []).length,
    0
  );
  const totalModules = (course?.modules || []).length;
  const progress = enrollment ? calculateProgress(enrollment) : 0;

  const handleClick = () => {
    if (course.slug) {
      router.push(`/courses/${course.slug}/watch`);
    }
  };

  return (
    <div
      className="flex course-card-2 w-full h-full flex-col gap-4 border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <div className="image-container w-full relative">
        <Image
          src={course.thumbnail || "/courses-demo-image.png"}
          alt={course.title || "Course thumbnail"}
          width={150}
          height={122}
          className="object-fill w-full max-h-[132px] aspect-video rounded-lg select-none"
          loading="lazy"
          quality={100}
          draggable={false}
        />
        <div className="absolute top-0 left-0 w-full h-full rounded-lg">
          <div className="content-length absolute top-2 left-2 px-1 py-0.5 bg-black/75 rounded-md text-white text-xs font-semibold">
            {totalModules} {totalModules === 1 ? "Module" : "Modules"}
            {totalLessons > 0 &&
              `• ${totalLessons} ${totalLessons === 1 ? "Lesson" : "Lessons"}`}
          </div>
        </div>
      </div>
      <div className="flex w-full h-full flex-col gap-2">
        <h2 className="text-base font-bold line-clamp-1 text-ellipsis">
          {course.title || "Untitled Course"}
        </h2>
        <div className="instructors flex gap-2">
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
        
        {/* Progress Section */}
        {enrollment && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <ProgressChart
              percentage={progress}
              primaryColor={progress === 100 ? "#22C55E" : progress > 0 ? "#714ACA" : "#E5E7EB"}
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
