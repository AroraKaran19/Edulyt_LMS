import React from "react";
import { ChevronDown, ChevronUp, GripVertical, Save, Trash2 } from "lucide-react";
import { CourseLesson, Content } from "@/types/course";
import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import ContentSection from "./ContentSection";

interface LessonItemProps {
  lessonId: string;
  lessonData: CourseLesson;
  isExpanded: boolean;
  isSaved: boolean;
  isComplete: boolean;
  isSaving?: boolean;
  saveError?: string | null;
  onToggleExpansion: () => void;
  onUpdateLesson: (lessonId: string, updates: Partial<CourseLesson>) => void;
  onSaveLesson: (lessonId: string) => void;
  onRemoveLesson: (lessonId: string) => void;
  onAddContent: (lessonId: string, type: "video" | "quiz") => void;
  onSaveContent: (contentId: string) => void; // Added
  onRemoveContent: (contentId: string) => void; // Added
  onVideoUpload: (contentId: string, file: File, folderName: string) => Promise<string>;
  onVideoUrlSubmit: (contentId: string, url: string) => void;
  onVideoRemove: (contentId: string) => void;
  onThumbnailUpload: (contentId: string, file: File, folderName: string) => Promise<string>;
  onThumbnailUrlSubmit: (contentId: string, url: string) => void;
  onThumbnailRemove: (contentId: string) => void;
  expandedContent: Set<string>;
  onToggleContentExpansion: (contentId: string) => void;
  onUpdateContent: (contentId: string, updates: Partial<Content>) => void;
  onDeleteContent: (contentId: string) => void;
  isSavingContent?: boolean; // Added
  contentSaveError?: string | null; // Added
  isContentComplete: (content: Content) => boolean; // Added
  isContentSaved: (contentId: string) => boolean; // Added
  isUploading: boolean;
  courseTitle?: string;
  moduleIndex?: number;
  lessonIndex?: number;
}

const LessonItem: React.FC<LessonItemProps> = ({
  lessonId,
  lessonData,
  isExpanded,
  isSaved,
  isComplete,
  isSaving = false,
  saveError = null,
  onToggleExpansion,
  onUpdateLesson,
  onSaveLesson,
  onRemoveLesson,
  onAddContent,
  onSaveContent, // Added
  onRemoveContent, // Added
  onVideoUpload,
  onVideoUrlSubmit,
  onVideoRemove,
  onThumbnailUpload,
  onThumbnailUrlSubmit,
  onThumbnailRemove,
  expandedContent,
  onToggleContentExpansion,
  onUpdateContent,
  onDeleteContent,
  isSavingContent = false, // Added
  contentSaveError = null, // Added
  isContentComplete, // Added
  isContentSaved, // Added
  isUploading,
  courseTitle,
  moduleIndex,
  lessonIndex,
}) => {
  const lesson = lessonData;

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
      {/* Lesson Header */}
      <div className="flex items-center justify-between p-3">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors flex-1"
          onClick={onToggleExpansion}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="w-3 h-3 text-gray-400" />
            <div
              className={`w-3 h-3 rounded-full ${
                isComplete ? "bg-green-500" : "bg-yellow-500"
              }`}
            ></div>
          </div>
          <span className="font-medium text-gray-800">
            {lesson.title || "Untitled Lesson"}
          </span>
          {isSaved && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
              Saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {lesson.contents?.length || 0} items
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 text-gray-500" />
          ) : (
            <ChevronDown className="w-3 h-3 text-gray-500" />
          )}
        </div>
      </div>

      {/* Expanded Lesson Content */}
      {isExpanded && (
        <div className="p-3 border-t border-gray-200">
          <div className="space-y-3">
            <Input
              label="Lesson Title"
              placeholder="e.g., Getting Started with React"
              value={lesson.title}
              onChange={(e) => {
                onUpdateLesson(lessonId, { title: e.target.value });
              }}
              required
            />

            <TextArea
              label="Lesson Description"
              placeholder="Describe what students will learn in this lesson"
              value={lesson.description || ""}
              onChange={(e) => {
                onUpdateLesson(lessonId, { description: e.target.value });
              }}
              rows={2}
              lockHeight
            />

            {/* Content Section */}
            <ContentSection
              lessonId={lessonId}
              contents={lesson.contents || []}
              expandedContent={expandedContent}
              onToggleContentExpansion={onToggleContentExpansion}
              onUpdateContent={onUpdateContent}
              onAddContent={onAddContent}
              onSaveContent={onSaveContent} // Added
              onRemoveContent={onRemoveContent} // Added
              onDeleteContent={onDeleteContent}
              onVideoUpload={onVideoUpload}
              onVideoUrlSubmit={onVideoUrlSubmit}
              onVideoRemove={onVideoRemove}
              onThumbnailUpload={onThumbnailUpload}
              onThumbnailUrlSubmit={onThumbnailUrlSubmit}
              onThumbnailRemove={onThumbnailRemove}
              isSavingContent={isSavingContent} // Added
              contentSaveError={contentSaveError} // Added
              isContentComplete={isContentComplete} // Added
              isContentSaved={isContentSaved} // Added
              isUploading={isUploading}
              courseTitle={courseTitle}
              moduleIndex={moduleIndex}
              lessonIndex={lessonIndex}
              isLessonSaved={isSaved}
            />

            {/* Error Display */}
            {saveError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{saveError}</p>
              </div>
            )}

            {/* Lesson Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      `Are you sure you want to delete "${
                        lesson.title || "this lesson"
                      }"? This action cannot be undone.`
                    )
                  ) {
                    onRemoveLesson(lessonId);
                  }
                }}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Lesson
                  </>
                )}
              </button>

              <OrangeButton
                onClick={() => onSaveLesson(lessonId)}
                disabled={!isComplete || isSaving}
                className="flex items-center gap-2 px-4 py-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {lesson._id?.startsWith("temp_") ? "Creating..." : "Updating..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {lesson._id?.startsWith("temp_") ? "Save Lesson" : "Update Lesson"}
                  </>
                )}
              </OrangeButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonItem;
