import Container from "@/app/admin/components/ui/Container";
import React, { useState, useMemo } from "react";
import { useCourseContext } from "../../../course-reducer/CourseReducerProvider";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import ScreenNavigation from "./shared/ScreenNavigation";
import {
  CheckCircle,
  AlertCircle,
  BookOpen,
  FileText,
  Send,
  Tag,
  Globe,
  Target,
  TrendingUp,
  User,
  Award,
} from "lucide-react";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { useRouter } from "next/navigation";
import { useCourses } from "@/hooks/useCourses";

interface Screen8Props {
  isEditMode?: boolean;
  courseId?: string;
}

const Screen8 = ({ isEditMode = false, courseId }: Screen8Props = {}) => {
  const { state, actions } = useCourseContext();
  const { createCourse, updateCourse } = useCourses();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const router = useRouter();

  // Comprehensive validation
  const validationChecks = useMemo(() => {
    const checks = [
      {
        id: "basic-info",
        label: "Basic Information",
        isValid: !!(state.course.title && state.course.description),
        details: "Course title and description",
      },
      {
        id: "learning-outcomes",
        label: "Learning Outcomes",
        isValid: !!(
          state.course.whatYouWillLearn && 
          state.course.skills.length > 0 &&
          state.course.highlights.length > 0 &&
          state.course.highlights.every(h => h.title.trim() && h.description.trim())
        ),
        details: "What students will learn, skills, and highlights",
      },
      {
        id: "course-details",
        label: "Course Details",
        isValid: !!(
          state.course.skillLevel &&
          state.course.language &&
          state.course.whoShouldJoin
        ),
        details: "Skill level, language, and target audience",
      },
      {
        id: "media",
        label: "Course Media",
        isValid: !!state.course.thumbnail,
        details: "Course thumbnail (preview video optional)",
      },
      {
        id: "pricing",
        label: "Pricing & Setup",
        isValid: !!(
          (state.course.plans?.essential?.price !== undefined ||
            state.course.plans?.elite?.price !== undefined) &&
          state.course.category
        ),
        details: "Course price and category",
      },
      {
        id: "modules",
        label: "Course Content",
        isValid: (() => {
          // Check if at least one module exists
          if (!state.course.modules || state.course.modules.length === 0) return false;
          
          // Check if at least one module has at least one lesson
          const hasLessons = state.course.modules.some(module => 
            module && module.lessons && module.lessons.length > 0
          );
          if (!hasLessons) return false;
          
          // Check if at least one lesson has at least one video content
          const hasVideoContent = state.course.modules.some(module => 
            module && module.lessons && module.lessons.some(lesson => 
              lesson && lesson.contents && lesson.contents.some(content => 
                content && content.type === "video"
              )
            )
          );
          if (!hasVideoContent) return false;
          
          // Check that all content has titles
          const allContentHasTitles = state.course.modules.every(module => 
            !module || !module.lessons || module.lessons.every(lesson =>
              !lesson || !lesson.contents || lesson.contents.every(content =>
                !content || (content.title && content.title.trim() !== "")
              )
            )
          );
          
          return allContentHasTitles;
        })(),
        details: "At least one module, one lesson, one video content, and all content must have titles",
      },
      {
        id: "testimonials",
        label: "Testimonials",
        isValid: (() => {
          // Check if at least one testimonial exists
          if (!state.course.testimonials || state.course.testimonials.length === 0) return false;
          
          // Check if at least one testimonial is complete
          const hasCompleteTestimonial = state.course.testimonials.some(testimonial => 
            testimonial.name && testimonial.name.trim() !== "" &&
            testimonial.comment && testimonial.comment.trim() !== "" &&
            testimonial.currentRole && testimonial.currentRole.trim() !== "" &&
            testimonial.currentCompany && testimonial.currentCompany.trim() !== ""
          );
          
          return hasCompleteTestimonial;
        })(),
        details: "At least one complete testimonial (name, comment, role, and company)",
      },
      {
        id: "administrative",
        label: "Administrative Info",
        isValid: true, // Optional field - always valid
        details: "Created by field is optional",
      },
    ];

    return checks;
  }, [state.course]);

  const allValid = validationChecks.every((check) => check.isValid);
  const validCount = validationChecks.filter((check) => check.isValid).length;

  // Calculate course statistics
  const courseStats = useMemo(() => {
    const moduleCount = state.course.modules?.length || 0;

    return {
      moduleCount,
      skillsCount: state.course.skills?.length || 0,
      careerPathsCount: state.course.careerPaths?.length || 0,
      testimonialsCount: state.course.testimonials?.length || 0,
    };
  }, [state.course]);

  // Handle course submission
  const handleSubmitCourse = async () => {
    console.log("🚀 Starting course submission process...");
    
    if (!allValid) {
      setSubmitError(
        "Please complete all required sections before submitting."
      );
      return;
    }

    // Log the complete course state before submission
    console.log("=== COURSE CREATION/UPDATE - COMPLETE STATE ===");
    console.log("Course State:", JSON.stringify(state.course, null, 2));
    
    // Log course structure in a more readable format
    console.log("Course Structure:", {
      basicInfo: {
        title: state.course.title,
        category: state.course.category,
        subcategory: state.course.subcategory,
        audience: state.course.audience,
        language: state.course.language,
        skillLevel: state.course.skillLevel,
        duration: state.course.duration,
      },
      media: {
        thumbnail: state.course.thumbnail ? "Uploaded" : "Not uploaded",
        previewVideo: state.course.previewVideoUrl ? "Uploaded" : "Not uploaded",
      },
      content: {
        modules: state.course.modules?.map(module => ({
          title: module.title,
          lessonsCount: module.lessons?.length || 0,
          contentsCount: module.lessons?.reduce((total, lesson) => 
            total + (lesson.contents?.length || 0), 0) || 0,
        })) || [],
      },
      pricing: {
        essentialPlan: state.course.plans?.essential ? {
          title: state.course.plans.essential.title,
          price: state.course.plans.essential.price,
          billingPeriod: state.course.plans.essential.billingPeriod,
          isActive: state.course.plans.essential.isActive,
          featuresCount: state.course.plans.essential.features?.length || 0,
        } : null,
        elitePlan: state.course.plans?.elite ? {
          title: state.course.plans.elite.title,
          price: state.course.plans.elite.price,
          billingPeriod: state.course.plans.elite.billingPeriod,
          isActive: state.course.plans.elite.isActive,
          isPopular: state.course.plans.elite.isPopular,
          featuresCount: state.course.plans.elite.features?.length || 0,
        } : null,
      },
    });
    
    console.log("Course Statistics:", {
      moduleCount: state.course.modules?.length || 0,
      lessonCount: state.course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0,
      contentCount: state.course.modules?.reduce((total, module) => 
        total + module.lessons?.reduce((lessonTotal, lesson) => 
          lessonTotal + (lesson.contents?.length || 0), 0) || 0, 0) || 0,
      skillsCount: state.course.skills?.length || 0,
      highlightsCount: state.course.highlights?.length || 0,
      careerPathsCount: state.course.careerPaths?.length || 0,
      testimonialsCount: state.course.testimonials?.length || 0,
      faqsCount: state.course.faqs?.length || 0,
      reviewsCount: state.course.reviews?.length || 0,
      hasEssentialPlan: !!state.course.plans?.essential,
      hasElitePlan: !!state.course.plans?.elite,
    });
    console.log("Validation Status:", {
      allValid,
      validCount,
      totalChecks: validationChecks.length,
      failedChecks: validationChecks.filter(check => !check.isValid).map(check => check.label)
    });
    console.log("=== END COURSE STATE LOG ===");

    setIsSubmitting(true);
    setSubmitError("");

    try {
      let result;
      
      if (isEditMode && courseId) {
        // Update existing course
        result = await updateCourse(courseId, state.course);
        console.log("Course update result:", result);
      } else {
        // Create new course
        result = await createCourse(state.course);
        console.log("Course creation result:", result);
      }

      if (result.success) {
        setSubmitSuccess(true);
        
        // Clear draft from localStorage
        if (isEditMode && courseId) {
          localStorage.removeItem(`course_edit_${courseId}_draft`);
          localStorage.removeItem(`course_edit_${courseId}_current_screen`);
        } else {
          localStorage.removeItem("course_creation_draft");
          localStorage.removeItem("course_creation_current_screen");
        }
      } else {
        setSubmitError(result.error || result.message || `Failed to ${isEditMode ? 'update' : 'create'} course.`);
      }
    } catch (error) {
      console.error(`Course ${isEditMode ? 'update' : 'creation'} failed:`, error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : `Failed to ${isEditMode ? 'update' : 'create'} course. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <Container
        title={isEditMode ? "Course Updated Successfully!" : "Course Created Successfully!"}
        description={isEditMode ? "Your course has been updated and is ready for students" : "Your course has been created and is ready for students"}
        className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      >
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🎉 Course "{state.course.title}" {isEditMode ? "Updated" : "Created"}!
            </h2>

            <p className="text-gray-600 mb-8">
              Your course has been successfully {isEditMode ? "updated" : "created"} and is now available for
              students to enroll. You can manage your course from the courses
              dashboard.
            </p>

            <div className="space-y-4">
              <OrangeButton
                className="w-full"
                onClick={() => {
                  router.push(`/admin/courses/manage-courses`);
                }}
              >
                Manage Course
              </OrangeButton>

              <WhiteButton
                onClick={() => {
                  router.push(`/admin/courses/manage-courses/create`);
                }}
                className="w-full"
              >
                Create Another Course
              </WhiteButton>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container
      title={isEditMode ? "Review & Update Course" : "Review & Submit Course"}
      description={isEditMode ? "Review your course details and submit for update" : "Review your course details and submit for creation"}
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      style={{ scrollbarWidth: "thin" }}
    >
      {/* Validation Status */}
      <div className="mb-6">
        <div
          className={`p-4 rounded-lg border-2 ${
            allValid
              ? "border-green-200 bg-green-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            {allValid ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-600" />
            )}
            <div>
              <h3
                className={`font-semibold ${
                  allValid ? "text-green-800" : "text-amber-800"
                }`}
              >
                {allValid
                  ? "Course Ready for Submission"
                  : "Course Needs Attention"}
              </h3>
              <p
                className={`text-sm ${
                  allValid ? "text-green-700" : "text-amber-700"
                }`}
              >
                {validCount} of {validationChecks.length} sections completed
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  allValid ? "bg-green-500" : "bg-amber-500"
                }`}
                style={{
                  width: `${(validCount / validationChecks.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Validation Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {validationChecks.map((check) => (
              <div key={check.id} className="flex items-center gap-2">
                {check.isValid ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      check.isValid ? "text-green-700" : "text-amber-700"
                    }`}
                  >
                    {check.label}
                  </p>
                  <p
                    className={`text-xs ${
                      check.isValid ? "text-green-600" : "text-amber-600"
                    }`}
                  >
                    {check.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Course Summary */}
      <div className="space-y-6 mb-8">
        {/* Basic Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Course Overview
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Course Title</h4>
                <p className="text-gray-900">
                  {state.course.title || "Not set"}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-1">Description</h4>
                <p className="text-gray-600 text-sm line-clamp-3">
                  {state.course.description || "Not set"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Category</h4>
                  <p className="text-gray-900">
                    {state.course.category || "Not set"}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Price</h4>
                  <p className="text-gray-900">
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
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-1">
                  Course Statistics
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <span>{courseStats.moduleCount} Modules</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-green-500" />
                    <span>{courseStats.skillsCount} Skills</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <span>{courseStats.careerPathsCount} Career Paths</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-orange-500" />
                    <span>{state.course.language || "Not set"}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-1">
                  Target Audience
                </h4>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-red-500" />
                  <span>{
                    state.course.audience === "college-students" ? "College Students" :
                    state.course.audience === "professionals" ? "Professionals" :
                    "Not set"
                  }</span>
                </div>
              </div>

              {state.course.thumbnail && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    Course Thumbnail
                  </h4>
                  <img
                    src={state.course.thumbnail}
                    alt="Course thumbnail"
                    className="w-32 h-20 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Learning Outcomes */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            Learning Outcomes
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                What Students Will Learn
              </h4>
              <p className="text-gray-600 text-sm">
                {state.course.whatYouWillLearn || "Not set"}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Skills Covered</h4>
              <div className="flex flex-wrap gap-2">
                {state.course.skills?.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                  >
                    {skill}
                  </span>
                )) || (
                  <span className="text-gray-500 text-sm">No skills added</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Course Content Summary */}
        {state.course.modules && state.course.modules.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Course Content
            </h3>

            <div className="space-y-3">
              {state.course.modules.map((module, index) => (
                <div
                  key={module._id || index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      Module {index + 1}
                    </p>
                    <p className="text-sm text-gray-600">
                      {module._id ? "Configured" : "In progress"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Administrative Information */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6 border border-indigo-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-500 rounded-lg">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Administrative Information
            </h3>
            <p className="text-sm text-gray-600">
              Set the course creator and other administrative details
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Created By (User ID)
            </label>
            <input
              type="text"
              value={state.course.createdBy || ""}
              onChange={(e) => actions.setCourseCreatedBy(e.target.value)}
              placeholder="Enter the user ID who created this course"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              This should be set to the User ID of the course creator
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{submitError}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScreenNavigation
        currentStep={8}
        previousScreen="screen7"
        nextButtonText={isEditMode ? "Update Course" : "Create Course"}
        nextButtonIcon={<Send className="w-4 h-4" />}
        onNext={handleSubmitCourse}
        isNextDisabled={!allValid || isSubmitting}
        isPreviousDisabled={isSubmitting}
        isLoading={isSubmitting}
      />
    </Container>
  );
};

export default Screen8;
