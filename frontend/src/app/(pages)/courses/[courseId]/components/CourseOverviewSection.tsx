import React from "react";
import TabSwitcher from "@/components/ui/course/TabSwitcher";
import AboutTheCourseComponent from "./AboutTheCourseComponent";

const CourseOverviewSection = () => {
  return (
    <section className="course-overview-section w-full bg-white rounded-2xl py-10 flex flex-col items-center justify-center px-5 md:px-[13%]">
      <TabSwitcher
        tabs={[
          { label: "About the course", component: <AboutTheCourseComponent /> },
          { label: "Modules", component: <div>Modules</div>, showCount: 10 },
        ]}
      />
    </section>
  );
};

export default CourseOverviewSection;
