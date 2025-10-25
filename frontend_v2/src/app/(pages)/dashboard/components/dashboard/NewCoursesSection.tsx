import { Course } from "@/types";
import { ArrowRight } from "lucide-react";
import CoursesCard2 from "./ui/CourseCard2";

const NewCoursesSection = () => {
  const courses: Course[] = [];

  return (
    <div className="flex w-full h-full flex-col gap-3 sm:gap-4">
      <div className="flex w-full justify-between items-center text-text-primary">
        <h2 className="text-sm sm:text-base font-bold">New Courses</h2>
        <div className="flex gap-1 sm:gap-2 items-center cursor-pointer select-none hover:opacity-80 transition-opacity">
          <span className="text-xs sm:text-sm font-semibold">View All</span>
          <ArrowRight className="size-3 sm:size-4" />
        </div>
      </div>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {[...courses, ...courses].slice(0, 8).map((course, index) => (
          <CoursesCard2 key={`${course._id}-${index}`} course={course} />
        ))}
      </div>
    </div>
  );
};

export default NewCoursesSection;
