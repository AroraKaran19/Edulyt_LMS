"use client";
import { cn } from "@/lib/utils";
import React, { useEffect } from "react";
import Head from "next/head";
import CourseHeader from "./components/CourseHeader";
import ScholarshipBanner from "./components/ScholarshipBanner";
import TestimonialSection from "./components/TestimonialSection";
import CourseOverviewSection from "./components/CourseOverviewSection";
import CoursePageSkeleton from "./components/CoursePageSkeleton";
import { useParams } from "next/navigation";
import { Course } from "@/types";
import { useCourseFilter } from "@/contexts/CourseFilterProvider";

const CoursePage = () => {
  const params = useParams();
  const courseSlug = params.courseId as string;
  const { courses, isFetching } = useCourseFilter();
  const course = courses.find((course) => course.slug === courseSlug) as Course;

  // Update metadata dynamically
  useEffect(() => {
    if (course) {
      // Update document title
      document.title = `${course.title} | Edulyt India`;

      // Update meta description
      const metaDescription = document.querySelector(
        'meta[name="description"]'
      );
      if (metaDescription) {
        metaDescription.setAttribute(
          "content",
          course.shortDescription || course.description
        );
      } else {
        const newMetaDescription = document.createElement("meta");
        newMetaDescription.name = "description";
        newMetaDescription.content =
          course.shortDescription || course.description;
        document.head.appendChild(newMetaDescription);
      }

      // Update Open Graph meta tags
      const updateOrCreateMetaTag = (property: string, content: string) => {
        let metaTag = document.querySelector(`meta[property="${property}"]`);
        if (metaTag) {
          metaTag.setAttribute("content", content);
        } else {
          metaTag = document.createElement("meta");
          metaTag.setAttribute("property", property);
          metaTag.setAttribute("content", content);
          document.head.appendChild(metaTag);
        }
      };

      updateOrCreateMetaTag("og:title", course.title);
      updateOrCreateMetaTag(
        "og:description",
        course.shortDescription || course.description
      );
      updateOrCreateMetaTag("og:image", course.thumbnail);
      updateOrCreateMetaTag(
        "og:url",
        `${window.location.origin}/courses/${course.slug}`
      );
      updateOrCreateMetaTag("og:type", "website");

      // Update Twitter Card meta tags
      const updateOrCreateTwitterTag = (name: string, content: string) => {
        let metaTag = document.querySelector(`meta[name="${name}"]`);
        if (metaTag) {
          metaTag.setAttribute("content", content);
        } else {
          metaTag = document.createElement("meta");
          metaTag.setAttribute("name", name);
          metaTag.setAttribute("content", content);
          document.head.appendChild(metaTag);
        }
      };

      updateOrCreateTwitterTag("twitter:card", "summary_large_image");
      updateOrCreateTwitterTag("twitter:title", course.title);
      updateOrCreateTwitterTag(
        "twitter:description",
        course.shortDescription || course.description
      );
      updateOrCreateTwitterTag("twitter:image", course.thumbnail);
    }
  }, [course]);

  if (isFetching) {
    return <CoursePageSkeleton />;
  }

  return (
    <>
      <Head>
        <title>
          {course?.title
            ? `${course.title} - Edulyt LMS`
            : "Course - Edulyt LMS"}
        </title>
        <meta
          name="description"
          content={
            course?.shortDescription ||
            course?.description ||
            "Learn with Edulyt LMS"
          }
        />
        <meta
          property="og:title"
          content={course?.title || "Course - Edulyt LMS"}
        />
        <meta
          property="og:description"
          content={
            course?.shortDescription ||
            course?.description ||
            "Learn with Edulyt LMS"
          }
        />
        <meta property="og:image" content={course?.thumbnail || "/logo.png"} />
        <meta
          property="og:url"
          content={`${
            typeof window !== "undefined" ? window.location.origin : ""
          }/courses/${courseSlug}`}
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={course?.title || "Course - Edulyt LMS"}
        />
        <meta
          name="twitter:description"
          content={
            course?.shortDescription ||
            course?.description ||
            "Learn with Edulyt LMS"
          }
        />
        <meta name="twitter:image" content={course?.thumbnail || "/logo.png"} />
      </Head>
      <div
        className={cn(
          `${courseSlug}-course-page w-full min-h-screen`,
          "flex flex-col items-center gap-6"
        )}
      >
        <div className="course-header w-full h-auto bg-white rounded-2xl py-4 px-4 lg:px-[13%] md:py-8 flex flex-col items-center">
          <div className="course-preview-video w-full mt-2 flex flex-col items-center">
            <video
              className="w-full min-h-[200px] max-h-[270px] rounded-xl object-cover"
              controls
              poster={`/courseVideoDemoPoster.png`}
              preload="metadata"
            >
              <source
                src={`https://media.w3.org/2010/05/sintel/trailer_hd.mp4`}
                type="video/mp4"
              />
            </video>
          </div>
          <CourseHeader course={course} />
        </div>
        {course?.scholarship && <ScholarshipBanner />}
        <TestimonialSection />
        <CourseOverviewSection />
      </div>
    </>
  );
};

export default CoursePage;
