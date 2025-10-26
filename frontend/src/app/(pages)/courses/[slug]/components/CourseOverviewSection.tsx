import TabSwitcher from "@/components/ui/course/TabSwitcher";
import AboutTheCourseComponent from "./AboutTheCourseComponent";
import SectionContainer from "@/components/ui/course/SectionContainer";
import VideoShowcase from "./VideoShowcase";
import { Course, CourseModule } from "@/types";
import { LockIcon } from "../../../../../../public/icons";

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
            activeTabIcon: <LockIcon className="size-4 lg:size-5" />,
            component: (
              <VideoShowcase
                modules={(course?.modules as CourseModule[]) || []}
              />
            ),
            ...(course?.modules?.length &&
              course?.modules?.length > 0 && {
                showCount: course?.modules?.length,
              }),
          },
        ]}
      />
    </SectionContainer>
  );
};

export default CourseOverviewSection;
