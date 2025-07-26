"use client";
import React, { useState } from "react";
import {
  Save,
  Send,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  Zap,
  Clock,
  Users,
  BookOpen,
  X,
  Play,
  MapPin,
} from "lucide-react";
import { CourseFormState, useCourseFormContext } from "../context/CourseFormContext";
import courseService from "@/services/courseService";
import { useRouter } from "next/navigation";
import Image from "next/image";

const SubmissionSection = () => {
  const { state, resetForm, isBasicInfoValid } = useCourseFormContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detect if we're in edit mode based on URL
  const isEditMode =
    typeof window !== "undefined" &&
    window.location.pathname.includes("/edit/");
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [validationDetails, setValidationDetails] = useState<
    {
      section: string;
      sectionTitle: string;
      errors: Array<{
        field: string;
        message: string;
        required: boolean;
      }>;
    }[]
  >([]);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const router = useRouter();

  // Required sections configuration
  const requiredSections = [
    {
      id: "basic",
      title: "Basic Information",
      fields: [
        { key: "title", label: "Course Title", value: state.title },
        { key: "description", label: "Description", value: state.description },
        { key: "category", label: "Category", value: state.category },
        { key: "thumbnail", label: "Thumbnail", value: state.thumbnail },
        { key: "skillLevel", label: "Skill Level", value: state.skillLevel },
        { key: "audience", label: "Target Audience", value: state.audience },
      ],
    },
    {
      id: "instructors",
      title: "Instructors",
      fields: [
        {
          key: "instructor",
          label: "At least one instructor",
          value: state.instructor?.length > 0 ? "Added" : "",
        },
      ],
    },
    {
      id: "content",
      title: "Course Content",
      fields: [
        {
          key: "modules",
          label: "Course modules",
          value:
            state.modules?.length > 0 ? `${state.modules.length} modules` : "",
        },
      ],
    },
    {
      id: "pricing",
      title: "Pricing Plans",
      fields: [
        {
          key: "plans",
          label: "Pricing plans",
          value:
            state.plans?.elite?.title || state.plans?.essential?.title
              ? "Configured"
              : "",
        },
      ],
    },
  ];

  const validateAndShowErrors = () => {
    console.log("validateAndShowErrors called with state:", {
      title: state.title,
      description: state.description,
      titleType: typeof state.title,
      descriptionType: typeof state.description,
    });

    const validation = courseService.validateCourseData(state);
    setValidationDetails(validation.errorsBySection);
    return validation.valid;
  };

  // Add this detailed debugging function
  const debugCurrentState = () => {
    console.log("=== COMPLETE STATE ANALYSIS ===");
    console.log("📋 Basic Information:");
    console.log("  ✓ title:", state.title || "[MISSING]");
    console.log(
      "  ✓ description:",
      state.description ? `${state.description.length} chars` : "[MISSING]"
    );
    console.log("  ❌ category:", state.category || "[MISSING - REQUIRED]");
    console.log("  ❌ thumbnail:", state.thumbnail || "[MISSING - REQUIRED]");
    console.log("  ❌ skillLevel:", state.skillLevel || "[MISSING - REQUIRED]");
    console.log("  ❌ audience:", state.audience || "[MISSING - REQUIRED]");

    console.log("📚 Learning Outcomes:");
    console.log(
      "  ❌ whatYouWillLearn:",
      state.whatYouWillLearn || "[MISSING - REQUIRED]"
    );
    console.log(
      "  ❌ whoShouldJoin:",
      state.whoShouldJoin || "[MISSING - REQUIRED]"
    );

    console.log("👨‍🏫 Instructors:");
    console.log(
      "  ❌ instructor:",
      state.instructor?.length > 0
        ? `${state.instructor.length} assigned`
        : "[MISSING - REQUIRED]"
    );

    console.log("📖 Course Content:");
    console.log(
      "  ❌ modules:",
      state.modules?.length > 0
        ? `${state.modules.length} modules`
        : "[MISSING - REQUIRED]"
    );

    console.log("💰 Pricing:");
    const hasElitePlan = state.plans?.elite?.title;
    const hasEssentialPlan = state.plans?.essential?.title;
    console.log("  ❌ Elite Plan:", hasElitePlan || "[NOT CONFIGURED]");
    console.log("  ❌ Essential Plan:", hasEssentialPlan || "[NOT CONFIGURED]");
    console.log(
      "  ❌ At least one plan required:",
      hasElitePlan || hasEssentialPlan ? "YES" : "[MISSING - REQUIRED]"
    );

    console.log("=== END STATE ANALYSIS ===");
  };

  // Call the debug function when validation fails
  const handleSubmit = async () => {
    setSubmitMessage(null);
    setValidationDetails([]);
    debugInstructorData();

    if (!validateAndShowErrors()) {
      // Call debug function to show detailed state analysis
      debugCurrentState();

      setSubmitMessage({
        type: "error",
        message: "Please complete all required fields before submitting.",
      });

      // Scroll to first error section
      if (validationDetails.length > 0) {
        const firstErrorSection = validationDetails[0].section;
        const sectionElement = document.getElementById(
          firstErrorSection === "basic"
            ? "basic-information"
            : firstErrorSection === "learning"
            ? "learning-outcomes"
            : firstErrorSection === "content"
            ? "modules"
            : firstErrorSection === "pricing"
            ? "pricing"
            : firstErrorSection === "seo"
            ? "seo"
            : firstErrorSection
        );
        if (sectionElement) {
          sectionElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      return;
    }

    setIsSubmitting(true);

    try {
      let result;
      if (isEditMode) {
        // For edit mode, get transformed data and use updateCourse
        const transformedData = await courseService.transformFormDataToBackend(
          state,
          isEditMode
        );
        const courseId = window.location.pathname.split("/").pop();
        result = await courseService.updateCourse(courseId!, transformedData as CourseFormState);
      } else {
        // For create mode, pass form data directly to createCourse (it handles transformation internally)
        result = await courseService.createCourse(state);
      }

      if (result.success) {
        setSubmitMessage({
          type: "success",
          message: isEditMode
            ? "Course updated successfully!"
            : "Course created successfully!",
        });

        if (!isEditMode) {
          resetForm();
        }

        setTimeout(() => {
          router.push("/admin/courses/manage-courses");
        }, 2000);
      } else {
        setSubmitMessage({
          type: "error",
          message:
            result.message ||
            result.error ||
            `Failed to ${
              isEditMode ? "update" : "create"
            } course. Please try again.`,
        });
      }
    } catch (error) {
      console.error("Error submitting course:", error);
      setSubmitMessage({
        type: "error",
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };



  // Add debug function to log current instructor data
  const debugInstructorData = () => {
    console.log("=== INSTRUCTOR DEBUG ===");
    console.log("Current instructor data:", {
      instructorArray: state.instructor,
      types: state.instructor?.map((id) => typeof id),
      values: state.instructor?.map((id) => id),
      stringified: state.instructor?.map((id) => JSON.stringify(id)),
    });
    console.log("=== END INSTRUCTOR DEBUG ===");
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setSubmitMessage(null);

    try {
      const result = await courseService.saveDraft(state);

      if (result.success) {
        setSubmitMessage({
          type: "success",
          message: "Draft saved successfully!",
        });
      } else {
        setSubmitMessage({
          type: "error",
          message: "Failed to save draft. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      setSubmitMessage({
        type: "error",
        message: "An unexpected error occurred while saving draft.",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  // Calculate completion status
  const getCompletionStatus = () => {
    const sectionStatus = requiredSections.map((section) => {
      const completedFields = section.fields.filter((field) =>
        Boolean(field.value)
      ).length;
      const totalFields = section.fields.length;
      const isComplete = completedFields === totalFields;

      return {
        ...section,
        completedFields,
        totalFields,
        isComplete,
        percentage: Math.round((completedFields / totalFields) * 100),
      };
    });

    const totalCompleted = sectionStatus.reduce(
      (acc, section) => acc + section.completedFields,
      0
    );
    const totalFields = sectionStatus.reduce(
      (acc, section) => acc + section.totalFields,
      0
    );
    const overallPercentage = Math.round((totalCompleted / totalFields) * 100);

    return { sectionStatus, overallPercentage, totalCompleted, totalFields };
  };

  const { sectionStatus, overallPercentage } = getCompletionStatus();
  const canSubmit = isBasicInfoValid() && state.instructor?.length > 0;
  const allSectionsComplete = sectionStatus.every(
    (section) => section.isComplete
  );

  // Get course stats
  const totalLessons =
    state.modules?.reduce(
      (acc, module) => acc + (module.lessons?.length || 0),
      0
    ) || 0;


  // Preview Modal Component
  const PreviewModal = () => {
    if (!isPreviewOpen) return null;

    const formatDuration = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const getTotalDuration = () => {
      return (
        state.modules?.reduce((total, module) => {
          return (
            total +
            (module.lessons?.reduce((lessonTotal, lesson) => {
              return (
                lessonTotal +
                (lesson.content?.reduce((contentTotal, content) => {
                  if (
                    content.type === "video" &&
                    "duration" in content.content &&
                    content.content.duration
                  ) {
                    return contentTotal + content.content.duration;
                  }
                  return contentTotal;
                }, 0) || 0)
              );
            }, 0) || 0)
          );
        }, 0) || 0
      );
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-6xl max-h-[90vh] w-full overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Eye className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-coolvetica">
                  Course Preview
                </h2>
                <p className="text-sm text-gray-600">
                  How your course will appear to students
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Course Header */}
          <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Course Info */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
                    {state.category || "Category"}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    {state.skillLevel || "Skill Level"}
                  </span>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4 font-coolvetica">
                  {state.title || "Course Title"}
                </h1>

                <p className="text-gray-600 mb-6 leading-relaxed">
                  {state.description ||
                    "Course description will appear here..."}
                </p>

                {/* Course Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(getTotalDuration())}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="h-4 w-4" />
                    <span>{totalLessons} Lessons</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{state.instructor?.length || 0} Instructors</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{state.audience || "All Levels"}</span>
                  </div>
                </div>

                {/* Pricing */}
                {(state.plans?.elite?.title ||
                  state.plans?.essential?.title) && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">
                      Pricing Plans
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {state.plans?.essential?.title && (
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">
                              {state.plans.essential.title}
                            </h4>
                            <span className="text-lg font-bold text-orange-600">
                              ₹{state.plans.essential.price}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            {state.plans.essential.features?.map(
                              (feature, index) => (
                                <div key={index}>• {feature.title}</div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                      {state.plans?.elite?.title && (
                        <div className="p-4 border-2 border-orange-200 bg-orange-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">
                              {state.plans.elite.title}
                            </h4>
                            <span className="text-lg font-bold text-orange-600">
                              ₹{state.plans.elite.price}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            {state.plans.elite.features?.map(
                              (feature, index) => (
                                <div key={index}>• {feature.title}</div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Course Thumbnail */}
              <div>
                <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden mb-4">
                  {state.thumbnail ? (
                    <Image
                      src={state.thumbnail}
                      alt="Course thumbnail"
                      className="w-full h-full object-cover"
                      width={400}
                      height={225}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">
                          Course thumbnail will appear here
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {state.previewVideoUrl && (
                  <div className="relative">
                    <video
                      src={state.previewVideoUrl}
                      className="w-full rounded-lg"
                      controls
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Course Content */}
          <div className="p-6">
            {/* What You'll Learn */}
            {state.whatYouWillLearn && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 font-coolvetica">
                  What You&apos;ll Learn
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">
                    {state.whatYouWillLearn}
                  </p>
                </div>
              </div>
            )}

            {/* Course Modules */}
            {state.modules && state.modules.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 font-coolvetica">
                  Course Content
                </h3>
                <div className="space-y-4">
                  {state.modules.map((module, moduleIndex) => (
                    <div
                      key={module._id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div className="bg-gray-50 p-4 border-b border-gray-200">
                        <h4 className="font-semibold text-gray-900">
                          Module {moduleIndex + 1}: {module.title}
                        </h4>
                        {module.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {module.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{module.lessons?.length || 0} lessons</span>
                          <span>
                            {module.lessons?.reduce(
                              (acc, lesson) =>
                                acc + (lesson.content?.length || 0),
                              0
                            ) || 0}{" "}
                            content items
                          </span>
                        </div>
                      </div>

                      {module.lessons && module.lessons.length > 0 && (
                        <div className="divide-y divide-gray-100">
                          {module.lessons.map((lesson) => (
                            <div key={lesson._id} className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Play className="h-4 w-4 text-orange-500" />
                                  <div>
                                    <h5 className="font-medium text-gray-900">
                                      {lesson.title}
                                    </h5>
                                    {lesson.description && (
                                      <p className="text-sm text-gray-600">
                                        {lesson.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {lesson.content?.length || 0} items
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructors */}
            {state.instructor && state.instructor.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 font-coolvetica">
                  Instructors
                </h3>
                <div className="text-gray-600">
                  <p>
                    {state.instructor.length} instructor(s) assigned to this
                    course
                  </p>
                </div>
              </div>
            )}

            {/* FAQs */}
            {state.faqs && state.faqs.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 font-coolvetica">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-4">
                  {state.faqs.map((faq) => (
                    <div
                      key={faq._id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <h4 className="font-medium text-gray-900 mb-2">
                        {faq.question}
                      </h4>
                      <p className="text-gray-600 text-sm">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Features */}
            {state.keyFeatures && state.keyFeatures.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 font-coolvetica">
                  Key Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {state.keyFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg"
                    >
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {feature.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  setIsPreviewOpen(false);
                  console.log("Final state: ", state);
                  handleSubmit();
                }}
                disabled={!canSubmit || isSubmitting}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Launch Course"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Error Display Component
  const ErrorDisplay = () => {
    if (validationDetails.length === 0) return null;

    const requiredErrors = validationDetails
      .map((section) => ({
        ...section,
        errors: section.errors.filter((error) => error.required),
      }))
      .filter((section) => section.errors.length > 0);

    const warningErrors = validationDetails
      .map((section) => ({
        ...section,
        errors: section.errors.filter((error) => !error.required),
      }))
      .filter((section) => section.errors.length > 0);

    const scrollToSection = (sectionId: string) => {
      const sectionElement = document.getElementById(
        sectionId === "basic"
          ? "basic-information"
          : sectionId === "learning"
          ? "learning-outcomes"
          : sectionId === "content"
          ? "modules"
          : sectionId === "pricing"
          ? "pricing"
          : sectionId === "seo"
          ? "seo"
          : sectionId === "instructors"
          ? "instructors"
          : sectionId
      );
      if (sectionElement) {
        sectionElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    return (
      <div className="space-y-4">
        {/* Required Errors */}
        {requiredErrors.length > 0 && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-800 mb-3">
                  Required Fields Missing (
                  {requiredErrors.reduce(
                    (acc, section) => acc + section.errors.length,
                    0
                  )}
                  )
                </h4>
                <div className="space-y-4">
                  {requiredErrors.map((section, sectionIndex) => (
                    <div
                      key={sectionIndex}
                      className="bg-white p-4 rounded-md border border-red-100"
                    >
                      <button
                        onClick={() => scrollToSection(section.section)}
                        className="flex items-center gap-2 text-red-700 hover:text-red-900 font-medium mb-2 transition-colors"
                      >
                        <span className="w-2 h-2 bg-red-500 rounded-full" />
                        {section.sectionTitle}
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                          {section.errors.length} issues
                        </span>
                      </button>
                      <div className="ml-4 space-y-1">
                        {section.errors.map((error, errorIndex) => (
                          <div
                            key={errorIndex}
                            className="text-sm text-red-600 flex items-start gap-2"
                          >
                            <span className="w-1 h-1 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                            {error.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning Messages */}
        {warningErrors.length > 0 && (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-amber-600 text-xs font-bold">!</span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-800 mb-3">
                  Recommendations (
                  {warningErrors.reduce(
                    (acc, section) => acc + section.errors.length,
                    0
                  )}
                  )
                </h4>
                <div className="space-y-3">
                  {warningErrors.map((section, sectionIndex) => (
                    <div
                      key={sectionIndex}
                      className="bg-white p-3 rounded-md border border-amber-100"
                    >
                      <button
                        onClick={() => scrollToSection(section.section)}
                        className="flex items-center gap-2 text-amber-700 hover:text-amber-900 font-medium mb-2 transition-colors text-sm"
                      >
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                        {section.sectionTitle}
                      </button>
                      <div className="ml-3 space-y-1">
                        {section.errors.map((error, errorIndex) => (
                          <div
                            key={errorIndex}
                            className="text-xs text-amber-600"
                          >
                            {error.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 border-b border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500 rounded-xl shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-coolvetica">
                  {isEditMode ? "Update Course" : "Ready to Launch?"}
                </h3>
                <p className="text-orange-700 font-medium">
                  {isEditMode
                    ? "Make changes and save your updates"
                    : "Complete the missing sections to publish your course"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-orange-600 font-coolvetica">
                {overallPercentage}%
              </div>
              <div className="text-sm text-orange-700 font-medium">
                Complete
              </div>
            </div>
          </div>
        </div>

        {/* Progress Visualization */}
        <div className="p-6 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sectionStatus.map((section) => (
              <div key={section.id} className="relative">
                <div
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    section.isComplete
                      ? "border-green-200 bg-green-50"
                      : section.completedFields > 0
                      ? "border-orange-200 bg-orange-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {section.title}
                    </h4>
                    {section.isComplete ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <div
                        className={`w-5 h-5 rounded-full border-2 ${
                          section.completedFields > 0
                            ? "border-orange-400 bg-orange-100"
                            : "border-gray-300"
                        }`}
                      />
                    )}
                  </div>

                  <div className="space-y-1 mb-3">
                    {section.fields.map((field) => (
                      <div
                        key={field.key}
                        className="flex items-center justify-between text-xs"
                      >
                        <span
                          className={`${
                            field.value ? "text-gray-600" : "text-red-500"
                          }`}
                        >
                          {field.label}
                        </span>
                        <span
                          className={`font-medium ${
                            field.value ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {field.value ? "✓" : "○"}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        section.isComplete ? "bg-green-500" : "bg-orange-400"
                      }`}
                      style={{ width: `${section.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-center">
                    {section.completedFields}/{section.totalFields} completed
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Validation Errors */}
        {ErrorDisplay()}

        {/* Submit Message */}
        {submitMessage && (
          <div
            className={`p-6 border-b ${
              submitMessage.type === "success"
                ? "bg-green-50 border-green-100"
                : "bg-red-50 border-red-100"
            }`}
          >
            <div className="flex items-center gap-3">
              {submitMessage.type === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              )}
              <p
                className={`font-medium ${
                  submitMessage.type === "success"
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                {submitMessage.message}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Preview Button */}
            <button
              type="button"
              onClick={handlePreview}
              disabled={isSubmitting || isSavingDraft}
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="h-4 w-4" />
              Preview Course
            </button>

            {/* Save Draft Button */}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting || isSavingDraft}
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-orange-300 text-orange-700 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingDraft ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSavingDraft ? "Saving Draft..." : "Save as Draft"}
            </button>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting || isSavingDraft}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex-1 sm:flex-none ${
                canSubmit && allSectionsComplete
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-orange-700 transform hover:scale-[1.02]"
                  : canSubmit
                  ? "bg-orange-400 text-white shadow-md"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : allSectionsComplete ? (
                <Zap className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isSubmitting
                ? isEditMode
                  ? "Updating Course..."
                  : "Publishing Course..."
                : allSectionsComplete
                ? isEditMode
                  ? "Update Course"
                  : "Launch Course"
                : isEditMode
                ? "Save Changes"
                : "Complete & Launch"}
            </button>
          </div>

          {/* Status Message */}
          {!allSectionsComplete && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800 font-medium text-center">
                {overallPercentage < 50
                  ? "🚀 Keep going! You're making great progress on your course."
                  : overallPercentage < 80
                  ? "🎯 Almost there! Just a few more sections to complete."
                  : "✨ You're so close! Complete the remaining fields to launch your course."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <PreviewModal />
    </>
  );
};

export default SubmissionSection;
