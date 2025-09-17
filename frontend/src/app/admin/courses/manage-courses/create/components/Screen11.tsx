import React, { useState, useMemo } from "react";
import { useCourseContext } from "../../../reducers/course/providers/CourseReducerProvider";
import Container from "@/app/admin/components/ui/Container";
import ScreenNavigation from "./shared/ScreenNavigation";
import { useScreen } from "../contexts/ScreenContext";
import { useCourses } from "@/hooks/useCourses";
import { sanitizeCourseForBackend } from "../../../reducers/course/utils/sanitization";
import { validateSanitizedCourse } from "../../../reducers/course/utils/sanitization";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
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
} from "lucide-react";

const Screen11 = () => {
  const { state } = useCourseContext();
  const { setActiveScreen } = useScreen();
  const { createCourseMetadata } = useCourses();
  
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string>("");
  const [courseCreated, setCourseCreated] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<string>("");


  // Comprehensive validation
  const validationChecks = useMemo(() => {
    const checks = [
      {
        id: "title",
        label: "Course Title",
        isValid: !!(state.course.title && state.course.title.trim().length >= 5),
        details: state.course.title ? `${state.course.title.length} characters` : "Missing",
        icon: FileText,
        color: "orange",
      },
      {
        id: "description",
        label: "Course Description",
        isValid: !!(state.course.description && state.course.description.trim().length >= 25),
        details: state.course.description ? `${state.course.description.length} characters` : "Missing",
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
        details: state.course.plans?.essential && state.course.plans?.elite ? "Both plans" : 
                state.course.plans?.essential ? "Essential only" :
                state.course.plans?.elite ? "Elite only" : "Missing",
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
        isValid: !!(state.course.metaTitle && state.course.metaDescription && state.course.keywords),
        details: state.course.metaTitle && state.course.metaDescription && state.course.keywords ? "Complete" : "Incomplete",
        icon: Zap,
        color: "blue",
      },
    ];

    return checks;
  }, [state.course]);

  const allValid = validationChecks.every(check => check.isValid);
  const invalidChecks = validationChecks.filter(check => !check.isValid);
  const validChecks = validationChecks.filter(check => check.isValid);

  // Course statistics
  const courseStats = useMemo(() => {
    return {
      skillsCount: state.course.skills?.length || 0,
      careerPathsCount: state.course.careerPaths?.length || 0,
      faqsCount: state.course.faqs?.length || 0,
      testimonialsCount: state.course.testimonials?.length || 0,
    };
  }, [state.course]);

  const handleCreateCourseMetadata = async () => {
    if (!allValid) {
      setCreateError("Please complete all required fields before creating the course.");
      return;
    }

    setIsCreating(true);
    setCreateError("");

    try {
      // Sanitize course data for backend (excluding modules)
      const sanitizedCourse = sanitizeCourseForBackend(state.course);
      
      // Validate sanitized data
      if (!validateSanitizedCourse(sanitizedCourse)) {
        throw new Error("Course data validation failed");
      }

      console.log("🚀 Creating course metadata with data:", sanitizedCourse);

      // Extract modules for later creation and create metadata only
      const { modules, ...courseMetadata } = sanitizedCourse;

      // Create course metadata only
      const result = await createCourseMetadata(courseMetadata);

      if (result.success && result.data?.courseId) {
        setCreatedCourseId(result.data.courseId);
        setCourseCreated(true);
        
        // Store course ID and modules in localStorage for module management
        localStorage.setItem("current_course_id", result.data.courseId);
        localStorage.setItem("course_modules_draft", JSON.stringify(modules || []));
      } else {
        setCreateError(result.error || "Failed to create course metadata");
      }
    } catch (error) {
      console.error("Error creating course metadata:", error);
      setCreateError(error instanceof Error ? error.message : "Failed to create course metadata");
    } finally {
      setIsCreating(false);
    }
  };

  const handleProceedToModules = () => {
    // Navigate to module management screen
    setActiveScreen("screen12");
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
      title="Review & Create Course Metadata"
      description="Review all course information before creating the course metadata. Modules can be added later."
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      style={{ scrollbarWidth: "thin" }}
    >
      {/* Success Banner - Course Created */}
      {courseCreated && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <CheckSquare className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-green-800 mb-1">
                🎉 Course Metadata Created Successfully!
              </h3>
              <p className="text-green-700 mb-3">
                Your course has been created with ID: <span className="font-mono font-bold">{createdCourseId}</span>
              </p>
              <p className="text-green-600 text-sm">
                You can now add modules to your course or proceed to manage it.
              </p>
            </div>
            <OrangeButton
              onClick={handleProceedToModules}
              className="flex items-center gap-2 shadow-lg px-6 py-3"
            >
              <BookOpen className="w-5 h-5" />
              Add Modules
            </OrangeButton>
          </div>
        </div>
      )}

      {/* Error Message */}
      {createError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{createError}</p>
          </div>
        </div>
      )}

      {/* Validation Summary */}
      <Container
        title="Course Validation"
        description={`${allValid 
          ? "All requirements met - Course is ready!" 
          : `${invalidChecks.length} validation issue${invalidChecks.length !== 1 ? 's' : ''} found - Please fix before creating`
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
                allValid ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-gradient-to-r from-orange-500 to-orange-500'
              }`}
              style={{ width: `${(validChecks.length / validationChecks.length) * 100}%` }}
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
                    <div className={`w-10 h-10 ${getColorClasses(check.color, check.isValid)} rounded-lg flex items-center justify-center`}>
                      <IconComponent className={`w-5 h-5 ${getIconColor(check.color, check.isValid)}`} />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">{check.label}</span>
                      <div className="text-sm text-gray-600">{check.details}</div>
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
                <span className="font-semibold text-lg">
                  Action Required
                </span>
                <div className="text-sm mt-1">
                  Please complete all required fields above before creating your course. 
                  Each section marked with a red icon needs attention.
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
                  <span className="text-gray-800">{state.course.category || "Not set"}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Pricing:</span>
                  <span className="text-gray-800">
                    {(() => {
                      const essentialPrice = state.course.plans?.essential?.price;
                      const elitePrice = state.course.plans?.elite?.price;
                      
                      if (essentialPrice !== undefined && elitePrice !== undefined) {
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
                  <span className="text-gray-800">{
                    state.course.audience === "college-students" ? "College Students" :
                    state.course.audience === "professionals" ? "Professionals" :
                    "Not set"
                  }</span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Duration:</span>
                  <span className="text-gray-800">{state.course.duration || "Not set"}</span>
                </div>
              </div>
            </div>

            {state.course.thumbnail && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Course Thumbnail</h4>
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
                    <span className="text-sm font-medium text-gray-600">Skills</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">{courseStats.skillsCount}</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-600">Career Paths</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">{courseStats.careerPathsCount}</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-600">Language</span>
                  </div>
                  <div className="text-lg font-bold text-orange-600">{state.course.language || "Not set"}</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-600">Duration</span>
                  </div>
                  <div className="text-lg font-bold text-orange-600">{state.course.duration || "Not set"}</div>
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
                  <span className="font-semibold text-gray-800">{courseStats.faqsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Testimonials</span>
                  <span className="font-semibold text-gray-800">{courseStats.testimonialsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Instructors</span>
                  <span className="font-semibold text-gray-800">{state.course.instructor?.length || 0}</span>
                </div>
              </div>
            </Container>
          </div>
        </div>
      </Container>


      {/* Navigation */}
      {!courseCreated ? (
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
              onClick={handleCreateCourseMetadata}
              disabled={!allValid || isCreating}
              className="flex items-center gap-2 px-6 py-3"
            >
              {isCreating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
              {isCreating ? "Creating Course..." : "Create Course Metadata"}
            </OrangeButton>
          </div>
        </div>
      ) : (
        <ScreenNavigation
          currentStep={11}
          previousScreen="screen9"
          nextScreen="screen12"
          setActiveScreen={setActiveScreen}
          isNextDisabled={false}
        />
      )}
    </Container>
  );
};

export default Screen11;