import AvgTimeSection from "./components/dashboard/AvgTimeSection";
import ContinueWatchingSection from "./components/dashboard/ContinueWatchingSection";
import GoalsSection from "./components/dashboard/GoalsSection";
import Leaderboard from "./components/dashboard/Leaderboard";
import NewCoursesSection from "./components/dashboard/NewCoursesSection";

const UserDashboard = async () => {
  return (
    <div className="flex flex-col lg:flex-row w-full h-full gap-8 py-8 overflow-auto">
      <div className="flex w-full lg:w-6/8 flex-col gap-4">
        <ContinueWatchingSection />
        <NewCoursesSection />
      </div>
      <div className="flex w-full lg:w-2/8 flex-col gap-6">
        <AvgTimeSection />
        <GoalsSection />
        {/* <Leaderboard /> */}
      </div>
    </div>
  );
};

export default UserDashboard;
