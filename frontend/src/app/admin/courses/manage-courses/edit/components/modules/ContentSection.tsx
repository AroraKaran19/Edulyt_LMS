import React from "react";
import { Video, HelpCircle } from "lucide-react";
import { Content } from "@/types/course";
import ContentCard from "./ContentCard";
import { EmptyContentState } from "./EmptyStates";

interface ContentSectionProps {
  lessonId: string;
  contents: Content[];
  expandedContent: Set<string>;
  onToggleContentExpansion: (contentId: string) => void;
  onUpdateContent: (contentId: string, updates: Partial<Content>) => void;
  onAddContent: (lessonId: string, type: "video" | "quiz") => void;
  onSaveContent: (contentId: string) => void; // Added
  onRemoveContent: (contentId: string) => void; // Added
  onDeleteContent: (contentId: string) => void;
  onVideoUpload: (contentId: string, file: File, folderName: string) => Promise<string>;
  onVideoUrlSubmit: (contentId: string, url: string) => void;
  onVideoRemove: (contentId: string) => void;
  onThumbnailUpload: (contentId: string, file: File, folderName: string) => Promise<string>;
  onThumbnailUrlSubmit: (contentId: string, url: string) => void;
  onThumbnailRemove: (contentId: string) => void;
  isSavingContent?: boolean; // Added
  contentSaveError?: string | null; // Added
  isContentComplete: (content: Content) => boolean; // Added
  isContentSaved: (contentId: string) => boolean; // Added
  isUploading: boolean;
  courseTitle?: string;
  moduleIndex?: number;
  lessonIndex?: number;
  isLessonSaved?: boolean;
}

const ContentSection: React.FC<ContentSectionProps> = ({
  lessonId,
  contents,
  expandedContent,
  onToggleContentExpansion,
  onUpdateContent,
  onAddContent,
  onSaveContent, // Added
  onRemoveContent, // Added
  onDeleteContent,
  onVideoUpload,
  onVideoUrlSubmit,
  onVideoRemove,
  onThumbnailUpload,
  onThumbnailUrlSubmit,
  onThumbnailRemove,
  isSavingContent = false, // Added
  contentSaveError = null, // Added
  isContentComplete, // Added
  isContentSaved, // Added
  isUploading,
  courseTitle,
  moduleIndex,
  lessonIndex,
  isLessonSaved = true,
}) => {
  const hasContent = contents.length > 0;

  return (
    <div className="border-t border-gray-200 pt-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h6 className="text-sm font-semibold text-gray-800">Lesson Content</h6>
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
              <span className="text-xs text-gray-600">{contents.length}</span>
              <span className="text-xs text-gray-500">items</span>
            </div>
          </div>
          {!isLessonSaved && (
            <p className="text-xs text-amber-600 mt-1">
              Save lesson first to add content
            </p>
          )}
        </div>
        
        {/* Add Content Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddContent(lessonId, "video")}
            disabled={!isLessonSaved}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors text-white bg-blue-600 border-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video className="w-4 h-4" />
            Video
          </button>
          
          <button
            onClick={() => onAddContent(lessonId, "quiz")}
            disabled={!isLessonSaved}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors text-white bg-emerald-600 border-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HelpCircle className="w-4 h-4" />
            Quiz
          </button>
        </div>
      </div>

      {/* Content List */}
      {hasContent ? (
        <div className="space-y-3">
          {contents.map((content, index) => 
            content && content._id ? (
              <ContentCard
                key={content._id}
                contentId={content._id}
                contentData={content}
                isExpanded={expandedContent.has(content._id)}
                onToggleExpansion={() => onToggleContentExpansion(content._id!)}
                onUpdateContent={onUpdateContent}
                onDeleteContent={onDeleteContent}
                onSaveContent={onSaveContent}
                onRemoveContent={onRemoveContent}
                onVideoUpload={onVideoUpload}
                onVideoUrlSubmit={onVideoUrlSubmit}
                onVideoRemove={onVideoRemove}
                onThumbnailUpload={onThumbnailUpload}
                onThumbnailUrlSubmit={onThumbnailUrlSubmit}
                onThumbnailRemove={onThumbnailRemove}
                isUploading={isUploading}
                isSaving={isSavingContent}
                saveError={contentSaveError}
                isComplete={isContentComplete}
                isSaved={isContentSaved}
                courseTitle={courseTitle || "untitled"}
                moduleIndex={moduleIndex || 0}
                lessonIndex={lessonIndex || 0}
                contentIndex={index}
                index={index}
              />
            ) : null
          )}
        </div>
      ) : (
        <EmptyContentState 
          onAddContent={onAddContent} 
          lessonId={lessonId} 
          isLessonSaved={isLessonSaved}
        />
      )}
    </div>
  );
};

export default ContentSection;
