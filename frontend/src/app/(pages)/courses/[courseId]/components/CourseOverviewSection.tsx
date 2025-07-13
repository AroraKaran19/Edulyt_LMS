import React from "react";
import TabSwitcher from "@/components/ui/course/TabSwitcher";
import AboutTheCourseComponent from "./AboutTheCourseComponent";
import SectionContainer from "@/components/ui/course/SectionContainer";
import Image from "next/image";
import VideoShowcase from "./VideoShowcase";

const CourseOverviewSection = () => {
  return (
    <SectionContainer id="course-overview">
      <TabSwitcher
        tabs={[
          { label: "About the course", component: <AboutTheCourseComponent /> },
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
            component: <VideoShowcase />,
            showCount: 5,
          },
        ]}
      />
    </SectionContainer>
  );
};

export default CourseOverviewSection;
