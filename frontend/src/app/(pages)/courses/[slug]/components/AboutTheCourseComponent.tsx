import CourseTitle from "@/components/ui/course/CourseTitle";
import Image from "next/image";
import { Course } from "@/types";
import { HatIcon } from "../../../../../../public/icons";

const AboutTheCourseComponent = ({ course }: { course: Course }) => {
  const careerHighlights = [
    {
      title: "Jobs in India",
      description: "1.5 Mil",
    },
    {
      title: "Global market value",
      description: "₹279 B",
    },
    {
      title: "Companies using Python",
      description: "1000+",
    },
    {
      title: "Avg salary",
      description: "22 Lakhs+",
    },
  ];

  const courseCertifiedBy = [
    "/course-certifiers/iit-kharagpur.png",
    "/course-certifiers/iit-kharagpur.png",
    "/course-certifiers/mhua-govt.png",
    "/course-certifiers/mhua-govt.png",
    "/course-certifiers/dron-study.png",
    "/course-certifiers/dron-study.png",
    "/course-certifiers/cppr.png",
    "/course-certifiers/cppr.png",
  ];

  return (
    <>
      <section
        id="what-will-you-learn"
        className="what-will-you-learn w-full flex flex-col gap-6"
      >
        <CourseTitle title="What will you learn?" />
        <div
          className="text-base font-normal prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:list-inside [&_ul]:ml-4 [&_ol]:list-disc [&_ol]:list-inside [&_ol]:ml-4 [&_li]:list-item [&_li]:mb-1"
          dangerouslySetInnerHTML={{
            __html: course?.whatYouWillLearn,
          }}
        />
      </section>
      {course?.skills.length > 0 && (
        <section
          id="skills-you-will-learn"
          className="skills-you-will-learn w-full flex flex-col gap-6"
        >
          <CourseTitle title="Skills you wil learn" />
          <div className="skills-card-container w-full flex gap-4 flex-wrap">
            {course?.skills.map((skill, index) => (
              <div
                key={index}
                className="skills-card w-max bg-black/8 rounded-lg py-2 px-4 flex items-center gap-2"
              >
                <div className="skills-card-text text-base font-normal">
                  {skill}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      <section
        id="why-should-you-join"
        className="why-should-you-join lg:mt-5 w-full flex flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <p className="text-base font-normal">Key program highlights</p>
          <CourseTitle title="Why should you join?" />
        </div>
        <div className="reasons-cards-container w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-10">
          {course?.highlights.map((item, index) => (
            <div
              key={index}
              className="w-full bg-white px-3 md:px-6 py-3 md:py-4 rounded-xl border-2 border-[rgb(233,117,0)] shadow-[0_0_2px_3px_rgba(233,117,0,0.3)] flex flex-col items-center justify-center gap-1.5 md:gap-2.5"
            >
              <HatIcon className="size-8 md:size-14 text-black" />
              <p className="text-xl md:text-2xl font-normal text-center font-coolvetica text-[#F77124]">
                {item.title || "Title"}
              </p>
              <p className="text-xs md:text-sm font-normal text-center mt-1.5">
                {item.description || "Description"}
              </p>
            </div>
          ))}
        </div>
      </section>
      {course?.prerequisites && course?.prerequisites.length > 0 && (
        <section
          id="prerequisites"
          className="prerequisites w-full flex flex-col gap-6"
        >
          <CourseTitle title="Pre-requisites" />
          <ul className="prerequisites-list list-disc list-inside ml-4 space-y-2">
            {course.prerequisites.map((prerequisite: string, index: number) => (
              <li
                key={index}
                className="prerequisite-item text-base font-normal"
              >
                {prerequisite}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section
        id="career-growth"
        className="career-growth w-full flex flex-col lg:mt-5 gap-6"
      >
        <CourseTitle 
          title={`Careers in ${(() => {
            if (!course?.category) return "";
            if (Array.isArray(course.category)) {
              const firstItem = course.category[0];
              if (typeof firstItem === "object" && firstItem !== null && "name" in firstItem) {
                // Populated Category objects
                return course.category.map((c: any) => c.name).join(", ");
              } else {
                // Category IDs
                return course.category.join(", ");
              }
            }
            return String(course.category);
          })()}`} 
        />
        {course?.careerPaths.length > 0 && (
          <div className="career-list flex gap-4 flex-wrap">
            {course?.careerPaths.map((career, index) => (
              <div
                key={index}
                className="career-card w-max bg-black/8 rounded-lg py-2 px-4 flex items-center gap-2"
              >
                <div className="career-card-text text-base font-normal">
                  {career}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="career-highlights-container w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-10">
          {/* This will stay static for now */}
          {careerHighlights.map((highlight, index) => (
            <div
              key={index}
              className="career-highlight-card w-full bg-white px-3 md:px-6 py-3 md:py-4 rounded-xl border-2 border-gray-200 flex flex-col items-center justify-center gap-1.5 md:gap-2"
            >
              <p className="text-xl lg:text-3xl font-extrabold text-center text-[#F77124]">
                {highlight.description}
              </p>
              <p className="text-xs lg:text-base font-normal text-center text-black/80">
                {highlight.title}
              </p>
            </div>
          ))}
        </div>
        <div className="course-certifiers-container w-full flex flex-wrap gap-4 justify-between relative">
          {/* This will stay static for now */}
          {courseCertifiedBy.map((certifier, index) => (
            <div
              key={index}
              className="course-certifier-card w-max flex flex-col items-center justify-center select-none"
            >
              <Image
                src={certifier}
                alt="Course Certifier"
                width={60}
                height={60}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default AboutTheCourseComponent;
