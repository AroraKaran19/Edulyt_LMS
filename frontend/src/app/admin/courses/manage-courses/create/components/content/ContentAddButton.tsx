import React from "react";
import { Video, HelpCircle, Plus } from "lucide-react";

interface ContentAddButtonProps {
  type: "video" | "quiz";
  onClick: () => void;
  disabled?: boolean;
}

const ContentAddButton: React.FC<ContentAddButtonProps> = ({
  type,
  onClick,
  disabled = false,
}) => {
  const config = {
    video: {
      icon: Video,
      label: "Add Video",
      color: "bg-blue-500 hover:bg-blue-600 focus:ring-blue-200",
      iconColor: "text-white",
    },
    quiz: {
      icon: HelpCircle,
      label: "Add Quiz",
      color: "bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-200",
      iconColor: "text-white",
    },
  };

  const { icon: Icon, label, color, iconColor } = config[type];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg
        ${color}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2
        shadow-sm hover:shadow-md
      `}
    >
      <Icon className={`w-4 h-4 ${iconColor}`} />
      {label}
    </button>
  );
};

export default ContentAddButton;