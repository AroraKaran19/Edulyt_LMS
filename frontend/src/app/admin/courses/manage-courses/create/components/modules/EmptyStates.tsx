import React from "react";
import { BookOpen, FileText, Video, HelpCircle, Sparkles } from "lucide-react";

interface EmptyModulesStateProps {
  onAddModule: () => void;
}

export const EmptyModulesState: React.FC<EmptyModulesStateProps> = ({ onAddModule }) => {
  return (
    <div className="text-center py-8 text-gray-500">
      <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p>No modules added yet</p>
      <p className="text-sm">Click "Add Module" to get started</p>
    </div>
  );
};

interface EmptyLessonsStateProps {
  onAddLesson: () => void;
  isModuleSaved?: boolean;
}

export const EmptyLessonsState: React.FC<EmptyLessonsStateProps> = ({ 
  onAddLesson, 
  isModuleSaved = true 
}) => {
  return (
    <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
      <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
      <p className="text-sm">No lessons added yet</p>
      {isModuleSaved ? (
        <p className="text-xs">Click "Add Lesson" to get started</p>
      ) : (
        <p className="text-xs text-amber-600">Save the module first to add lessons</p>
      )}
    </div>
  );
};

interface EmptyContentStateProps {
  onAddContent: (lessonId: string, type: "video" | "quiz") => void;
  lessonId: string;
  isLessonSaved?: boolean;
}

export const EmptyContentState: React.FC<EmptyContentStateProps> = ({
  onAddContent,
  lessonId,
  isLessonSaved = true,
}) => {
  return (
    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex justify-center mb-4">
        <div className="p-3 bg-white rounded-full shadow-sm">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
      </div>
      
          <h3 className="text-sm font-medium text-gray-900 mb-2">No content added yet</h3>
          {isLessonSaved ? (
            <p className="text-xs text-gray-500 mb-6 max-w-sm mx-auto">
              Start building your lesson by adding videos, quizzes, and other learning materials.
            </p>
          ) : (
            <p className="text-xs text-amber-600 mb-6 max-w-sm mx-auto">
              Save the lesson first to add content.
            </p>
          )}
          
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => onAddContent(lessonId, "video")}
              disabled={!isLessonSaved}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Video className="w-4 h-4" />
              Add Video
            </button>
            <button
              onClick={() => onAddContent(lessonId, "quiz")}
              disabled={!isLessonSaved}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HelpCircle className="w-4 h-4" />
              Add Quiz
            </button>
          </div>
      
      <div className="mt-4 flex items-center justify-center gap-1 text-xs text-gray-400">
        <Sparkles className="w-3 h-3" />
        <span>Tip: Start with a video introduction</span>
      </div>
    </div>
  );
};
