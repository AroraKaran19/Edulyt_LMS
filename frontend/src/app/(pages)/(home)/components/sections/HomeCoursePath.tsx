import { Icon } from "@iconify/react";
import HomeCourseSection from "../HomeCourseSection";
import type { HomeCoursePathSettings } from "@/types/home-page-settings";

const HomeCoursePath = ({
  title,
  audience,
  settings,
}: {
  audience: "college-students" | "professionals";
  title: string;
  settings?: HomeCoursePathSettings;
}) => {
  const resolvedAudience = settings?.audience || audience;
  const resolvedTitle = settings?.title?.trim() || title;
  const audienceText =
    resolvedAudience === "college-students" ? "Students" : "Working Professionals";
  const coursesPrefix = settings?.coursesHeadingPrefix?.trim() || "Our";
  const coursesHighlight = settings?.coursesHeadingHighlight?.trim() || "Programs";
  return (
    <section
      id="home-course"
      className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 pl-8 lg:px-12"
    >
      <div className="content border-l-2 border-gray-300 border-dashed h-full relative px-10 lg:px-12.5 py-20 flex flex-col gap-10">
        <div className="hand-badge size-12 absolute top-18 -left-6 text-secondary bg-primary rounded-full flex items-center justify-center">
          <Icon
            icon={
              resolvedAudience === "college-students"
                ? "glyphs:path-1-bold"
                : "streamline-plump:ai-technology-spark-solid"
            }
            width="32"
            height="32"
          />
        </div>
        <div className="content-body flex flex-col gap-6">
          <h3 className="text-base lg:text-2xl font-semibold capitalize">
            {resolvedTitle}
          </h3>
          <h2 className="text-2xl lg:text-4xl font-extrabold text-text-primary capitalize text-balance">
            {coursesPrefix}{" "}
            <span className="text-primary">{coursesHighlight}</span>{" "}
            <span className="font-normal">(For {audienceText})</span>
          </h2>
          <HomeCourseSection audience={resolvedAudience} />
        </div>
      </div>
    </section>
  );
};

export default HomeCoursePath;
