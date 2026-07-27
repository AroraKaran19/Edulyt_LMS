import { formatDuration } from "@/lib/utils";
import {
  formatReviewCount,
  getCourseDisplayRating,
} from "@/lib/utils/courseRating";
import {
  Content,
  Course,
  CourseLesson,
  CourseModule,
  Instructor,
} from "@/types";
import { Star } from "lucide-react";
import { useMemo } from "react";
import InstructorCarousel from "../../components/InstructorCarousel";

const OverviewSection = ({ course }: { course: Course }) => {
  const totalDuration = useMemo(() => {
    return formatDuration(
      ((course?.modules as CourseModule[]) || []).reduce(
        (acc, module) =>
          acc +
          ((module?.lessons as CourseLesson[]) || [])?.reduce(
            (lessonAcc, lesson) =>
              lessonAcc +
              ((lesson?.contents as Content[]) || [])?.reduce(
                (contentAcc, content) => {
                  if (content.type === "video" && content.duration) {
                    return contentAcc + content.duration;
                  }
                  return contentAcc;
                },
                0
              ),
            0
          ),
        0
      )
    );
  }, [course]);

  const { displayRating, displayReviewCount } = useMemo(() => {
    const { rating, reviewCount } = getCourseDisplayRating(course);
    return { displayRating: rating, displayReviewCount: reviewCount };
  }, [course]);

  const formattedReviewsCount = useMemo(
    () => formatReviewCount(displayReviewCount),
    [displayReviewCount]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="section-header flex flex-col gap-2">
        <h2 className="text-4xl font-bold font-coolvetica text-text-primary">
          {course.title}
        </h2>
        <h3
          className="text-base font-normal text-text-primary line-clamp-5"
          dangerouslySetInnerHTML={{ __html: course.description }}
        />
      </div>
      <hr className="w-full border-t-2 border-gray-200" />
      <div className="course-information w-full flex flex-row flex-wrap sm:flex-nowrap justify-center lg:justify-start gap-4 md:gap-20">
        <div className="rating-container w-max flex flex-col items-center md:items-start">
          <p className="text-base font-normal text-text-primary">Rating</p>
          <div className="course-rating w-full flex flex-wrap gap-1 md:gap-2 items-center justify-center md:justify-start">
            <Star className="size-4 md:size-5 text-[#F7AD24]" fill="#F7AD24" />
            <span className="text-base md:text-2xl font-normal text-text-primary font-coolvetica tracking-wide">
              {displayRating}
            </span>
            <span className="text-sm md:text-base font-normal text-text-primary">
              (
              {(() => {
                const totalReviews = displayReviewCount;
                if (totalReviews > 100) {
                  return `more than ${formattedReviewsCount} reviews`;
                } else if (totalReviews === 1) {
                  return `${formattedReviewsCount} review`;
                } else {
                  return `${formattedReviewsCount} reviews`;
                }
              })()}
              )
            </span>
          </div>
        </div>
        <div className="course-proficency w-max flex flex-col items-center md:items-start">
          <p className="text-sm md:text-base font-normal text-text-primary">
            Proficency
          </p>
          <p className="text-base md:text-2xl font-normal text-text-primary font-coolvetica tracking-wide">
            {course?.skillLevel}
          </p>
        </div>
        <div className="course-total-time w-max flex flex-col items-center md:items-start">
          <p className="text-sm md:text-base font-normal text-text-primary">
            Total Duration
          </p>
          <p className="text-base md:text-2xl font-normal text-text-primary font-coolvetica tracking-wide">
            {totalDuration}
          </p>
        </div>
      </div>
      <hr className="w-full border-t-2 border-gray-200" />
      <div className="course-what-will-your-learn w-full flex flex-col gap-4">
        <h2 className="text-3xl font-bold font-coolvetica text-black">
          What will you learn?
        </h2>
        <div
          className="text-base font-normal text-black line-clamp-5 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: course.whatYouWillLearn || "" }}
        />
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
                  {/* {skill?.icon && skill?.icon} */}
                  <div className="skills-card-text text-base font-normal">
                    {skill}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <hr className="w-full border-t-2 border-gray-200" />
        </>
      )}
      {course?.instructor?.length > 0 && (
        <div className="instructor w-full flex flex-col gap-4">
          <h2 className="text-3xl font-bold font-coolvetica text-black">
            Instructors
          </h2>
          <div className="instructor-card-container w-full flex flex-col md:flex-row gap-4">
            <InstructorCarousel
              instructors={course?.instructor as Instructor[]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewSection;
