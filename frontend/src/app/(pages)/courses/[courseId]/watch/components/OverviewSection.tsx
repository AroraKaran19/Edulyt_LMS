import { Course } from "@/types";
import { Star } from "lucide-react";
import React, { useMemo } from "react";
import { formatDuration } from "@/lib/formatDuration";
import Image from "next/image";

const OverviewSection = ({ course }: { course: Course }) => {
  const totalDuration = useMemo(() => {
    return formatDuration(
      course?.modules.reduce(
        (acc, module) =>
          acc +
          module.lessons.reduce(
            (lessonAcc, lesson) => lessonAcc + (lesson.duration || 0),
            0
          ),
        0
      )
    );
  }, [course]);

  const formattedReviewsCount = useMemo(
    () =>
      course?.featuredReviews?.length >= 1000000
        ? `${(course?.featuredReviews?.length / 1000000)
            .toFixed(1)
            .replace(/\.0$/, "")}M`
        : course?.featuredReviews?.length >= 1000
        ? `${(course?.featuredReviews?.length / 1000)
            .toFixed(1)
            .replace(/\.0$/, "")}K`
        : course?.featuredReviews?.length?.toString(),
    [course]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="section-header flex flex-col gap-2">
        <h2 className="text-4xl font-bold font-coolvetica text-[#2B1508]">
          {course.title}
        </h2>
        <h3 className="text-base font-normal text-[#2B1508] line-clamp-5">
          {course.description}
        </h3>
      </div>
      <hr className="w-full border-t-2 border-gray-200" />
      <div className="course-information w-full flex flex-row flex-wrap sm:flex-nowrap justify-center lg:justify-start gap-4 md:gap-20">
        <div className="rating-container w-max flex flex-col items-center md:items-start">
          <p className="text-base font-normal text-[#2B1508]">Rating</p>
          <div className="course-rating w-full flex flex-wrap gap-1 md:gap-2 items-center justify-center md:justify-start">
            <Star className="size-4 md:size-5 text-[#F7AD24]" fill="#F7AD24" />
            <span className="text-base md:text-2xl font-normal text-[#2B1508] font-coolvetica tracking-wide">
              {course?.featuredReviews?.reduce(
                (acc, review) => acc + review.rating,
                0
              ) / course?.featuredReviews?.length || 0}
            </span>
            <span className="text-sm md:text-base font-normal text-[#2B1508]">
              (
              {course?.featuredReviews?.length &&
              course?.featuredReviews?.length > 100
                ? `(more than ${formattedReviewsCount} reviews)`
                : formattedReviewsCount === "1"
                ? `${formattedReviewsCount} review`
                : `${formattedReviewsCount} reviews`}
              )
            </span>
          </div>
        </div>
        <div className="course-proficency w-max flex flex-col items-center md:items-start">
          <p className="text-sm md:text-base font-normal text-[#2B1508]">
            Proficency
          </p>
          <p className="text-base md:text-2xl font-normal text-[#2B1508] font-coolvetica tracking-wide">
            {course?.skillLevel}
          </p>
        </div>
        <div className="course-total-time w-max flex flex-col items-center md:items-start">
          <p className="text-sm md:text-base font-normal text-[#2B1508]">
            Total Duration
          </p>
          <p className="text-base md:text-2xl font-normal text-[#2B1508] font-coolvetica tracking-wide">
            {totalDuration}
          </p>
        </div>
      </div>
      <hr className="w-full border-t-2 border-gray-200" />
      <div className="course-what-will-your-learn w-full flex flex-col gap-4">
        <h2 className="text-3xl font-bold font-coolvetica text-black">
          What will you learn?
        </h2>
        <p className="text-base font-normal text-black line-clamp-5">
          {course.whatYouWillLearn}
        </p>
      </div>
      <hr className="w-full border-t-2 border-gray-200" />
      {course?.skills.length > 0 && (
        <>
          <div className="skills-you-will-learn w-full flex flex-col gap-4">
            <h2 className="text-3xl font-bold font-coolvetica text-black">
              Skills you will learn
            </h2>
            <div className="skills-card-container w-full flex gap-4 flex-wrap">
              {course?.skills.map((skill, index) => (
                <div
                  key={index}
                  className="skills-card w-max bg-black/8 rounded-lg py-2 px-4 flex items-center gap-2"
                >
                  {skill?.icon && skill?.icon}
                  <div className="skills-card-text text-base font-normal">
                    {skill?.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <hr className="w-full border-t-2 border-gray-200" />
        </>
      )}
      <div className="instructor w-full flex flex-col gap-4">
        <h2 className="text-3xl font-bold font-coolvetica text-black">
          Instructor
        </h2>
        <div className="instructor-card-container w-full flex flex-col md:flex-row gap-4">
          <Image
            src={
              course?.instructor[0]?.profileImage ||
              "/courseDefaultTestimonial.png"
            }
            alt={course?.instructor[0]?.name || "Instructor Image"}
            width={100}
            height={100}
            className="rounded-lg shrink-0 w-full md:w-1/3 max-h-[200px] aspect-square object-contain"
            priority
            loading="eager"
            quality={100}
            unoptimized
            draggable={false}
          />
          <div className="instructor-card-content w-full md:w-2/3 flex flex-col gap-2">
            <h3 className="text-2xl font-bold font-coolvetica text-black">
              {course?.instructor[0]?.name || "Instructor Name"}
            </h3>
            <p className="text-base font-normal text-black line-clamp-5 text-balance">
              {course?.instructor[0]?.bio || "Instructor Bio"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;
