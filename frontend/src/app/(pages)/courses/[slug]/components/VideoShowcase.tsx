import VideoCard from "@/app/(pages)/courses/components/VideoCard";
import { CourseModule } from "@/types";
import { BookOpen } from "lucide-react";

const VideoShowcase = ({ modules }: { modules: CourseModule[] | [] }) => {
  return (
    <div className="video-showcase w-full flex flex-col gap-6">
      {modules.length > 0 ? (
        <>
          {/* Header with module count */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2 text-gray-600">
              <BookOpen className="w-5 h-5" />
              <span className="text-sm font-medium">
                {modules.length} Module{modules.length !== 1 ? "s" : ""}{" "}
                Available
              </span>
            </div>
          </div>

          {/* Module cards */}
          <div className="space-y-4">
            {modules.map((module, index) => (
              <VideoCard
                key={module._id || index}
                module={module}
                index={index}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No modules available
          </h3>
        </div>
      )}
    </div>
  );
};

export default VideoShowcase;
