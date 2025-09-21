import React from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Edit2,
  Trash2,
  Save,
  Plus,
} from "lucide-react";
import { CourseModule, CourseLesson, Content } from "@/types/course";
import FlexBox from "@/components/ui/FlexBox";
import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import LessonItem from "./LessonItem";
import { EmptyLessonsState } from "./EmptyStates";

interface ModuleCardProps {
  courseModule: CourseModule;
  moduleIndex: number;
  isSaved: boolean;
  isExpanded: boolean;
  isComplete: boolean;
  expandedLessons: Set<string>;
  expandedContent: Set<string>;
  courseTitle: string;
  isUploading: boolean;
  isSaving?: boolean;
  saveError?: string | null;
  isSavingLesson?: boolean;
  lessonSaveError?: string | null;
  isSavingContent?: boolean; // Added
  contentSaveError?: string | null; // Added
  onToggleExpansion: () => void;
  onUpdateModule: (moduleId: string, updates: Partial<CourseModule>) => void;
  onAddLesson: (moduleIndex: number) => void;
  onUpdateLesson: (lessonId: string, updates: Partial<CourseLesson>) => void;
  onSaveLesson: (lessonId: string) => void;
  onRemoveLesson: (lessonId: string) => void;
  onAddContent: (lessonId: string, type: "video" | "quiz") => void;
  onSaveContent: (contentId: string) => void; // Added
  onRemoveContent: (contentId: string) => void; // Added
  onToggleLessonExpansion: (lessonId: string) => void;
  onToggleContentExpansion: (contentId: string) => void;
  onUpdateContent: (contentId: string, updates: Partial<Content>) => void;
  onDeleteContent: (contentId: string) => void;
  onSaveModule: (index: number) => void;
  onRemoveModule: (index: number) => void;
  onThumbnailUpload: (
    moduleId: string,
    file: File,
    folderName: string
  ) => Promise<string>;
  onThumbnailUrlSubmit: (moduleId: string, url: string) => void;
  onThumbnailRemove: (moduleId: string) => void;
  onVideoUpload: (contentId: string, file: File, folderName: string) => Promise<string>;
  onVideoUrlSubmit: (contentId: string, url: string) => void;
  onVideoRemove: (contentId: string) => void;
  onContentThumbnailUpload: (contentId: string, file: File, folderName: string) => Promise<string>;
  onContentThumbnailUrlSubmit: (contentId: string, url: string) => void;
  onContentThumbnailRemove: (contentId: string) => void;
  isLessonComplete: (lesson: CourseLesson) => boolean;
  isLessonSaved: (lessonId: string) => boolean;
  isContentComplete: (content: Content) => boolean; // Added
  isContentSaved: (contentId: string) => boolean; // Added
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  courseModule,
  moduleIndex,
  isSaved,
  isExpanded,
  isComplete,
  expandedLessons,
  expandedContent,
  courseTitle,
  isUploading,
  isSaving = false,
  saveError = null,
  isSavingLesson = false,
  lessonSaveError = null,
  isSavingContent = false, // Added
  contentSaveError = null, // Added
  onToggleExpansion,
  onUpdateModule,
  onAddLesson,
  onUpdateLesson,
  onSaveLesson,
  onRemoveLesson,
  onAddContent,
  onSaveContent, // Added
  onRemoveContent, // Added
  onToggleLessonExpansion,
  onToggleContentExpansion,
  onUpdateContent,
  onDeleteContent,
  onSaveModule,
  onRemoveModule,
  onThumbnailUpload,
  onThumbnailUrlSubmit,
  onThumbnailRemove,
  onVideoUpload,
  onVideoUrlSubmit,
  onVideoRemove,
  onContentThumbnailUpload,
  onContentThumbnailUrlSubmit,
  onContentThumbnailRemove,
  isLessonComplete,
  isLessonSaved,
  isContentComplete, // Added
  isContentSaved, // Added
}) => {
  return (
    <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
      {/* Module Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-50 transition-colors"
        onClick={onToggleExpansion}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-gray-400" />
            <div
              className={`w-3 h-3 rounded-full ${
                isComplete ? "bg-green-500" : "bg-yellow-500"
              }`}
            ></div>
          </div>
          <h4 className="font-medium text-gray-800">
            {courseModule.title || `Module ${moduleIndex + 1}`}
          </h4>
          {isSaved && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
              Saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {courseModule.lessons?.length || 0} lessons
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>

      {/* Expanded Module Content */}
      {isExpanded && (
        <div className="p-4 border-t border-blue-100">
          <FlexBox className="flex-col gap-4">
            {/* Module Basic Info */}
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Module Title"
                placeholder="e.g., Introduction to React"
                value={courseModule.title}
                onChange={(e) => {
                  onUpdateModule(courseModule._id!, {
                    title: e.target.value,
                  });
                }}
                required
              />
            </div>

            <TextArea
              label="Module Description"
              placeholder="Describe what students will learn in this module"
              value={courseModule.description || ""}
              onChange={(e) => {
                onUpdateModule(courseModule._id!, {
                  description: e.target.value,
                });
              }}
              rows={3}
              lockHeight
              required
            />

            {/* Module Thumbnail Upload */}
            <UploadMediaContainer
              title="Module Thumbnail"
              description="Upload a thumbnail image for this module (required)"
              type="image"
              mediaUrl={courseModule.thumbnailUrl}
              mediaSource={courseModule.thumbnailSource}
              s3Key={courseModule.thumbnailS3Key}
              maxSize={10} // 10MB
              acceptedFormats={[".jpg", ".jpeg", ".png", ".webp"]}
              onFileUpload={(file, folderName) =>
                onThumbnailUpload(courseModule._id!, file, folderName)
              }
              onFileRemove={() => onThumbnailRemove(courseModule._id!)}
              onUrlSubmit={(url) =>
                onThumbnailUrlSubmit(courseModule._id!, url)
              }
              isUploading={isUploading}
              required={true}
              allowUrlInput={true}
              folderName={`courses/${courseTitle}/modules`}
              uploadContext={`module-${moduleIndex + 1}`}
              usePresignedUrl={true}
              presignedUrlThreshold={5} // Use presigned URL for files > 5MB
              className="w-full"
            />

            {/* Module Settings */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={courseModule.isActive}
                  onChange={(e) => {
                    onUpdateModule(courseModule._id!, {
                      isActive: e.target.checked,
                    });
                  }}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Module Active</span>
              </label>
            </div>

            {/* Lessons Section */}
            <div className="border-t border-blue-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-col">
                  <h5 className="font-medium text-gray-800">Lessons</h5>
                  {!isSaved && (
                    <p className="text-xs text-amber-600 mt-1">
                      Save module first to add lessons
                    </p>
                  )}
                </div>
                <OrangeButton
                  onClick={() => onAddLesson(moduleIndex)}
                  disabled={!isSaved}
                  className="flex items-center gap-2 px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3 h-3" />
                  Add Lesson
                </OrangeButton>
              </div>

              {/* Lessons List */}
              <div className="space-y-3 pl-4">
                {courseModule.lessons?.map((lesson, lessonIndex) =>
                  lesson ? (
                    <LessonItem
                      key={lesson._id!}
                      lessonId={lesson._id!}
                      lessonData={lesson}
                      isExpanded={expandedLessons.has(lesson._id!)}
                      isSaved={isLessonSaved(lesson._id!)}
                      isComplete={isLessonComplete(lesson)}
                      isSaving={isSavingLesson}
                      saveError={lessonSaveError}
                      onToggleExpansion={() =>
                        onToggleLessonExpansion(lesson._id!)
                      }
                      onUpdateLesson={onUpdateLesson}
                      onSaveLesson={onSaveLesson}
                      onRemoveLesson={onRemoveLesson}
                      onAddContent={onAddContent}
                      onSaveContent={onSaveContent} // Added
                      onRemoveContent={onRemoveContent} // Added
                      onVideoUpload={onVideoUpload}
                      onVideoUrlSubmit={onVideoUrlSubmit}
                      onVideoRemove={onVideoRemove}
                      onThumbnailUpload={onContentThumbnailUpload}
                      onThumbnailUrlSubmit={onContentThumbnailUrlSubmit}
                      onThumbnailRemove={onContentThumbnailRemove}
                      expandedContent={expandedContent}
                      onToggleContentExpansion={onToggleContentExpansion}
                      onUpdateContent={onUpdateContent}
                      onDeleteContent={onDeleteContent}
                      isSavingContent={isSavingContent} // Added
                      contentSaveError={contentSaveError} // Added
                      isContentComplete={isContentComplete} // Added
                      isContentSaved={isContentSaved} // Added
                      isUploading={isUploading}
                      courseTitle={courseTitle}
                      moduleIndex={moduleIndex}
                      lessonIndex={lessonIndex}
                    />
                  ) : null
                )}

                {(courseModule.lessons?.length || 0) === 0 && (
                  <EmptyLessonsState
                    onAddLesson={() => onAddLesson(moduleIndex)}
                    isModuleSaved={isSaved}
                  />
                )}
              </div>
            </div>

            {/* Error Display */}
            {saveError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{saveError}</p>
              </div>
            )}

            {/* Module Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-blue-100">
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      `Are you sure you want to delete "${
                        courseModule.title || "this module"
                      }"? This action cannot be undone.`
                    )
                  ) {
                    onRemoveModule(moduleIndex);
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
                    Delete Module
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <OrangeButton
                  onClick={() => onSaveModule(moduleIndex)}
                  disabled={!isComplete || isSaving}
                  className="flex items-center gap-2 px-4 py-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {courseModule._id?.startsWith("temp_") ? "Creating..." : "Updating..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {courseModule._id?.startsWith("temp_") ? "Save Module" : "Update Module"}
                    </>
                  )}
                </OrangeButton>
              </div>
            </div>
          </FlexBox>
        </div>
      )}

      {/* Collapsed Module View */}
      {!isExpanded && isSaved && (
        <div className="p-4 border-t border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 mb-1">
                {courseModule.description || "No description"}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{courseModule.lessons?.length || 0} lessons</span>
                <span
                  className={
                    courseModule.isActive ? "text-green-600" : "text-red-600"
                  }
                >
                  {courseModule.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <button
              onClick={onToggleExpansion}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleCard;
