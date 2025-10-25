"use client";
import InstructorCard from "@/components/ui/course/InstructorCard";
import { Course, CourseModule, Instructor } from "@/types";
import { Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const CourseCard2 = ({ course }: { course: Course }) => {
  const router = useRouter();

  const totalLessons = ((course?.modules as CourseModule[]) || []).reduce(
    (acc, module) => acc + (module.lessons || []).length,
    0
  );
  const totalModules = (course?.modules || []).length;

  return (
    <div
      className="flex course-card-2 w-full h-full flex-col gap-4 border border-gray-200 rounded-lg p-3 cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/courses/${course.slug}/watch`);
      }}
    >
      <div className="image-container w-full relative">
        <Image
          src={course.thumbnail}
          alt={course.title}
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
          {course.title}
        </h2>
        <div className="instructors flex gap-2">
          {course.instructor.map(
            (instructor, index) =>
              index < 2 && (
                <InstructorCard
                  key={index}
                  instructor={instructor as Instructor}
                />
              )
          )}
          {course.instructor.length > 2 && (
            <div className="instructor-count hidden sm:flex gap-0.25 items-center bg-[#EEEEEE] rounded-md p-1">
              <Plus className="w-3 h-3 text-text-primary" fill="#2B1508" />
              <span className="text-xs font-semibold text-text-primary">
                {course.instructor.length - 2}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard2;
