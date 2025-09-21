import React from "react";
import Container from "@/app/admin/components/ui/Container";
import ScreenNavigation from "./shared/ScreenNavigation";
import { useCourseModules } from "./modules/hooks/useCourseModules";
import ValidationFeedback from "./modules/ValidationFeedback";
import ModulesSection from "./modules/ModulesSection";
import { useScreen } from "../contexts/ScreenContext";

const Screen11 = () => {
  const { setActiveScreen } = useScreen();
  
  const {
    // State
    course,
    savedModules,
    savedLessons,
    savedContent, // Added
    expandedModules,
    expandedLessons,
    expandedContent,
    isUploading,
    isSaving,
    saveError,
    isSavingLesson,
    lessonSaveError,
    isSavingContent, // Added
    contentSaveError, // Added
    validationErrors,

    // Actions
    addModule,
    updateModuleData,
    removeModule,
    saveModule,
    addLesson,
    updateLessonData,
    saveLesson,
    removeLesson,
    addContent,
    updateContentData,
    saveContent, // Added
    removeContent, // Added
    deleteContentData,
    handleThumbnailUpload,
    handleThumbnailUrlSubmit,
    handleThumbnailRemove,
    handleVideoUpload,
    handleVideoUrlSubmit,
    handleVideoRemove,
    handleContentThumbnailUpload,
    handleContentThumbnailUrlSubmit,
    handleContentThumbnailRemove,
    toggleModuleExpansion,
    toggleLessonExpansion,
    toggleContentExpansion,
    isModuleComplete,
    isLessonComplete,
    isLessonSaved,
    isContentComplete, // Added
    isContentSaved, // Added
  } = useCourseModules();

  return (
    <Container
      title="Course Modules & Content"
      description="Create and organize your course modules, lessons, and content"
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      style={{ scrollbarWidth: "thin" }}
    >
      {/* Validation Feedback */}
      <ValidationFeedback errors={validationErrors} />

      {/* Modules Section */}
      <ModulesSection
        course={course}
        savedModules={savedModules}
        savedLessons={savedLessons}
        savedContent={savedContent} // Added
        expandedModules={expandedModules}
        expandedLessons={expandedLessons}
        expandedContent={expandedContent}
        isUploading={isUploading}
        isSaving={isSaving}
        saveError={saveError}
        isSavingLesson={isSavingLesson}
        lessonSaveError={lessonSaveError}
        isSavingContent={isSavingContent} // Added
        contentSaveError={contentSaveError} // Added
        onAddModule={addModule}
        onToggleModuleExpansion={toggleModuleExpansion}
        onUpdateModule={updateModuleData}
        onAddLesson={addLesson}
        onUpdateLesson={updateLessonData}
        onSaveLesson={saveLesson}
        onRemoveLesson={removeLesson}
        onAddContent={addContent}
        onSaveContent={saveContent} // Added
        onRemoveContent={removeContent} // Added
        onToggleLessonExpansion={toggleLessonExpansion}
        onToggleContentExpansion={toggleContentExpansion}
        onUpdateContent={updateContentData}
        onDeleteContent={deleteContentData}
        onSaveModule={saveModule}
        onRemoveModule={removeModule}
        onThumbnailUpload={handleThumbnailUpload}
        onThumbnailUrlSubmit={handleThumbnailUrlSubmit}
        onThumbnailRemove={handleThumbnailRemove}
        onVideoUpload={handleVideoUpload}
        onVideoUrlSubmit={handleVideoUrlSubmit}
        onVideoRemove={handleVideoRemove}
        onContentThumbnailUpload={handleContentThumbnailUpload}
        onContentThumbnailUrlSubmit={handleContentThumbnailUrlSubmit}
        onContentThumbnailRemove={handleContentThumbnailRemove}
        isModuleComplete={isModuleComplete}
        isLessonComplete={isLessonComplete}
        isLessonSaved={isLessonSaved}
        isContentComplete={isContentComplete} // Added
        isContentSaved={isContentSaved} // Added
      />

      <ScreenNavigation
        currentStep={11}
        previousScreen="screen10"
        nextScreen="screen12"
        nextButtonText="Review & Submit"
        setActiveScreen={setActiveScreen}
        isNextDisabled={validationErrors.length > 0}
      />
    </Container>
  );
};

export default Screen11;
