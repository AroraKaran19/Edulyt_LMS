"use client";
import { useEffect, useState, useRef } from "react";
import TabSwitcher from "@/components/ui/course/TabSwitcher";
import AboutTheCourseComponent from "./AboutTheCourseComponent";
import SectionContainer from "@/components/ui/course/SectionContainer";
import VideoShowcase from "./VideoShowcase";
import { Course, CourseModule } from "@/types";
import { LockIcon } from "../../../../../../public/icons";

const CourseOverviewSection = ({ course }: { course: Course }) => {
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [isAutoSwitchEnabled, setIsAutoSwitchEnabled] = useState(true);
  const autoSwitchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const tabs = [
    {
      label: "About the course",
      component: <AboutTheCourseComponent course={course} />,
    },
    {
      label: "Lessons",
      activeTabIcon: <LockIcon className="size-4 lg:size-5" />,
      component: (
        <VideoShowcase
          modules={(course?.modules as CourseModule[]) || []}
        />
      ),
      showCount: (course?.modules as CourseModule[])?.reduce(
        (acc, module) => (acc || 0) + module.lessons.length,
        0
      ),
    },
  ];

  // Auto-switch tabs every 8 seconds (only if enabled)
  useEffect(() => {
    if (!isAutoSwitchEnabled) {
      return;
    }

    autoSwitchIntervalRef.current = setInterval(() => {
      setCurrentTabIndex((prevIndex) => (prevIndex + 1) % tabs.length);
    }, 8000);

    return () => {
      if (autoSwitchIntervalRef.current) {
        clearInterval(autoSwitchIntervalRef.current);
      }
    };
  }, [tabs.length, isAutoSwitchEnabled]);

  // Handle manual tab change - stop auto-switching permanently
  const handleTabChange = (index: number) => {
    setCurrentTabIndex(index);
    setIsAutoSwitchEnabled(false);
    
    // Clear the interval immediately
    if (autoSwitchIntervalRef.current) {
      clearInterval(autoSwitchIntervalRef.current);
      autoSwitchIntervalRef.current = null;
    }
  };

  return (
    <SectionContainer id="course-overview">
      <TabSwitcher
        tabs={tabs}
        activeTabIndex={currentTabIndex}
        onTabChange={handleTabChange}
      />
    </SectionContainer>
  );
};

export default CourseOverviewSection;
