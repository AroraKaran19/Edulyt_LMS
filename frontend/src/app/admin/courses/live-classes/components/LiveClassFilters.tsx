import React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";

interface LiveClassFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: "all" | "ongoing";
  onViewModeChange: (mode: "all" | "ongoing") => void;
  totalLiveClasses: number;
}

const LiveClassFilters: React.FC<LiveClassFiltersProps> = ({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  totalLiveClasses,
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Classes</h1>
          <p className="text-gray-600 mt-1">
            {totalLiveClasses} {totalLiveClasses === 1 ? "live class" : "live classes"} total
          </p>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={viewMode === "all" ? "default" : "outline"}
          size="default"
          onClick={() => onViewModeChange("all")}
          className={
            viewMode === "all"
              ? "bg-orange-500 text-white hover:bg-orange-600 cursor-pointer"
              : ""
          }
        >
          All Live Classes
        </Button>
        <Button
          variant={viewMode === "ongoing" ? "default" : "outline"}
          size="default"
          onClick={() => onViewModeChange("ongoing")}
          className={
            viewMode === "ongoing"
              ? "bg-orange-500 text-white hover:bg-orange-600 cursor-pointer"
              : ""
          }
        >
          Ongoing
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search live classes..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};

export default LiveClassFilters;

