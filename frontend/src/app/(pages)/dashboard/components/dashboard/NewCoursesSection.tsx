"use client";
import { Course } from "@/types";
import { ArrowRight } from "lucide-react";
import CoursesCard2 from "./ui/CourseCard2";
import useUserEnrollments from "@/hooks/useUserEnrollments";
import { Enrollment } from "@/types/enrollment";
import { useEffect, useState } from "react";
import Loader from "@/components/ui/Loader";
import Error from "@/components/ui/Error";
import { AlertCircle } from "lucide-react";

/** Cards shown in the Home row. */
const VISIBLE_COUNT = 8;

const NewCoursesSection = () => {
  const { getUserEnrollments, isLoading, error } = useUserEnrollments();
  const [newCourses, setNewCourses] = useState<Enrollment[]>([]);

  useEffect(() => {
    const fetchNewCourses = async () => {
      const result = await getUserEnrollments({
        page: 1,
        limit: VISIBLE_COUNT,
        sortBy: "recent",
        courseActive: true,
      });

      if (result) {
        setNewCourses(result.enrollments);
      }
    };

    fetchNewCourses();
  }, [getUserEnrollments]);

  if (isLoading) {
    return <Loader size="lg" variant="spinner" />;
  }

  if (error) {
    return (
      <Error
        icon={AlertCircle}
        iconSize="lg"
        iconColor="text-red-500"
        title="Error"
        description="Error loading new courses"
      />
    );
  }

  return (
    <div className="flex w-full h-full flex-col gap-3 sm:gap-4">
      <div className="flex w-full justify-between items-center text-text-primary">
        <h2 className="text-sm sm:text-base font-bold">New Courses</h2>
        <a
          href="/dashboard/courses"
          className="flex gap-1 sm:gap-2 items-center cursor-pointer select-none hover:opacity-80 transition-opacity"
        >
          <span className="text-xs sm:text-sm font-semibold">View All</span>
          <ArrowRight className="size-3 sm:size-4" />
        </a>
      </div>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {newCourses.length > 0 ? (
          newCourses.map((enrollment, index) => (
            <CoursesCard2 
              key={`${enrollment._id}-${index}`} 
              course={enrollment.courseId as Course}
              enrollment={enrollment}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            <p className="text-sm">No enrolled courses yet</p>
            <p className="text-xs mt-1">Enroll in courses to see them here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewCoursesSection;
