import React from "react";
import { Video, HelpCircle, FileText, Sparkles, Save } from "lucide-react";
import { Content } from "@/types/course";
import ContentCard from "./ContentCard";
import ContentAddButton from "./ContentAddButton";
import { InlineLoader } from "@/components/ui/Loader";

interface ContentSectionProps {
  lessonId: string;
  contents: Content[]; // Now pass full content objects instead of IDs
  expandedContent: Set<string>;
  onToggleContentExpansion: (contentId: string) => void;
  onUpdateContent: (contentId: string, updates: Partial<Content>) => void;
  onAddContent: (lessonId: string, type: "video" | "quiz") => void;
  onDeleteContent?: (contentId: string) => void;
  onSaveContent?: (lessonId: string, contentId: string) => void;
  courseTitle?: string;
  moduleIndex?: number;
  lessonIndex?: number;
  // Sequential flow props
  isLessonSaved?: boolean;
  isSavingContent?: boolean;
}

const ContentSection: React.FC<ContentSectionProps> = ({
  lessonId,
  contents,
  expandedContent,
  onToggleContentExpansion,
  onUpdateContent,
  onAddContent,
  onDeleteContent,
  onSaveContent,
  courseTitle,
  moduleIndex,
  lessonIndex,
  isLessonSaved = false,
  isSavingContent = false,
}) => {
  const hasContent = contents.length > 0;

  return (
    <div className="border-t border-gray-200 pt-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h6 className="text-sm font-semibold text-gray-800">Lesson Content</h6>
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
            <span className="text-xs text-gray-600">{contents.length}</span>
            <span className="text-xs text-gray-500">items</span>
          </div>
        </div>
        
        {/* Add Content Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddContent(lessonId, "video")}
            disabled={!isLessonSaved || isSavingContent}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              !isLessonSaved || isSavingContent
                ? "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed"
                : "text-white bg-blue-600 border-blue-600 hover:bg-blue-700 focus:ring-blue-500"
            }`}
          >
            {isSavingContent ? (
              <InlineLoader size="sm" variant="spinner" />
            ) : (
              <Video className="w-4 h-4" />
            )}
            {isSavingContent ? "Adding..." : !isLessonSaved ? "Save Lesson First" : "Video"}
          </button>
          
          <button
            onClick={() => onAddContent(lessonId, "quiz")}
            disabled={!isLessonSaved || isSavingContent}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              !isLessonSaved || isSavingContent
                ? "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed"
                : "text-white bg-emerald-600 border-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
            }`}
          >
            {isSavingContent ? (
              <InlineLoader size="sm" variant="spinner" />
            ) : (
              <HelpCircle className="w-4 h-4" />
            )}
            {isSavingContent ? "Adding..." : !isLessonSaved ? "Save Lesson First" : "Quiz"}
          </button>
        </div>
      </div>

      {/* Content List */}
      {hasContent ? (
        <div className="space-y-3">
          {contents.map((content, index) => 
            content && content._id ? (
              <div key={content._id} className="space-y-2">
                <ContentCard
                  contentId={content._id}
                  contentData={content}
                  isExpanded={expandedContent.has(content._id)}
                  onToggleExpansion={() => onToggleContentExpansion(content._id!)}
                  onUpdateContent={onUpdateContent}
                  onDeleteContent={onDeleteContent}
                  index={index}
                  courseTitle={courseTitle}
                  moduleIndex={moduleIndex}
                  lessonIndex={lessonIndex}
                />
                {/* Save Content Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => onSaveContent?.(lessonId, content._id!)}
                    disabled={!content.title || isSavingContent}
                    className={`flex items-center gap-2 px-3 py-1 text-sm rounded-lg ${
                      !content.title || isSavingContent
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                    }`}
                  >
                    {isSavingContent ? (
                      <InlineLoader size="sm" variant="spinner" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    {isSavingContent ? "Saving..." : "Save Content"}
                  </button>
                </div>
              </div>
            ) : null
          )}
        </div>
      ) : (
        <EmptyContentState onAddContent={onAddContent} lessonId={lessonId} />
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