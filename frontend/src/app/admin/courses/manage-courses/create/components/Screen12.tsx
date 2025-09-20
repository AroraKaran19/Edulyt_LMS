import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Container from "@/app/admin/components/ui/Container";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { useCourses } from "@/hooks/useCourses";
import { useCourseContext } from "../../../reducers/course/providers/CourseReducerProvider";
import { draftUtils } from "../utils/draftUtils";
import { useScreen } from "../contexts/ScreenContext";
import { CourseModule } from "@/types/course";
import {
  BookOpen,
  Plus,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Upload,
  FileText,
  Video,
  Clock,
  Target,
} from "lucide-react";

const Screen12 = () => {
  const router = useRouter();
  const { setActiveScreen } = useScreen();
  const { state } = useCourseContext();
  const { finalizeCourseCreation } = useCourses();
  
  const [courseId, setCourseId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<"review" | "submit" | "complete">("review");
  
  // Get modules from course state or localStorage as fallback
  const [modules, setModules] = useState<CourseModule[]>([]);
  
  // Load modules from state or localStorage
  useEffect(() => {
    console.log("Screen12 - Loading modules from state:", state.course.modules);
    const stateModules = state.course.modules || [];
    console.log("Screen12 - State modules length:", stateModules.length);
    
    if (stateModules.length > 0) {
      console.log("Screen12 - Using modules from state");
      setModules(stateModules);
    } else {
      console.log("Screen12 - No modules in state, checking localStorage");
      // Fallback to localStorage
      const storedModules = localStorage.getItem("course_modules_draft");
      console.log("Screen12 - Stored modules from localStorage:", storedModules);
      
      if (storedModules) {
        try {
          const parsedModules = JSON.parse(storedModules);
          console.log("Screen12 - Parsed modules from localStorage:", parsedModules);
          setModules(parsedModules);
        } catch (error) {
          console.error("Error parsing stored modules:", error);
          setModules([]);
        }
      } else {
        console.log("Screen12 - No modules found in localStorage either");
        setModules([]);
      }
    }
  }, [state.course.modules]);
  
  // Debug logging
  useEffect(() => {
    console.log("Screen12 - Course state:", state.course);
    console.log("Screen12 - Modules from state:", state.course.modules);
    console.log("Screen12 - Modules from local state:", modules);
    console.log("Screen12 - Modules count:", modules.length);
    console.log("Screen12 - Course ID:", courseId);
    
    // Also check localStorage for modules
    const storedModules = localStorage.getItem("course_modules_draft");
    if (storedModules) {
      try {
        const parsedModules = JSON.parse(storedModules);
        console.log("Screen12 - Modules from localStorage:", parsedModules);
      } catch (error) {
        console.error("Screen12 - Error parsing localStorage modules:", error);
      }
    }
  }, [state.course, modules, courseId]);

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

  const handleSubmitModules = async () => {
    if (!courseId) {
      setSubmitError("Course ID not found. Please restart course creation.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setCurrentStep("submit");

    try {
      console.log("🚀 Finalizing course creation:", courseId);
      console.log("Modules already saved individually:", modules.length);

      // Since modules are now saved individually in real-time, 
      // we only need to finalize the course creation
      console.log("Finalizing course creation for course ID:", courseId);
      const finalizeResult = await finalizeCourseCreation(courseId);
      
      if (finalizeResult.success) {
        console.log("Course finalized successfully:", finalizeResult);
        setCurrentStep("complete");
        
        // Clear all stored data
        localStorage.removeItem("current_course_id");
        draftUtils.clearAll();
        
        // Auto-redirect after a delay
        setTimeout(() => {
          router.push("/admin/courses/manage-courses");
        }, 3000);
      } else {
        console.error("Course finalization failed:", finalizeResult.error);
        throw new Error(finalizeResult.error || "Failed to finalize course");
      }
    } catch (error) {
      console.error("Error creating course:", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to create course");
      setCurrentStep("review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    // Go back to course metadata review
    setActiveScreen("screen11");
  };

  const handleSkipModules = async () => {
    if (!courseId) {
      setSubmitError("Course ID not found. Please restart course creation.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setCurrentStep("submit");

    try {
      console.log("🚀 Skipping modules, finalizing course:", courseId);

      // Step 3: Finalize course creation without modules
      const finalizeResult = await finalizeCourseCreation(courseId);
      
      if (finalizeResult.success) {
        setCurrentStep("complete");
        
        // Clear all stored data
        localStorage.removeItem("current_course_id");
        draftUtils.clearAll();
        
        // Auto-redirect after a delay
        setTimeout(() => {
          router.push("/admin/courses/manage-courses");
        }, 3000);
      } else {
        throw new Error(finalizeResult.error || "Failed to finalize course");
      }
    } catch (error) {
      console.error("Error finalizing course:", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to finalize course");
      setCurrentStep("review");
    } finally {
      setIsSubmitting(false);
    }
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
                Your course has been created and is ready for students. You'll be redirected to the course management page shortly.
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
                  onClick={() => router.push("/admin/courses/manage-courses/create")}
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
                Creating Your Course...
              </h1>
              
              <p className="text-gray-600 mb-6">
                Please wait while we finalize your course creation. This may take a few moments.
              </p>
              
              <div className="space-y-2 text-left max-w-md mx-auto">
                <div className="flex items-center gap-3 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>Course metadata created</span>
                </div>
                <div className="flex items-center gap-3 text-blue-600">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Finalizing course creation...</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Clock className="w-5 h-5" />
                  <span>Finalizing course</span>
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
            <h2 className="text-2xl font-bold text-gray-900">Add Course Modules</h2>
            <p className="text-gray-600">
              Your modules are already saved! Finalize the course creation to complete the process
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
            <h3 className="text-lg font-semibold text-green-800">Course Metadata Created</h3>
            <p className="text-green-700 text-sm">Course ID: {courseId}</p>
          </div>
        </div>
        <p className="text-green-700">
          Your course metadata has been successfully created. Now you can add modules or skip to finalize the course.
        </p>
      </div>

      {/* Modules Section */}
      <Container
        title="Course Modules"
        description={`${modules.length} module${modules.length !== 1 ? 's' : ''} ready to be added`}
        icon={BookOpen}
        className="flex-1 mb-6"
      >
        {modules.length > 0 ? (
          <div className="space-y-4">
            {modules.map((module, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {index + 1}. {module.title || "Untitled Module"}
                    </h4>
                    {module.description && (
                      <p className="text-gray-600 text-sm mb-3">{module.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Video className="w-4 h-4" />
                        <span>{module.lessons?.length || 0} lessons</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>
                          {module.lessons?.reduce((total: number, lesson: any) => 
                            total + (lesson.contents?.length || 0), 0) || 0} content items
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-bold">{index + 1}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Modules Found</h3>
            <p className="text-gray-500 mb-6">
              You can create a course without modules and add them later through the course management interface.
            </p>
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

          <div className="flex gap-3">
            <WhiteButton
              onClick={handleSkipModules}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Skip Modules
            </WhiteButton>

            <OrangeButton
              onClick={handleSubmitModules}
              disabled={isSubmitting || modules.length === 0}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isSubmitting ? "Finalizing..." : `Finalize Course (${modules.length} Module${modules.length !== 1 ? 's' : ''} Saved)`}
            </OrangeButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Screen12;

