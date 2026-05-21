"use client";

import { Course, Internship } from "@/types";
import CourseCard from "../../courses/components/CourseCard";
import InternshipCard from "../../internships/components/InternshipCard";

const RightSidebar = ({ courses, internships }: { courses: Course[], internships: Internship[] }) => {
  // Only show first 3 courses for demo as in screenshot
  const displayCourses = courses.slice(0, 3);

  // Map dummy data to Course type expected by NewCourseCard
  const formattedCourses = displayCourses.map(
    (c) =>
      ({
        id: c._id,
        title: c.title,
        thumbnail: c.thumbnail,
        discount: c.discount,
        isFeatured: c.isFeatured,
        analytics: {
          averageRating: c.analytics?.averageRating || 0,
          totalReviews: c.analytics?.totalReviews || 0,
          totalEnrollments: c.analytics?.totalEnrollments || 0,
        },
        instructors: c.instructor,
        slug: c.slug,
      }) as any,
  );

  const formattedInternships = internships.map(
    (i) =>
      ({
        id: i._id,
        title: i.title,
        thumbnail: i.thumbnail,
        discount: i.discount,
        certification: i.certification,
        certificationThreshold: i.certificationThreshold,
        offerLetterDesignation: i.offerLetterDesignation,
        mode: i.mode,
        slug: i.slug,
      }) as any,
  );

  return (
    <div className="w-full lg:max-w-[800px] flex flex-col gap-8">
      {/* Our Courses Section */}
      <div className="bg-white rounded-3xl md:p-6 md:shadow-sm md:border md:border-gray-100">
        <h2 className="text-xl font-extrabold text-gray-900 mb-6">
          Our <span className="text-[#F77124]">Courses</span>
        </h2>
        <div className="flex flex-col gap-4">
          {formattedCourses.map((course, index) => (
            <CourseCard
              key={index}
              course={course}
              className="sm:flex-col"
            />
          ))}
        </div>
        <button className="w-full text-right text-sm font-bold text-[#F77124] mt-4 hover:underline">
          Show all
        </button>
      </div>

      {/* Our Internships Program Section */}
      <div className="bg-white rounded-3xl md:p-6 md:shadow-sm md:border md:border-gray-100">
        <h2 className="text-xl font-extrabold text-[#F77124] mb-6">
          Our <span className="text-[#F77124]">Internships Program</span>
        </h2>
        <div className="flex flex-col gap-4">
          {formattedInternships.map((internship, index) => (
            <InternshipCard
              key={index}
              internship={internship}
              className="sm:flex-col"
            />
          ))}
        </div>
        <button className="w-full text-right text-sm font-bold text-[#F77124] mt-4 hover:underline">
          Show all
        </button>
      </div>
    </div>
  );
};

export default RightSidebar;
