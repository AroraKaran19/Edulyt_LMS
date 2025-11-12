import React from "react";
import { LiveClass } from "@/types";
import { Calendar, Clock, BookOpen, User, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";

interface LiveClassCardProps {
  liveClass: LiveClass;
  onEdit: (liveClass: LiveClass) => void;
  onDelete: (liveClass: LiveClass) => void;
}

const LiveClassCard: React.FC<LiveClassCardProps> = ({ liveClass, onEdit, onDelete }) => {
  // Format date and time
  const formatDateTime = (date: Date | string, time: string) => {
    const dateObj = new Date(date);
    const [hours, minutes] = time.split(":");
    dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return dateObj.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Combine date and time to create full datetime
  const getStartDateTime = () => {
    const dateObj = new Date(liveClass.startDate);
    const [hours, minutes] = liveClass.startTime.split(":");
    dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return dateObj;
  };

  const getEndDateTime = () => {
    const dateObj = new Date(liveClass.endDate);
    const [hours, minutes] = liveClass.endTime.split(":");
    dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return dateObj;
  };

  // Check if live class is ongoing
  const isOngoing = () => {
    const now = new Date();
    const start = getStartDateTime();
    const end = getEndDateTime();
    return start <= now && end >= now;
  };

  // Check if live class is upcoming
  const isUpcoming = () => {
    return getStartDateTime() > new Date();
  };

  // Get status badge
  const getStatusBadge = () => {
    if (isOngoing()) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          Ongoing
        </span>
      );
    } else if (isUpcoming()) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          Upcoming
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
          Completed
        </span>
      );
    }
  };

  const course =
    typeof liveClass.course === "object" ? liveClass.course : null;
  const instructor =
    typeof liveClass.instructor === "object" ? liveClass.instructor : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      {liveClass.imageUrl && (
        <div className="h-48 bg-gray-200 relative">
          <img
            src={liveClass.imageUrl}
            alt={liveClass.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3">{getStatusBadge()}</div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {liveClass.title}
        </h3>

        {liveClass.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {liveClass.description}
          </p>
        )}

        {/* Course Info */}
        {course && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <BookOpen className="w-4 h-4" />
            <span className="truncate">{course.title}</span>
          </div>
        )}

        {/* Instructor Info */}
        {instructor && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <User className="w-4 h-4" />
            <span>
              {instructor.firstName} {instructor.lastName}
            </span>
          </div>
        )}

        {/* Date & Time */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Start: {formatDateTime(liveClass.startDate, liveClass.startTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>End: {formatDateTime(liveClass.endDate, liveClass.endTime)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(liveClass)}
            className="flex items-center gap-2 text-orange-600 hover:bg-orange-50 hover:text-orange-700 cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(liveClass)}
            className="flex items-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LiveClassCard;

