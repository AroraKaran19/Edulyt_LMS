import React from "react";
import TabSwitcher from "@/components/ui/course/TabSwitcher";
import AboutTheCourseComponent from "./AboutTheCourseComponent";
import SectionContainer from "@/components/ui/course/SectionContainer";
import Image from "next/image";
import VideoShowcase from "./VideoShowcase";
import { Course } from "@/types";

const CourseOverviewSection = ({ course }: { course: Course }) => {
  return (
    <SectionContainer id="course-overview">
      <TabSwitcher
        tabs={[
          {
            label: "About the course",
            component: <AboutTheCourseComponent course={course} />,
          },
          {
            label: "Modules",
            activeTabIcon: (
              <Image
                src="/Lock.svg"
                alt="Lock Icon"
                width={20}
                height={20}
                className="size-4 lg:size-5"
              />
            ),
            component: <VideoShowcase modules={course?.modules || []} />,
            ...(course?.modules?.length && course?.modules?.length > 0 && {
              showCount: course?.modules?.length,
            }),
          },
        ]}
      />
    </SectionContainer>
  );
};

export default CourseOverviewSection;
