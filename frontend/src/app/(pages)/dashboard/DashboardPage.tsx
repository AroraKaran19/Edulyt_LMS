import React from "react";
import FlexBox from "@/components/ui/FlexBox";
import ContinueWatchingSection from "./components/dashboard/ContinueWatchingSection";
import NewCoursesSection from "./components/dashboard/NewCoursesSection";
import AvgTimeSection from "./components/dashboard/AvgTimeSection";
import GoalsSection from "./components/dashboard/GoalsSection";
import Leaderboard from "./components/dashboard/Leaderboard";

const DashboardPage = () => {
  return (
    <FlexBox className="flex-col lg:flex-row w-full h-full px-10 lg:px-20 gap-8 py-8 overflow-auto">
      <FlexBox className="w-full lg:w-6/8 flex-col gap-4">
        <ContinueWatchingSection />
        <NewCoursesSection />
      </FlexBox>
      <FlexBox className="w-full lg:w-2/8 flex-col gap-6">
        <AvgTimeSection />
        <GoalsSection />
        <Leaderboard />
      </FlexBox>
    </FlexBox>
  );
};

export default DashboardPage;
