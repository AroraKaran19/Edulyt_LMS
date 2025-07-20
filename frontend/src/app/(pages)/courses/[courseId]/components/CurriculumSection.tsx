import CourseTitle from "@/components/ui/course/CourseTitle";
import SectionContainer from "@/components/ui/course/SectionContainer";
import OrangeButton from "@/components/ui/OrangeButton";
import { Course } from "@/types";
import React from "react";

const CurriculumSection = ({ course }: { course: Course }) => {
  const courseInformation = [
    {
      title: "Learning content",
      value: `${course.modules.length} Modules`,
    },
    {
      title: "Languages and tools",
      value: course.language,
    },
    {
      title: "Capstone project",
      value: "Yes",
    },
  ];

  return (
    <SectionContainer id="curriculum">
      <CourseTitle title="Curriculum" className="text-4xl text-text-primary" />
      <div className="course-information-container w-full flex gap-4 flex-col md:flex-row">
        {courseInformation.map((info) => (
          <div
            key={info.title}
            className="flex flex-col gap-2 w-full md:w-[calc((100%/3)-8px)] border-2 border-gray-100 rounded-lg p-4 items-center justify-center"
          >
            <p className="text-lg md:text-3xl font-extrabold text-center">
              {info.value}
            </p>
            <p className="text-sm md:text-base text-center">{info.title}</p>
          </div>
        ))}
      </div>
      <p className="text-sm md:text-base text-center">
        {course.description}
      </p>
      <OrangeButton
        glow={false}
        className="w-fit self-center font-bold"
      >
        Download Curriculum
      </OrangeButton>
    </SectionContainer>
  );
};

export default CurriculumSection;
