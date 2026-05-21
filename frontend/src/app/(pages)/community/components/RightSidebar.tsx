"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import CourseCard from "../../courses/components/CourseCard";
import InternshipCard from "../../internships/components/InternshipCard";
import type { Course } from "@/types";
import type { InternshipPublicListing } from "@/types/internship";

const TOP_COUNT = 3;

const RightSidebar = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [internships, setInternships] = useState<InternshipPublicListing[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingInternships, setIsLoadingInternships] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await apiClient.get("/courses", {
          params: { page: 1, limit: TOP_COUNT },
          signal: controller.signal,
        });
        setCourses((res.data?.data?.courses ?? []) as Course[]);
      } catch {
        setCourses([]);
      } finally {
        setIsLoadingCourses(false);
      }
    })();

    (async () => {
      try {
        const res = await apiClient.get(ENDPOINTS.internships.all, {
          params: { page: 1, limit: TOP_COUNT },
          signal: controller.signal,
        });
        setInternships(
          (res.data?.data?.internships ?? []) as InternshipPublicListing[]
        );
      } catch {
        setInternships([]);
      } finally {
        setIsLoadingInternships(false);
      }
    })();

    return () => controller.abort();
  }, []);

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Our Courses */}
      <section className="bg-white rounded-3xl md:p-6 md:shadow-sm md:border md:border-gray-100">
        <h2 className="text-xl font-extrabold text-gray-900 mb-6">
          Our <span className="text-[#F77124]">Courses</span>
        </h2>

        {isLoadingCourses ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">No courses available yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {courses.slice(0, TOP_COUNT).map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                className="flex-col! md:flex-col! [&_.course-image]:w-full!"
              />
            ))}
          </div>
        )}

        <Link
          href="/courses"
          className="block w-full text-right text-sm font-bold text-[#F77124] mt-4 hover:underline"
        >
          Show all
        </Link>
      </section>

      {/* Our Internships Program */}
      <section className="bg-white rounded-3xl md:p-6 md:shadow-sm md:border md:border-gray-100">
        <h2 className="text-xl font-extrabold text-[#F77124] mb-6">
          Our <span className="text-[#F77124]">Internships Program</span>
        </h2>

        {isLoadingInternships ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : internships.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">
            No internships available yet.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {internships.slice(0, TOP_COUNT).map((internship) => (
              <InternshipCard
                key={internship._id}
                internship={internship as never}
                className="flex-col! md:flex-col! [&_.internship-image]:w-full!"
              />
            ))}
          </div>
        )}

        <Link
          href="/internships"
          className="block w-full text-right text-sm font-bold text-[#F77124] mt-4 hover:underline"
        >
          Show all
        </Link>
      </section>
    </div>
  );
};

export default RightSidebar;
