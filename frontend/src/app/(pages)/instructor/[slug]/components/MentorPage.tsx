"use client";

import React, { useMemo } from "react";
import MentorSidebar from "./MentorSidebar";
import MentorAboutSection from "./MentorAboutSection";
import MentorCoursesSection from "./MentorCoursesSection";
import { Course, Instructor } from "@/types";

const MentorPage = ({
  slug,
  instructor,
  initialCourses,
  totalCourses,
  totalStudents,
}: {
  slug: string;
  instructor: Instructor;
  initialCourses: Course[];
  totalCourses: number;
  totalStudents: number;
}) => {
  const mentorName = [instructor.firstName, instructor.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const mentorTitle = instructor.currentCompany
    ? `${instructor.currentPosition || "Instructor"} @ ${instructor.currentCompany}`
    : instructor.currentPosition || instructor.field || "Instructor";

  const mentorImage = instructor.profilePicture;

  const experienceItems = useMemo(() => {
    const prev = instructor.previousExperience || [];
    return prev.slice(0, 6).map((e) => {
      const fromYear = e?.duration?.from ? new Date(e.duration.from).getFullYear() : undefined;
      const toYear = e?.duration?.to ? new Date(e.duration.to).getFullYear() : undefined;
      const years =
        fromYear && toYear ? `${fromYear} - ${toYear}` : fromYear ? `${fromYear} -` : "-";

      return {
        company: e.companyName,
        role: e.position,
        years,
      };
    });
  }, [instructor.previousExperience]);

  const totalExperienceLabel = useMemo(() => {
    const prev = instructor.previousExperience || [];
    const hasDurations = prev.some((e) => !!(e?.duration?.from && e?.duration?.to));

    if (!prev.length) return "—";
    if (!hasDurations) return `${prev.length}+ roles`;

    const fromDates = prev
      .map((e) => (e?.duration?.from ? new Date(e.duration.from) : null))
      .filter(Boolean) as Date[];
    const toDates = prev
      .map((e) => (e?.duration?.to ? new Date(e.duration.to) : null))
      .filter(Boolean) as Date[];

    if (!fromDates.length || !toDates.length) return `${prev.length}+ roles`;

    const earliest = fromDates.reduce((a, b) => (a < b ? a : b));
    const latest = toDates.reduce((a, b) => (a > b ? a : b));
    const diffYears = Math.max(
      1,
      Math.round((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24 * 365))
    );
    return `${diffYears}+ years`;
  }, [instructor.previousExperience]);

  const safeTotalCourses = typeof totalCourses === "number" ? totalCourses : 0;
  const safeTotalStudents = typeof totalStudents === "number" ? totalStudents : 0;

  return (
    <main className="bg-[#f3f3f3]">
      <div className="px-4 sm:px-6 lg:px-12 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-24">
              <MentorSidebar
                name={mentorName || slug}
                title={mentorTitle}
                profileImage={mentorImage}
                socials={{
                  linkedin: instructor.linkedinUrl,
                  instagram: instructor.accounts?.instagram,
                }}
                totalExperienceLabel={totalExperienceLabel}
                experience={experienceItems}
                className="max-w-md mx-auto lg:max-w-none"
              />
            </div>
          </div>

          <div className="lg:col-span-9 flex flex-col gap-6">
            <MentorAboutSection
              stats={[
                {
                  value: `${safeTotalCourses}`,
                  label: "Courses",
                },
                {
                  value: `${safeTotalStudents}+`,
                  label: "Students",
                },
                {
                  value: `${instructor.rating || 0}`,
                  label: "Rating",
                },
              ]}
              description={
                instructor.bio ||
                "No bio is available for this instructor yet."
              }
            />

            <MentorCoursesSection
              slug={slug}
              courses={initialCourses || []}
              totalCourses={safeTotalCourses}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default MentorPage;
