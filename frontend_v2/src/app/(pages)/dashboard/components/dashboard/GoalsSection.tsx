import ProgressChart from "@/components/ui/charts/ProgressChart";
import { CircleAlert } from "lucide-react";
import Image from "next/image";

const GoalsSection = () => {
  return (
    <div className="flex w-full flex-col h-max gap-4 sm:gap-5 md:gap-6 border border-gray-200 rounded-lg p-3 sm:p-4 md:p-5">
      <div className="flex w-full justify-between items-center">
        <h2 className="text-sm sm:text-base font-bold">Goals</h2>
        <button className="text-sm font-medium text-black hover:opacity-80 transition-opacity">
          <CircleAlert className="size-4 sm:size-5" />
        </button>
      </div>
      <div className="flex w-full flex-col items-center h-max gap-3 sm:gap-4">
        <div className="flex progress-chart-goal h-full relative">
          <ProgressChart
            percentage={50}
            primaryColor="#0DCD90"
            secondaryColor="#DADADA"
            size={100}
            inset={6}
            className="sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px]"
          />
          <Image
            src="/dashboard/GoalRocket.svg"
            alt="goal-rocket"
            width={24}
            height={24}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none sm:w-8 sm:h-8 md:w-10 md:h-10"
            quality={100}
            draggable={false}
            loading="lazy"
          />
        </div>
      </div>
      <div className="flex w-full flex-col h-max gap-1 items-center">
        <div className="flex w-full h-full items-center justify-center gap-1 sm:gap-2">
          <span className="text-xs font-semibold text-[#667085]">
            Daily goals
          </span>
          <div className="h-full w-0.5 bg-gray-200 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-black">
            4/10{" "}
            <span className="text-xs font-normal text-[#667085]">
              episodes done
            </span>
          </span>
        </div>
        <p className="text-xs font-normal text-[#667085] text-center">
          Your longest streak is 2 days
        </p>
      </div>
    </div>
  );
};

export default GoalsSection;
