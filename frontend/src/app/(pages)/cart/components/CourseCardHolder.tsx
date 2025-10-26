import BestsellerBadge from "@/components/ui/course/BestsellerBadge";
import InstructorCard from "@/components/ui/course/InstructorCard";
import RatingContainer from "@/components/ui/course/RatingContainer";
import ImageComponent from "@/components/ui/ImageComponent";
import { Course, Instructor } from "@/types";
import { Plus } from "lucide-react";

const CourseCardHolder = ({ course }: { course: Course }) => {
  return (
    <div className="w-full h-128 rounded-2xl overflow-hidden relative">
      <ImageComponent
        src={course.thumbnail}
        alt={course.title}
        width={1000}
        height={1000}
        className="w-full h-full object-cover"
        quality={100}
        draggable={false}
        unoptimized
      />
      <div className="absolute inset-0 bg-[radial-gradient(71.14%_64.15%_at_50%_9.47%,rgba(255,255,255,0)_0%,rgba(0,0,0,0.5)_100%)]">
        <div className="relative h-full w-full flex flex-col gap-2 justify-end p-4">
          <BestsellerBadge
            enrollStudents={course.analytics?.totalEnrollments || 0}
          />
          <span className="text-white text-2xl font-bold font-coolvetica">
            {course.title}
          </span>
          <RatingContainer
            reviewCount={course.analytics?.totalReviews || 0}
            totalRating={course.analytics?.totalRatings || 0}
            className="mt-2 text-sm"
            courseSlug={course?.slug}
            reviewCountText="text-white!"
          />
          <div className="instructors mt-2 flex gap-2 select-none mb-2 flex-col sm:flex-row items-start sm:items-center">
            {course?.instructor?.map((instructor, index) => {
              if (index < 2) {
                return (
                  <InstructorCard
                    key={index}
                    instructor={instructor as Instructor}
                  />
                );
              }
            })}
            {course?.instructor?.length > 2 && (
              <div className="instructor-count flex gap-0.25 items-center bg-[#EEEEEE] rounded-full p-1">
                <Plus className="w-3 h-3 text-text-primary" fill="#2B1508" />
                <p className="text-xs font-bold text-text-primary">
                  {course?.instructor?.length - 2}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCardHolder;
