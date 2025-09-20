import React, { useState, useMemo, useEffect } from "react";
import { useEditCourseContext } from "../../../reducers/course/providers/EditCourseReducerProvider";
import Container from "@/app/admin/components/ui/Container";
import ScreenNavigation from "./shared/ScreenNavigation";
import { useScreen } from "../contexts/ScreenContext";
import { useEditCourse } from "@/hooks/useEditCourse";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { toast } from "react-toastify";
import {
  CheckCircle,
  AlertCircle,
  BookOpen,
  Send,
  Tag,
  Globe,
  Target,
  TrendingUp,
  FileText,
  Award,
  Clock,
  Star,
  Zap,
  Eye,
  CheckSquare,
  ArrowLeft,
  X,
} from "lucide-react";

const Screen10 = () => {
  const { state } = useEditCourseContext();
  const { setActiveScreen } = useScreen();
  const { updateCourseMetadata } = useEditCourse();

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string>("");
  const [courseUpdated, setCourseUpdated] = useState(false);
  const [courseId, setCourseId] = useState<string>("");

  // Load course ID from localStorage and check if course was already updated
  useEffect(() => {
    const storedCourseId = localStorage.getItem("current_course_id");
    if (storedCourseId) {
      setCourseId(storedCourseId);
    }
    
    // Check if course was already updated in this session
    const wasUpdated = sessionStorage.getItem('course_metadata_updated');
    if (wasUpdated === 'true') {
      setCourseUpdated(true);
    }
  }, []);

  // Clear any existing error messages when component mounts
  useEffect(() => {
    setUpdateError("");
  }, []);

  // Clear error when user starts updating again
  const clearError = () => {
    setUpdateError("");
  };

  // Comprehensive validation
  const validationChecks = useMemo(() => {
    const checks = [
      {
        id: "title",
        label: "Course Title",
        isValid: !!(
          state.course.title && state.course.title.trim().length >= 5
        ),
        details: state.course.title
          ? `${state.course.title.length} characters`
          : "Missing",
        icon: FileText,
        color: "orange",
      },
      {
        id: "description",
        label: "Course Description",
        isValid: !!(
          state.course.description &&
          state.course.description.trim().length >= 25
        ),
        details: state.course.description
          ? `${state.course.description.length} characters`
          : "Missing",
        icon: BookOpen,
        color: "blue",
      },
      {
        id: "category",
        label: "Course Category",
        isValid: !!state.course.category,
        details: state.course.category || "Missing",
        icon: Tag,
        color: "orange",
      },
      {
        id: "thumbnail",
        label: "Course Thumbnail",
        isValid: !!state.course.thumbnail,
        details: state.course.thumbnail ? "Uploaded" : "Missing",
        icon: Eye,
        color: "blue",
      },
      {
        id: "plans",
        label: "Pricing Plans",
        isValid: !!(state.course.plans?.essential || state.course.plans?.elite),
        details:
          state.course.plans?.essential && state.course.plans?.elite
            ? "Both plans"
            : state.course.plans?.essential
            ? "Essential only"
            : state.course.plans?.elite
            ? "Elite only"
            : "Missing",
        icon: TrendingUp,
        color: "blue",
      },
      // {
      //   id: "instructor",
      //   label: "Instructor",
      //   isValid: !!(state.course.instructor && state.course.instructor.length > 0),
      //   details: `${state.course.instructor?.length || 0} instructor(s)`,
      //   icon: Users,
      //   color: "orange",
      // },
      {
        id: "seo",
        label: "SEO Information",
        isValid: !!(
          state.course.metaTitle &&
          state.course.metaDescription &&
          state.course.keywords
        ),
        details:
          state.course.metaTitle &&
          state.course.metaDescription &&
          state.course.keywords
            ? "Complete"
            : "Incomplete",
        icon: Zap,
        color: "blue",
      },
    ];

    return checks;
  }, [state.course]);

  const allValid = validationChecks.every((check) => check.isValid);
  const invalidChecks = validationChecks.filter((check) => !check.isValid);
  const validChecks = validationChecks.filter((check) => check.isValid);

  // Course statistics
  const courseStats = useMemo(() => {
    return {
      skillsCount: state.course.skills?.length || 0,
      careerPathsCount: state.course.careerPaths?.length || 0,
      faqsCount: state.course.faqs?.length || 0,
      testimonialsCount: state.course.testimonials?.length || 0,
    };
  }, [state.course]);

  const handleUpdateCourseMetadata = async () => {
    if (!allValid) {
      const errorMessage =
        "Please complete all required fields before updating the course.";
      setUpdateError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    if (!courseId) {
      const errorMessage = "Course ID not found. Please restart course editing.";
      setUpdateError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    setIsUpdating(true);
    setUpdateError("");

    try {
      console.log("🚀 Updating course metadata for course ID:", courseId);
      console.log("Course data:", state.course);

      // Update course metadata
      const result = await updateCourseMetadata(courseId, state.course);

      if (result.success) {
        setCourseUpdated(true);
        // Mark as updated in session storage to persist across page refreshes
        sessionStorage.setItem('course_metadata_updated', 'true');
        toast.success("Course metadata updated successfully!");
      } else {
        const errorMessage =
          result.error || "Failed to update course metadata. Please try again.";
        setUpdateError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error updating course metadata:", error);

      // Handle different types of errors
      let errorMessage = "Failed to update course metadata. Please try again.";

      if (error instanceof Error) {
        // Network errors, API errors, etc.
        if (
          error.message.includes("Network Error") ||
          error.message.includes("fetch")
        ) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Request timed out. Please try again.";
        } else if (error.message.includes("400")) {
          errorMessage =
            "Invalid course data. Please check your input and try again.";
        } else if (error.message.includes("401")) {
          errorMessage = "Authentication failed. Please log in again.";
        } else if (error.message.includes("403")) {
          errorMessage = "You don't have permission to update courses.";
        } else if (error.message.includes("500")) {
          errorMessage = "Server error. Please try again later.";
        } else {
          errorMessage = error.message;
        }
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setUpdateError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProceedToModules = () => {
    // Navigate to module management screen
    setActiveScreen("screen11");
  };

  const getColorClasses = (color: string, isValid: boolean) => {
    const colorMap = {
      orange: isValid ? "bg-orange-500" : "bg-orange-100",
      blue: isValid ? "bg-orange-500" : "bg-orange-100",
    };
    return colorMap[color as keyof typeof colorMap] || "bg-gray-500";
  };

  const getIconColor = (color: string, isValid: boolean) => {
    const colorMap = {
      orange: isValid ? "text-white" : "text-orange-600",
      blue: isValid ? "text-white" : "text-orange-600",
    };
    return colorMap[color as keyof typeof colorMap] || "text-gray-600";
  };

  return (
    <Container
      title="Review & Update Course Metadata"
      description="Review all course information before updating the course metadata. Modules can be managed separately."
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      style={{ scrollbarWidth: "thin" }}
    >
      {/* Success Banner - Course Updated */}
      {courseUpdated && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <CheckSquare className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-green-800 mb-1">
                🎉 Course Metadata Updated Successfully!
              </h3>
              <p className="text-green-700 mb-3">
                Your course has been updated with ID:{" "}
                <span className="font-mono font-bold">{courseId}</span>
              </p>
              <p className="text-green-600 text-sm mb-2">
                You can now manage modules or proceed to finalize the course.
              </p>
            </div>
            <OrangeButton
              onClick={handleProceedToModules}
              className="flex items-center gap-2 shadow-lg px-6 py-3"
            >
              <BookOpen className="w-5 h-5" />
              Manage Modules
            </OrangeButton>
          </div>
        </div>
      )}

      {/* Error Message */}
      {updateError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700">{updateError}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800 transition-colors"
              title="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Validation Summary */}
      <Container
        title="Course Validation"
        description={`${
          allValid
            ? "All requirements met - Course is ready!"
            : `${invalidChecks.length} validation issue${
                invalidChecks.length !== 1 ? "s" : ""
              } found - Please fix before updating`
        }`}
        icon={Award}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="text-right">
            <div className="text-3xl font-bold text-orange-600">
              {validChecks.length}/{validationChecks.length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                allValid
                  ? "bg-gradient-to-r from-orange-500 to-orange-600"
                  : "bg-gradient-to-r from-orange-500 to-orange-500"
              }`}
              style={{
                width: `${
                  (validChecks.length / validationChecks.length) * 100
                }%`,
              }}
            ></div>
          </div>
        </div>

        {/* Validation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {validationChecks.map((check) => {
            const IconComponent = check.icon;
            return (
              <div
                key={check.id}
                className={`p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                  check.isValid
                    ? "border-orange-200 bg-orange-50 hover:bg-orange-100"
                    : "border-red-200 bg-red-50 hover:bg-red-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 ${getColorClasses(
                        check.color,
                        check.isValid
                      )} rounded-lg flex items-center justify-center`}
                    >
                      <IconComponent
                        className={`w-5 h-5 ${getIconColor(
                          check.color,
                          check.isValid
                        )}`}
                      />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">
                        {check.label}
                      </span>
                      <div className="text-sm text-gray-600">
                        {check.details}
                      </div>
                    </div>
                  </div>
                  {check.isValid ? (
                    <CheckCircle className="w-6 h-6 text-orange-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!allValid && (
          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl shadow-md">
            <div className="flex items-center gap-3 text-yellow-800">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <span className="font-semibold text-lg">Action Required</span>
                <div className="text-sm mt-1">
                  Please complete all required fields above before updating your
                  course. Each section marked with a red icon needs attention.
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>

      {/* Course Preview */}
      <Container
        title="Course Preview"
        description="Preview of your course information and statistics"
        icon={Eye}
        className="mb-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Course Details */}
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5">
              <h4 className="text-xl font-bold text-gray-800 mb-3">
                {state.course.title || "Untitled Course"}
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                {state.course.description || "No description provided"}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Tag className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Category:</span>
                  <span className="text-gray-800">
                    {state.course.category || "Not set"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Pricing:</span>
                  <span className="text-gray-800">
                    {(() => {
                      const essentialPrice =
                        state.course.plans?.essential?.price;
                      const elitePrice = state.course.plans?.elite?.price;

                      if (
                        essentialPrice !== undefined &&
                        elitePrice !== undefined
                      ) {
                        return `Essential: $${essentialPrice} | Elite: $${elitePrice}`;
                      } else if (essentialPrice !== undefined) {
                        return `Essential: $${essentialPrice}`;
                      } else if (elitePrice !== undefined) {
                        return `Elite: $${elitePrice}`;
                      } else {
                        return "Price Not Set";
                      }
                    })()}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Audience:</span>
                  <span className="text-gray-800">
                    {state.course.audience === "college-students"
                      ? "College Students"
                      : state.course.audience === "professionals"
                      ? "Professionals"
                      : "Not set"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Duration:</span>
                  <span className="text-gray-800">
                    {state.course.duration || "Not set"}
                  </span>
                </div>
              </div>
            </div>

            {state.course.thumbnail && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-3">
                  Course Thumbnail
                </h4>
                <img
                  src={state.course.thumbnail}
                  alt="Course thumbnail"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
              </div>
            )}
          </div>

          {/* Course Statistics */}
          <div className="space-y-6">
            <Container
              title="Course Statistics"
              description="Overview of your course content and metrics"
              icon={Star}
              className="mb-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-600">
                      Skills
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {courseStats.skillsCount}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-600">
                      Career Paths
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {courseStats.careerPathsCount}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-600">
                      Language
                    </span>
                  </div>
                  <div className="text-lg font-bold text-orange-600">
                    {state.course.language || "Not set"}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-600">
                      Duration
                    </span>
                  </div>
                  <div className="text-lg font-bold text-orange-600">
                    {state.course.duration || "Not set"}
                  </div>
                </div>
              </div>
            </Container>

            <Container
              title="Additional Content"
              description="Overview of supplementary course materials"
              icon={CheckCircle}
              className="mb-6"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">FAQs</span>
                  <span className="font-semibold text-gray-800">
                    {courseStats.faqsCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Testimonials</span>
                  <span className="font-semibold text-gray-800">
                    {courseStats.testimonialsCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Instructors</span>
                  <span className="font-semibold text-gray-800">
                    {state.course.instructor?.length || 0}
                  </span>
                </div>
              </div>
            </Container>
          </div>
        </div>
      </Container>

      {/* Navigation */}
      {!courseUpdated ? (
        <div className="flex-shrink-0 bg-white border-t border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setActiveScreen("screen9")}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to SEO
            </button>

            <OrangeButton
              onClick={handleUpdateCourseMetadata}
              disabled={!allValid || isUpdating}
              className="flex items-center gap-2 px-6 py-3"
            >
              {isUpdating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : updateError ? (
                <Send className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {isUpdating
                ? "Updating Course..."
                : updateError
                ? "Retry Updating Course"
                : "Update Course Metadata"}
            </OrangeButton>
          </div>
        </div>
      ) : (
        <ScreenNavigation
          currentStep={10}
          previousScreen="screen9"
          nextScreen="screen11"
          setActiveScreen={setActiveScreen}
          isNextDisabled={false}
        />
      )}
    </Container>
  );
};

export default Screen10;
