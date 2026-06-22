import AvgTimeSection from "./components/dashboard/AvgTimeSection";
import ContinueWatchingSection from "./components/dashboard/ContinueWatchingSection";
import GoalsSection from "./components/dashboard/GoalsSection";
import NewCoursesSection from "./components/dashboard/NewCoursesSection";
import LiveClassesSection from "./components/dashboard/LiveClassesSection";
import HomeAnnouncements from "./components/dashboard/HomeAnnouncements";
import SuccessPointsSection from "./components/dashboard/SuccessPointsSection";

const UserDashboard = async () => {
  return (
    <div className="flex w-full h-full flex-col gap-6 py-8 overflow-auto">
      <HomeAnnouncements />
      <div className="flex w-full flex-1 min-h-0 flex-col lg:flex-row gap-8">
        <div className="flex w-full lg:w-6/8 flex-col gap-4">
          <LiveClassesSection />
          <ContinueWatchingSection />
          <NewCoursesSection />
        </div>
        <div className="flex w-full lg:w-2/8 flex-col gap-6">
          <SuccessPointsSection />
          <AvgTimeSection />
          <GoalsSection />
          {/* <Leaderboard /> */}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
