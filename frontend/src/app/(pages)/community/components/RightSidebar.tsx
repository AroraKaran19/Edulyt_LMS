"use client";

import InternshipCard from "../../internships/components/InternshipCard";
import NewCourseCard from "../../internships/components/NewCourseCard";
import { courses } from "@/constants/internshipData";

const RightSidebar = () => {
  // Only show first 3 courses for demo as in screenshot
  const displayCourses = courses.slice(0, 3);

  // Map dummy data to Course type expected by NewCourseCard
  const formattedCourses = displayCourses.map(c => ({
    id: c.id,
    title: c.title,
    thumbnail: c.thumbnail,
    discount: c.discount,
    isFeatured: c.isBestSeller,
    analytics: {
      averageRating: c.rating,
      totalReviews: c.reviewCount,
      totalEnrollments: c.enrolledStudents
    },
    instructors: c.instructors,
    plans: {
      essential: {
        price: c.originalPrice,
        discount: c.discount
      }
    },
    slug: c.id // Using id as slug for dummy
  } as any));

  return (
    <div className="w-full lg:max-w-[800px] flex flex-col gap-8">
      {/* Our Courses Section */}
      <div className="bg-white rounded-3xl md:p-6 md:shadow-sm md:border md:border-gray-100">
        <h2 className="text-xl font-extrabold text-gray-900 mb-6">
          Our <span className="text-[#F77124]">Courses</span>
        </h2>
        <div className="flex flex-col gap-4">
          {formattedCourses.map((course) => (
            <NewCourseCard key={course.id} course={course} className="sm:flex-col" />
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
          {displayCourses.map((course) => (
            <InternshipCard key={`intern-${course.id}`} internship={course} className="sm:flex-col" />
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
