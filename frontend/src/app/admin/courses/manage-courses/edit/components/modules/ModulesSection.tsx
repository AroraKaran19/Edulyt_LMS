import React from "react";
import { BookOpen, Plus } from "lucide-react";
import { CourseModule, CourseLesson, Content } from "@/types/course";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import ModuleCard from "./ModuleCard";
import { EmptyModulesState } from "./EmptyStates";

interface ModulesSectionProps {
  course: {
    _id: string;
    title: string;
    description: string;
    modules: CourseModule[];
  };
  savedModules: Set<number>;
  savedLessons: Set<string>;
  savedContent: Set<string>; // Added
  expandedModules: Set<number>;
  expandedLessons: Set<string>;
  expandedContent: Set<string>;
  isUploading: boolean;
  isSaving?: boolean;
  saveError?: string | null;
  isSavingLesson?: boolean;
  lessonSaveError?: string | null;
  isSavingContent?: boolean; // Added
  contentSaveError?: string | null; // Added
  onAddModule: () => void;
  onToggleModuleExpansion: (index: number) => void;
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
  isModuleComplete: (courseModule: CourseModule) => boolean;
  isLessonComplete: (lesson: CourseLesson) => boolean;
  isLessonSaved: (lessonId: string) => boolean;
  isContentComplete: (content: Content) => boolean; // Added
  isContentSaved: (contentId: string) => boolean; // Added
}

const ModulesSection: React.FC<ModulesSectionProps> = ({
  course,
  savedModules,
  expandedModules,
  expandedLessons,
  expandedContent,
  isUploading,
  isSaving = false,
  saveError = null,
  isSavingLesson = false,
  lessonSaveError = null,
  isSavingContent = false, // Added
  contentSaveError = null, // Added
  onAddModule,
  onToggleModuleExpansion,
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
  isModuleComplete,
  isLessonComplete,
  isLessonSaved,
  isContentComplete, // Added
  isContentSaved, // Added
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Course Modules
            </h3>
            <p className="text-sm text-gray-600">
              Organize your course content into structured modules
            </p>
          </div>
        </div>
        <OrangeButton
          onClick={onAddModule}
          className="flex items-center gap-2 px-4 py-2"
        >
          <Plus className="w-4 h-4" />
          Add Module
        </OrangeButton>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {course.modules.map((courseModule, moduleIndex) => {
          if (!courseModule) return null;
          const isSaved = savedModules.has(moduleIndex);
          const isExpanded = expandedModules.has(moduleIndex);
          const isComplete = isModuleComplete(courseModule);

          return (
            <ModuleCard
              key={moduleIndex}
              courseModule={courseModule}
              moduleIndex={moduleIndex}
              isSaved={isSaved}
              isExpanded={isExpanded}
              isComplete={isComplete}
              expandedLessons={expandedLessons}
              expandedContent={expandedContent}
              courseTitle={course.title || "untitled"}
              isUploading={isUploading}
              isSaving={isSaving}
              saveError={saveError}
              isSavingLesson={isSavingLesson}
              lessonSaveError={lessonSaveError}
              isSavingContent={isSavingContent} // Added
              contentSaveError={contentSaveError} // Added
              onToggleExpansion={() => onToggleModuleExpansion(moduleIndex)}
              onUpdateModule={onUpdateModule}
              onAddLesson={onAddLesson}
              onUpdateLesson={onUpdateLesson}
              onSaveLesson={onSaveLesson}
              onRemoveLesson={onRemoveLesson}
              onAddContent={onAddContent}
              onSaveContent={onSaveContent} // Added
              onRemoveContent={onRemoveContent} // Added
              onToggleLessonExpansion={onToggleLessonExpansion}
              onToggleContentExpansion={onToggleContentExpansion}
              onUpdateContent={onUpdateContent}
              onDeleteContent={onDeleteContent}
              onSaveModule={onSaveModule}
              onRemoveModule={onRemoveModule}
              onThumbnailUpload={onThumbnailUpload}
              onThumbnailUrlSubmit={onThumbnailUrlSubmit}
              onThumbnailRemove={onThumbnailRemove}
              onVideoUpload={onVideoUpload}
              onVideoUrlSubmit={onVideoUrlSubmit}
              onVideoRemove={onVideoRemove}
              onContentThumbnailUpload={onContentThumbnailUpload}
              onContentThumbnailUrlSubmit={onContentThumbnailUrlSubmit}
              onContentThumbnailRemove={onContentThumbnailRemove}
              isLessonComplete={isLessonComplete}
              isLessonSaved={isLessonSaved}
              isContentComplete={isContentComplete} // Added
              isContentSaved={isContentSaved} // Added
            />
          );
        })}

        {course.modules.length === 0 && (
          <EmptyModulesState onAddModule={onAddModule} />
        )}
      </div>
    </div>
  );
};

export default ModulesSection;
