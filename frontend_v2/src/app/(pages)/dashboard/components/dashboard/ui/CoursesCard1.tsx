"use client";
import InstructorCard from "@/components/ui/course/InstructorCard";
import ProgressChart from "@/components/ui/charts/ProgressChart";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Course, Instructor } from "@/types";
import { Enrollment } from "@/types/enrollment";
import { Plus } from "lucide-react";
import Image from "next/image";
import { useCallback } from "react";

interface CoursesCard1Props {
  course: Course;
  enrollment?: Enrollment;
}

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

  const handleContinue = () => {
    if (course.slug) {
      window.open(`/courses/${course.slug}/watch`, '_blank');
    }
  };

  return (
    <div className="flex w-full p-1 border border-gray-200 rounded-lg items-stretch gap-3">
      <Image
        src={course.thumbnail || "/courses-demo-image.png"}
        alt={course.title || "Course thumbnail"}
        width={150}
        height={100}
        className="object-fill aspect-video rounded-lg select-none"
        loading="lazy"
        quality={100}
        draggable={false}
      />
      <div className="flex w-full h-full flex-col gap-2 justify-center items-start">
        <h2 className="text-base font-bold line-clamp-1 text-ellipsis">
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
      <div className="flex w-full h-full gap-2 justify-center items-end pr-2">
        <div className="flex w-full h-full gap-6 items-center justify-end">
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
          <WhiteButton 
            className="w-max text-sm font-bold text-gray-500"
            onClick={handleContinue}
          >
            Continue
          </WhiteButton>
        </div>
      </div>
    </div>
  );
};

export default CoursesCard1;
