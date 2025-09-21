import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Container from "@/app/admin/components/ui/Container";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { useCourseContext } from "../../../reducers/course/providers/CourseReducerProvider";
import { draftUtils } from "../utils/draftUtils";
import { useScreen } from "../contexts/ScreenContext";
import { useCourseModules } from "./modules/hooks/useCourseModules";
import { updateCourseModuleIds } from "./modules/api/moduleApi";
import {
  BookOpen,
  Plus,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Upload,
  FileText,
  Video,
  Award,
} from "lucide-react";

const Screen12 = () => {
  const router = useRouter();
  const { setActiveScreen } = useScreen();

  // Use the same hook as Screen11 for consistent data loading
  const { course, savedModules, getModuleIds } = useCourseModules();

  const [courseId, setCourseId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<
    "review" | "submit" | "complete"
  >("review");

  // Get modules from the course data
  const modules = course.modules || [];

  // Load course ID from localStorage
  useEffect(() => {
    const storedCourseId = localStorage.getItem("current_course_id");

    if (!storedCourseId) {
      // No course ID found, redirect back to course creation
      router.push("/admin/courses/manage-courses/create");
      return;
    }

    setCourseId(storedCourseId);
  }, [router]);

  const handleCompleteCourse = async () => {
    if (!courseId) {
      setSubmitError("Course ID not found. Please restart course creation.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setCurrentStep("submit");

    try {
      console.log("🚀 Completing course creation:", courseId);
      console.log("Modules already saved individually:", modules.length);

      // Get module IDs from localStorage
      const moduleIds = getModuleIds();
      console.log("Module IDs to send to course:", moduleIds);

      // Update course with module references
      if (moduleIds.length > 0) {
        console.log("Sending module references to course:", moduleIds);
        await updateCourseModuleIds(courseId, moduleIds);
        console.log("Course module references updated successfully");
      } else {
        console.log("No modules to add to course");
      }

      setCurrentStep("complete");

      // Clear all stored data
      draftUtils.clearAll();

      // Auto-redirect after a delay
      setTimeout(() => {
        router.push("/admin/courses/manage-courses");
      }, 3000);
    } catch (error) {
      console.error("Error completing course creation:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to complete course creation"
      );
      setCurrentStep("review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    // Go back to course metadata review
    setActiveScreen("screen11");
  };

  if (currentStep === "complete") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <Container className="max-w-2xl mx-auto text-center">
            <div className="p-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                🎉 Course Created Successfully!
              </h1>

              <p className="text-lg text-gray-600 mb-6">
                Your course has been created and is ready for students. You'll
                be redirected to the course management page shortly.
              </p>

              <div className="flex justify-center gap-4">
                <OrangeButton
                  onClick={() => router.push("/admin/courses/manage-courses")}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  Manage Courses
                </OrangeButton>

                <WhiteButton
                  onClick={() =>
                    router.push("/admin/courses/manage-courses/create")
                  }
                  className="flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Another Course
                </WhiteButton>
              </div>
            </div>
          </Container>
        </div>
      </div>
    );
  }

  if (currentStep === "submit") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <Container className="max-w-2xl mx-auto text-center">
            <div className="p-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Completing Course Creation...
              </h1>

              <p className="text-gray-600 mb-6">
                Updating course with module references and finalizing the
                creation process.
              </p>

              <div className="space-y-2 text-left max-w-md mx-auto">
                <div className="flex items-center gap-3 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>Course metadata created</span>
                </div>
                <div className="flex items-center gap-3 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>Modules saved in real-time</span>
                </div>
                <div className="flex items-center gap-3 text-blue-600">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating course module references...</span>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-500 rounded-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Add Course Modules
            </h2>
            <p className="text-gray-600">
              Your modules are already saved! Finalize the course creation to
              complete the process
            </p>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <h4 className="text-red-800 font-semibold">Error</h4>
              <p className="text-red-700 text-sm">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Course Status */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-green-800">
              Course Metadata Created
            </h3>
            <p className="text-green-700 text-sm">Course ID: {courseId}</p>
          </div>
        </div>
        <p className="text-green-700">
          Your course metadata has been successfully created. Now you can add
          modules or skip to finalize the course.
        </p>
      </div>

      {/* Course Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">{modules.length}</h3>
              <p className="text-blue-700 text-sm">Modules</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">
                {modules.reduce(
                  (total, module) => total + (module.lessons?.length || 0),
                  0
                )}
              </h3>
              <p className="text-green-700 text-sm">Lessons</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900">
                {modules.reduce(
                  (total, module) =>
                    total +
                    (module.lessons?.reduce(
                      (lessonTotal, lesson) =>
                        lessonTotal + (lesson.contents?.length || 0),
                      0
                    ) || 0),
                  0
                )}
              </h3>
              <p className="text-purple-700 text-sm">Content Items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <Container
        title="Course Modules & Content"
        description={`${modules.length} module${
          modules.length !== 1 ? "s" : ""
        } with all content ready for finalization`}
        icon={BookOpen}
        className="flex-1 mb-6"
      >
        {modules.length > 0 ? (
          <div className="space-y-4">
            {modules.map((module, index) => {
              const isModuleSaved = savedModules.has(index);
              const totalLessons = module.lessons?.length || 0;
              const totalContent =
                module.lessons?.reduce(
                  (total, lesson) => total + (lesson.contents?.length || 0),
                  0
                ) || 0;

              return (
                <div
                  key={module._id || index}
                  className={`border rounded-xl p-4 bg-white hover:shadow-sm transition-shadow ${
                    isModuleSaved
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {index + 1}. {module.title || "Untitled Module"}
                        </h4>
                        {isModuleSaved && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                            Saved
                          </span>
                        )}
                      </div>

                      {module.description && (
                        <p className="text-gray-600 text-sm mb-3">
                          {module.description}
                        </p>
                      )}

                      <div className="flex items-center gap-6 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Video className="w-4 h-4" />
                          <span>
                            {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>
                            {totalContent} content item
                            {totalContent !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {module.thumbnailUrl && (
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            <span>Has thumbnail</span>
                          </div>
                        )}
                      </div>

                      {/* Show lessons preview */}
                      {totalLessons > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Lessons:
                          </h5>
                          <div className="space-y-1">
                            {module.lessons
                              ?.slice(0, 3)
                              .map((lesson, lessonIndex) => (
                                <div
                                  key={lesson._id || lessonIndex}
                                  className="flex items-center gap-2 text-xs text-gray-600"
                                >
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                  <span>
                                    {lesson.title ||
                                      `Lesson ${lessonIndex + 1}`}
                                  </span>
                                  {lesson.contents &&
                                    lesson.contents.length > 0 && (
                                      <span className="text-gray-400">
                                        ({lesson.contents.length} content
                                        {lesson.contents.length !== 1
                                          ? "s"
                                          : ""}
                                        )
                                      </span>
                                    )}
                                </div>
                              ))}
                            {totalLessons > 3 && (
                              <div className="text-xs text-gray-400">
                                +{totalLessons - 3} more lesson
                                {totalLessons - 3 !== 1 ? "s" : ""}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isModuleSaved ? "bg-green-100" : "bg-blue-100"
                        }`}
                      >
                        <span
                          className={`text-sm font-bold ${
                            isModuleSaved ? "text-green-600" : "text-blue-600"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Modules Found
            </h3>
            <p className="text-gray-500 mb-6">
              You can create a course without modules and add them later through
              the course management interface.
            </p>
            <WhiteButton
              onClick={() => setActiveScreen("screen11")}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add Modules
            </WhiteButton>
          </div>
        )}
      </Container>

      {/* Action Buttons */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <WhiteButton
            onClick={handleGoBack}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course Review
          </WhiteButton>

          <OrangeButton
            onClick={handleCompleteCourse}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {isSubmitting
              ? "Completing..."
              : `Complete Course${
                  modules.length > 0
                    ? ` (${modules.length} Module${
                        modules.length !== 1 ? "s" : ""
                      })`
                    : ""
                }`}
          </OrangeButton>
        </div>
      </div>
    </div>
  );
};

export default Screen12;
