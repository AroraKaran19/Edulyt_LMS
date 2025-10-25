import { Clock3 } from "lucide-react";

const AvgTimeSection = () => {
  return (
    <div className="flex w-full h-max gap-2 sm:gap-3 md:gap-4 border border-gray-200 rounded-lg p-3 sm:p-4 md:p-5 justify-center items-center">
      <div className="icon-container h-max p-2 sm:p-2.5 bg-[#FFEFE6] rounded-lg shrink-0 flex items-center justify-center">
        <Clock3 className="size-4 sm:size-5 md:size-6 stroke-white fill-orange-500" />
      </div>
      <div className="flex flex-col">
        <h2 className="text-xs sm:text-sm md:text-base font-medium">
          Average Time Spent
        </h2>
        <p className="text-xl sm:text-2xl md:text-3xl text-text-primary font-bold">
          10 minutes
        </p>
      </div>
    </div>
  );
};

export default AvgTimeSection;
