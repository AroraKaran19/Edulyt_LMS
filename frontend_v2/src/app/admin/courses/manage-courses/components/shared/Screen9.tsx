import React, { useState, useMemo, useEffect } from "react";
import Container from "@/app/admin/components/ui/Container";
import {
  CheckCircle,
  AlertCircle,
  BookOpen,
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
  Loader2,
} from "lucide-react";
import { useFormContext } from "react-hook-form";
import { transformFormDataToCourse } from "@/utils/courseFormUtils";
import { useCourseFormContext } from "@/contexts/CourseFormContext";

const Screen9 = () => {
  // Form context
  const {
    watch,
  } = useFormContext();

  // Course form context for loading states
  const { isCreating, isUpdating } = useCourseFormContext();

  // Watch all form values
  const formData = watch();

  // Client-side mounting state
  const [isMounted, setIsMounted] = useState(false);


  // Client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);


  // Transform form data to course object for validation and display
  const course = useMemo(() => {
    if (!isMounted || !formData) return null;
    return transformFormDataToCourse(formData as any);
  }, [formData, isMounted]);

  // Comprehensive validation
  const validationChecks = useMemo(() => {
    const checks = [
      {
        id: "title",
        label: "Course Title",
        isValid: !!(course?.title && course?.title.trim().length >= 5),
        details: course?.title
          ? `${course?.title.length} characters`
          : "Missing",
        icon: FileText,
        color: "orange",
      },
      {
        id: "description",
        label: "Course Description",
        isValid: !!(
          course?.description && course?.description.trim().length >= 25
        ),
        details: course?.description
          ? `${course?.description.length} characters`
          : "Missing",
        icon: BookOpen,
        color: "blue",
      },
      {
        id: "category",
        label: "Course Category",
        isValid: !!course?.category,
        details: course?.category || "Missing",
        icon: Tag,
        color: "orange",
      },
      {
        id: "thumbnail",
        label: "Course Thumbnail",
        isValid: !!course?.thumbnail,
        details: course?.thumbnail ? "Uploaded" : "Missing",
        icon: Eye,
        color: "blue",
      },
      {
        id: "plans",
        label: "Pricing Plans",
        isValid: !!(course?.plans?.essential || course?.plans?.elite),
        details:
          course?.plans?.essential && course?.plans?.elite
            ? "Both plans"
            : course?.plans?.essential
            ? "Essential only"
            : course?.plans?.elite
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
        id: "curriculum",
        label: "Course Curriculum",
        isValid: !!course?.curriculum,
        details: course?.curriculum ? "Uploaded" : "Not provided (optional)",
        icon: BookOpen,
        color: "blue",
      },
      {
        id: "brochure",
        label: "Course Brochure",
        isValid: !!course?.brochure,
        details: course?.brochure ? "Uploaded" : "Not provided (optional)",
        icon: FileText,
        color: "blue",
      },
      {
        id: "seo",
        label: "SEO Information",
        isValid: !!(
          course?.metaTitle &&
          course?.metaDescription &&
          course?.keywords
        ),
        details:
          course?.metaTitle && course?.metaDescription && course?.keywords
            ? "Complete"
            : "Incomplete",
        icon: Zap,
        color: "blue",
      },
    ];

    return checks;
  }, [course]);

  // Only require non-optional fields for validation
  const requiredChecks = validationChecks.filter(
    (check) => !["curriculum", "brochure"].includes(check.id)
  );
  const allValid = requiredChecks.every((check) => check.isValid);
  const invalidChecks = requiredChecks.filter((check) => !check.isValid);
  const validChecks = requiredChecks.filter((check) => check.isValid);

  // Course statistics
  const courseStats = useMemo(() => {
    return {
      skillsCount: course?.skills?.length || 0,
      careerPathsCount: course?.careerPaths?.length || 0,
      faqsCount: course?.faqs?.length || 0,
      testimonialsCount: course?.testimonials?.length || 0,
    };
  }, [course]);



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

  // Show loading during SSR
  if (!isMounted) {
    return (
      <Container
        title="Review & Create Course Metadata (Screen 9)"
        description="Review all course information before creating the course metadata. Modules can be added later."
        className="h-full w-full max-h-full overflow-y-auto flex flex-col"
        classNameBody="flex flex-col gap-6"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            <span className="text-gray-600">Loading course data...</span>
          </div>
        </div>
      </Container>
    );
  }

  // Show loading when creating/updating course
  if (isCreating || isUpdating) {
    return (
      <Container
        title="Review & Create Course Metadata (Screen 9)"
        description="Review all course information before creating the course metadata. Modules can be added later."
        className="h-full w-full max-h-full overflow-y-auto flex flex-col"
        classNameBody="flex flex-col gap-6"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              <span className="text-lg font-medium text-gray-700">
                {isCreating ? "Creating Course..." : "Updating Course..."}
              </span>
            </div>
            <p className="text-sm text-gray-500 text-center max-w-md">
              {isCreating 
                ? "Please wait while we create your course metadata. This may take a few moments."
                : "Please wait while we update your course metadata. This may take a few moments."
              }
            </p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container
      title="Review & Create Course Metadata"
      description="Review all course information before creating the course metadata. Modules can be added later."
      className="h-full w-full max-h-full overflow-y-auto flex flex-col"
      classNameBody="flex flex-col gap-6"
      style={{ scrollbarWidth: "thin" }}
    >

      {/* Publishing Notice */}
      <Container
        title="Important Notice"
        description="Please read this carefully before proceeding"
        icon={AlertCircle}
        className="mb-6 h-fit shadow-none border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50"
        classNameBody="flex flex-col gap-4 overflow-visible"
      >
        <div className="flex items-start gap-4 p-4 bg-white rounded-xl border-2 border-amber-200 shadow-sm">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
            <Zap className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-amber-800 mb-2">
              Course Will Be Published Automatically
            </h4>
            <p className="text-amber-700 text-sm leading-relaxed mb-3">
              Creating course metadata will automatically <strong>publish your course</strong> and make it visible to students. 
              Make sure all information is accurate and complete before proceeding.
            </p>
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <CheckCircle className="w-4 h-4" />
              <span>You can edit course details after publishing</span>
            </div>
          </div>
        </div>
      </Container>

      {/* Validation Summary */}
      <Container
        title="Course Validation"
        description={`${
          allValid
            ? "All requirements met - Course is ready to publish!"
            : `${invalidChecks.length} validation issue${
                invalidChecks.length !== 1 ? "s" : ""
              } found - Please fix before creating`
        }`}
        icon={Award}
        className="mb-6 h-fit shadow-none"
        classNameBody="flex flex-col gap-6 overflow-visible"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="text-right">
            <div className="text-3xl font-bold text-orange-600">
              {validChecks.length}/{requiredChecks.length}
            </div>
            <div className="text-sm text-gray-600">
              Required Fields Completed
            </div>
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
                width: `${(validChecks.length / requiredChecks.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Validation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {validationChecks.map((check) => {
            const IconComponent = check.icon;
            const isOptional = ["curriculum", "brochure"].includes(check.id);
            return (
              <div
                key={check.id}
                className={`p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                  check.isValid
                    ? "border-orange-200 bg-orange-50 hover:bg-orange-100"
                    : isOptional
                    ? "border-gray-200 bg-gray-50 hover:bg-gray-100"
                    : "border-red-200 bg-red-50 hover:bg-red-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 ${
                        isOptional
                          ? check.isValid
                            ? "bg-orange-500"
                            : "bg-gray-300"
                          : getColorClasses(check.color, check.isValid)
                      } rounded-lg flex items-center justify-center`}
                    >
                      <IconComponent
                        className={`w-5 h-5 ${
                          isOptional
                            ? check.isValid
                              ? "text-white"
                              : "text-gray-600"
                            : getIconColor(check.color, check.isValid)
                        }`}
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
                  ) : isOptional ? (
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-500">-</span>
                    </div>
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
                  Please complete all required fields above before publishing your
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
        className="mb-6 h-fit shadow-none"
        classNameBody="h-fit flex flex-col gap-6 overflow-visible"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Course Details */}
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5">
              <h4 className="text-xl font-bold text-gray-800 mb-3">
                {course?.title || "Untitled Course"}
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                {course?.description || "No description provided"}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Tag className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Category:</span>
                  <span className="text-gray-800">
                    {course?.category || "Not set"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Pricing:</span>
                  <span className="text-gray-800">
                    {(() => {
                      const essentialPrice = course?.plans?.essential?.price;
                      const elitePrice = course?.plans?.elite?.price;

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
                    {course?.audience === "college-students"
                      ? "College Students"
                      : course?.audience === "professionals"
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
                    {course?.duration || "Not set"}
                  </span>
                </div>
              </div>
            </div>

            {course?.thumbnail && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-3">
                  Course Thumbnail
                </h4>
                <img
                  src={course?.thumbnail}
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
              className="mb-6 h-fit shadow-none"
              classNameBody="h-fit flex flex-col gap-6 overflow-visible"
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
                    {course?.language || "Not set"}
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
                    {course?.duration || "Not set"}
                  </div>
                </div>
              </div>
            </Container>

            <Container
              title="Additional Content"
              description="Overview of supplementary course materials"
              icon={CheckCircle}
              className="mb-6 h-fit shadow-none"
              classNameBody="h-fit flex flex-col gap-6 overflow-visible"
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
                    {course?.instructor?.length || 0}
                  </span>
                </div>
              </div>
            </Container>
          </div>
        </div>
      </Container>
    </Container>
  );
};

export default Screen9;
