import React from "react";
import { LiveClass } from "@/types";
import { Video, Plus } from "lucide-react";
import LiveClassCard from "./LiveClassCard";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Pagination from "@/components/admin/Pagination";

interface LiveClassesListProps {
  liveClasses: LiveClass[];
  isLoading: boolean;
  viewMode: "all" | "ongoing";
  onEdit: (liveClass: LiveClass) => void;
  onDelete: (liveClass: LiveClass) => void;
  onCreate: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const LiveClassesList: React.FC<LiveClassesListProps> = ({
  liveClasses,
  isLoading,
  viewMode,
  onEdit,
  onDelete,
  onCreate,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (isLoading && liveClasses.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (liveClasses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center flex flex-col items-center justify-center">
        <Video className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No live classes found
        </h3>
        <p className="text-gray-600 mb-6">
          {viewMode === "ongoing"
            ? "There are no ongoing live classes at the moment"
            : "Get started by creating your first live class"}
        </p>
        {viewMode === "all" && (
          <OrangeButton
            onClick={onCreate}
            className="cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Live Class
          </OrangeButton>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {liveClasses.map((liveClass) => (
          <LiveClassCard
            key={liveClass._id}
            liveClass={liveClass}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        className="mt-8 sm:justify-center"
      />
    </>
  );
};

export default LiveClassesList;
