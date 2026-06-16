"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import CourseCard from "@/app/(pages)/programs/components/CourseCard";
import { Course } from "@/types";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { API_BASE_URL } from "@/constants/endpoints";

export type MentorCoursesSectionProps = {
  title?: string;
  courses: Course[];
  totalCourses: number;
  slug: string;
  className?: string;
};

const MentorCoursesSection = ({
  title = "Courses By Them",
  courses,
  totalCourses,
  slug,
  className,
}: MentorCoursesSectionProps) => {
  const PAGE_SIZE = 4;
  const [items, setItems] = useState<Course[]>(courses || []);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    setItems(courses || []);
    setPage(1);
  }, [courses]);

  const visibleCourses = useMemo(() => items, [items]);

  const hasMore = (items?.length ?? 0) < (totalCourses ?? 0);

  const loadMore = async () => {
    if (!API_BASE_URL) return;
    if (isLoadingMore || !hasMore) return;

    const nextPage = page + 1;
    setIsLoadingMore(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/instructor/${encodeURIComponent(
          slug
        )}/courses?page=${nextPage}&limit=${PAGE_SIZE}`
      );

      if (!res.ok) return;

      const json = (await res.json()) as any;
      const newCourses = (json?.data?.courses ?? []) as Course[];

      if (newCourses.length > 0) {
        setItems((prev) => [...prev, ...newCourses]);
        setPage(nextPage);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Hide the section entirely when this instructor has no courses.
  if ((items?.length ?? 0) === 0 && (totalCourses ?? 0) === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "bg-white rounded-2xl p-4 sm:p-6",
        className
      )}
    >
      <p className="text-xl sm:text-2xl font-bold text-text-primary">
        {title}
      </p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
        {visibleCourses.map((course, idx) => (
          <CourseCard
            key={`${course.slug}-${idx}`}
            course={course}
            className="h-full"
          />
        ))}
      </div>

      {hasMore ? (
        <div className="mt-6 flex justify-center">
          <OrangeButton
            className="px-8 py-3 font-bold"
            onClick={loadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "Loading..." : "Load more"}
          </OrangeButton>
        </div>
      ) : null}
    </section>
  );
};

export default MentorCoursesSection;
