import React from "react";
import { Plus, Video, HelpCircle, FileText, Sparkles } from "lucide-react";
import { Content } from "@/types/course";
import ContentCard from "./ContentCard";
import ContentAddButton from "./ContentAddButton";

interface ContentSectionProps {
  lessonId: string;
  contentIds: string[];
  expandedContent: Set<string>;
  onToggleContentExpansion: (contentId: string) => void;
  getContentData: (contentId: string) => Content;
  onUpdateContent: (contentId: string, updates: Partial<Content>) => void;
  onAddContent: (lessonId: string, type: "video" | "quiz") => void;
  onDeleteContent?: (contentId: string) => void;
  courseTitle?: string;
  moduleIndex?: number;
  lessonIndex?: number;
}

const ContentSection: React.FC<ContentSectionProps> = ({
  lessonId,
  contentIds,
  expandedContent,
  onToggleContentExpansion,
  getContentData,
  onUpdateContent,
  onAddContent,
  onDeleteContent,
  courseTitle,
  moduleIndex,
  lessonIndex,
}) => {
  const hasContent = contentIds.length > 0;

  return (
    <div className="border-t border-gray-200 pt-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h6 className="text-sm font-semibold text-gray-800">Lesson Content</h6>
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
            <span className="text-xs text-gray-600">{contentIds.length}</span>
            <span className="text-xs text-gray-500">items</span>
          </div>
        </div>
        
        {/* Add Content Dropdown */}
        <AddContentDropdown onAddContent={onAddContent} lessonId={lessonId} />
      </div>

      {/* Content List */}
      {hasContent ? (
        <div className="space-y-3">
          {contentIds.map((contentId, index) => 
            contentId ? (
              <ContentCard
                key={contentId}
                contentId={contentId}
                contentData={getContentData(contentId)}
                isExpanded={expandedContent.has(contentId)}
                onToggleExpansion={() => onToggleContentExpansion(contentId)}
                onUpdateContent={onUpdateContent}
                onDeleteContent={onDeleteContent}
                index={index}
                courseTitle={courseTitle}
                moduleIndex={moduleIndex}
                lessonIndex={lessonIndex}
              />
            ) : null
          )}
        </div>
      ) : (
        <EmptyContentState onAddContent={onAddContent} lessonId={lessonId} />
      )}
    </div>
  );
};

// Add Content Dropdown Component
interface AddContentDropdownProps {
  onAddContent: (lessonId: string, type: "video" | "quiz") => void;
  lessonId: string;
}

const AddContentDropdown: React.FC<AddContentDropdownProps> = ({
  onAddContent,
  lessonId,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleAddContent = (type: "video" | "quiz") => {
    onAddContent(lessonId, type);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Content
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <button
                onClick={() => handleAddContent("video")}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
              >
                <div className="p-1 bg-blue-100 rounded">
                  <Video className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Video Lesson</div>
                  <div className="text-xs text-gray-500">Add educational video content</div>
                </div>
              </button>
              
              <button
                onClick={() => handleAddContent("quiz")}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors"
              >
                <div className="p-1 bg-emerald-100 rounded">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Knowledge Quiz</div>
                  <div className="text-xs text-gray-500">Test student understanding</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Empty Content State Component
interface EmptyContentStateProps {
  onAddContent: (lessonId: string, type: "video" | "quiz") => void;
  lessonId: string;
}

const EmptyContentState: React.FC<EmptyContentStateProps> = ({
  onAddContent,
  lessonId,
}) => {
  return (
    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex justify-center mb-4">
        <div className="p-3 bg-white rounded-full shadow-sm">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
      </div>
      
      <h3 className="text-sm font-medium text-gray-900 mb-2">No content added yet</h3>
      <p className="text-xs text-gray-500 mb-6 max-w-sm mx-auto">
        Start building your lesson by adding videos, quizzes, and other learning materials.
      </p>
      
      <div className="flex items-center justify-center gap-3">
        <ContentAddButton
          type="video"
          onClick={() => onAddContent(lessonId, "video")}
        />
        <ContentAddButton
          type="quiz"
          onClick={() => onAddContent(lessonId, "quiz")}
        />
      </div>
      
      <div className="mt-4 flex items-center justify-center gap-1 text-xs text-gray-400">
        <Sparkles className="w-3 h-3" />
        <span>Tip: Start with a video introduction</span>
      </div>
    </div>
  );
};

export default ContentSection;