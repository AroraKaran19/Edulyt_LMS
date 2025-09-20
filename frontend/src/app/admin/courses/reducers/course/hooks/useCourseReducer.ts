import { useReducer, useCallback, useRef } from "react";
import { ReducerResult, ReducerError, courseReducer } from "../core/reducer";
import { initialCourseState, CourseState } from "../core/state";
import { CourseAction, courseActions } from "../core/actions";
import { Discount } from "@/types";

// This hook is used to manage the state of the course reducer
export const useCourseReducer = () => {
  const [state, dispatch] = useReducer(
    (prevState: CourseState, action: CourseAction): CourseState => {
      const result = courseReducer(prevState, action);
      return result.state;
    },
    initialCourseState
  );

  const errorLogRef = useRef<ReducerError[]>([]);

  // Enhanced dispatch with error handling
  const enhancedDispatch = useCallback(
    (action: CourseAction): ReducerResult => {
      try {
        const result = courseReducer(state, action);

        // Log errors for debugging
        if (result.error) {
          errorLogRef.current.push(result.error);
          console.error("Course Reducer Error:", {
            action: action.type,
            payload: action.payload,
            error: result.error,
            validationErrors: result.state.validationErrors,
            timestamp: new Date().toISOString(),
          });
        }

        // Log warnings
        if (result.warnings && result.warnings.length > 0) {
          console.warn("Course Reducer Warnings:", {
            action: action.type,
            warnings: result.warnings,
            timestamp: new Date().toISOString(),
          });
        }

        // Actually dispatch the action to update React state
        dispatch(action);

        return result;
      } catch (error) {
        const runtimeError: ReducerError = {
          type: "RUNTIME_ERROR",
          message: `Unexpected error in course reducer: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          code: "UNEXPECTED_ERROR",
          details: { originalError: error, action },
        };

        errorLogRef.current.push(runtimeError);
        console.error("Unexpected Course Reducer Error:", runtimeError);

        return {
          state: {
            ...state,
            error: runtimeError.message,
            isLoading: false,
            isSaving: false,
          },
          error: runtimeError,
        };
      }
    },
    [state, dispatch]
  );

  // Action creators with validation
  const actions = {
    // Basic Course Management
    setCourse: useCallback(
      (course: any) => {
        const action = courseActions.setCourse(course);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    resetCourse: useCallback(
      (course?: any) => {
        const action = courseActions.resetCourse(course);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    updateCourseField: useCallback(
      (field: string, value: any) => {
        const action = courseActions.updateCourseField(field, value);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    // Basic Information
    setCourseTitle: useCallback(
      (title: string) => {
        const action = courseActions.setCourseTitle(title);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseDescription: useCallback(
      (description: string) => {
        const action = courseActions.setCourseDescription(description);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseShortDescription: useCallback(
      (shortDescription: string) => {
        const action =
          courseActions.setCourseShortDescription(shortDescription);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseCategory: useCallback(
      (category: string) => {
        const action = courseActions.setCourseCategory(category);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseThumbnail: useCallback(
      (thumbnail: string) => {
        const action = courseActions.setCourseThumbnail(thumbnail);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseThumbnailSource: useCallback(
      (source: "upload" | "url" | undefined) => {
        const action = courseActions.setCourseThumbnailSource(source);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseThumbnailS3Key: useCallback(
      (s3Key: string) => {
        const action = courseActions.setCourseThumbnailS3Key(s3Key);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCoursePreviewVideoUrl: useCallback(
      (previewVideoUrl: string) => {
        const action = courseActions.setCoursePreviewVideoUrl(previewVideoUrl);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCoursePreviewVideoSource: useCallback(
      (source: "upload" | "url" | undefined) => {
        const action = courseActions.setCoursePreviewVideoSource(source);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCoursePreviewVideoS3Key: useCallback(
      (s3Key: string) => {
        const action = courseActions.setCoursePreviewVideoS3Key(s3Key);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseSlug: useCallback(
      (slug: string) => {
        const action = courseActions.setCourseSlug(slug);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseLanguage: useCallback(
      (language: string) => {
        const action = courseActions.setCourseLanguage(language);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseCurriculum: useCallback(
      (curriculum: string) => {
        const action = courseActions.setCourseCurriculum(curriculum);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseCurriculumSource: useCallback(
      (source: "upload" | "url" | undefined) => {
        const action = courseActions.setCourseCurriculumSource(source);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseCurriculumS3Key: useCallback(
      (s3Key: string) => {
        const action = courseActions.setCourseCurriculumS3Key(s3Key);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    // Status & Features
    setCourseIsFeatured: useCallback(
      (isFeatured: boolean) => {
        const action = courseActions.setCourseIsFeatured(isFeatured);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseIsCertified: useCallback(
      (isCertified: boolean) => {
        const action = courseActions.setCourseIsCertified(isCertified);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseIsActive: useCallback(
      (isActive: boolean) => {
        const action = courseActions.setCourseIsActive(isActive);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseScholarship: useCallback(
      (scholarship: boolean) => {
        const action = courseActions.setCourseScholarship(scholarship);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseScholarshipDescription: useCallback(
      (scholarshipDescription: string) => {
        const action = courseActions.setCourseScholarshipDescription(
          scholarshipDescription
        );
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    // Learning Information
    setCourseWhatYouWillLearn: useCallback(
      (whatYouWillLearn: string) => {
        const action =
          courseActions.setCourseWhatYouWillLearn(whatYouWillLearn);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseSkills: useCallback(
      (skills: string[]) => {
        const action = courseActions.setCourseSkills(skills);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseKeyFeatures: useCallback(
      (keyFeatures: { title: string; description: string }[]) => {
        const action = courseActions.setCourseKeyFeatures(keyFeatures);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseFeatures: useCallback(
      (features: string[]) => {
        const action = courseActions.setCourseFeatures(features);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseCareerPaths: useCallback(
      (careerPaths: string[]) => {
        const action = courseActions.setCourseCareerPaths(careerPaths);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseHighlights: useCallback(
      (highlights: { title: string; description: string }[]) => {
        const action = courseActions.setCourseHighlights(highlights);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseSkillLevel: useCallback(
      (skillLevel: string) => {
        const action = courseActions.setCourseSkillLevel(skillLevel);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseWhoShouldJoin: useCallback(
      (whoShouldJoin: string) => {
        const action = courseActions.setCourseWhoShouldJoin(whoShouldJoin);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCoursePrerequisites: useCallback(
      (prerequisites: string[]) => {
        const action = courseActions.setCoursePrerequisites(prerequisites);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseAudience: useCallback(
      (audience: "college-students" | "professionals") => {
        const action = courseActions.setCourseAudience(audience);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseDuration: useCallback(
      (duration: string) => {
        const action = courseActions.setCourseDuration(duration);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseTags: useCallback(
      (tags: string[]) => {
        const action = courseActions.setCourseTags(tags);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    // Content Management
    setCourseModules: useCallback(
      (modules: any[]) => {
        const action = courseActions.setCourseModules(modules);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    addCourseModule: useCallback(
      (module: any) => {
        const action = courseActions.addCourseModule(module);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    updateCourseModule: useCallback(
      (moduleId: string, updates: any) => {
        const action = courseActions.updateCourseModule(moduleId, updates);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    deleteCourseModule: useCallback(
      (moduleId: string) => {
        const action = courseActions.deleteCourseModule(moduleId);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    reorderCourseModules: useCallback(
      (modules: any[]) => {
        const action = courseActions.reorderCourseModules(modules);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    // Lesson Management
    addCourseLesson: useCallback(
      (moduleId: string, lesson: any) => {
        const action = courseActions.addCourseLesson(moduleId, lesson);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    updateCourseLesson: useCallback(
      (moduleId: string, lessonId: string, updates: any) => {
        const action = courseActions.updateCourseLesson(
          moduleId,
          lessonId,
          updates
        );
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    deleteCourseLesson: useCallback(
      (moduleId: string, lessonId: string) => {
        const action = courseActions.deleteCourseLesson(moduleId, lessonId);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    reorderCourseLessons: useCallback(
      (moduleId: string, lessons: any[]) => {
        const action = courseActions.reorderCourseLessons(moduleId, lessons);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    // Content Management
    addCourseContent: useCallback(
      (moduleId: string, lessonId: string, content: any) => {
        const action = courseActions.addCourseContent(
          moduleId,
          lessonId,
          content
        );
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    updateCourseContent: useCallback(
      (moduleId: string, lessonId: string, contentId: string, updates: any) => {
        const action = courseActions.updateCourseContent(
          moduleId,
          lessonId,
          contentId,
          updates
        );
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    deleteCourseContent: useCallback(
      (moduleId: string, lessonId: string, contentId: string) => {
        const action = courseActions.deleteCourseContent(
          moduleId,
          lessonId,
          contentId
        );
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    reorderCourseContent: useCallback(
      (moduleId: string, lessonId: string, contents: any[]) => {
        const action = courseActions.reorderCourseContent(
          moduleId,
          lessonId,
          contents
        );
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    // Instructor Management
    setCourseInstructor: useCallback(
      (instructor: any[]) => {
        const action = courseActions.setCourseInstructor(instructor);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    addCourseInstructor: useCallback(
      (instructor: any) => {
        const action = courseActions.addCourseInstructor(instructor);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    removeCourseInstructor: useCallback(
      (instructorId: string) => {
        const action = courseActions.removeCourseInstructor(instructorId);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    // Reviews Management
    setCourseReviews: useCallback(
      (reviews: any[]) => {
        const action = courseActions.setCourseReviews(reviews);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    addCourseReview: useCallback(
      (review: any) => {
        const action = courseActions.addCourseReview(review);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    updateCourseReview: useCallback(
      (reviewId: string, updates: any) => {
        const action = courseActions.updateCourseReview(reviewId, updates);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    deleteCourseReview: useCallback(
      (reviewId: string) => {
        const action = courseActions.deleteCourseReview(reviewId);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setFeaturedReviews: useCallback(
      (featuredReviews: any[]) => {
        const action = courseActions.setFeaturedReviews(featuredReviews);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    // FAQ Management
    setCourseFaqs: useCallback(
      (faqs: string[]) => {
        const action = courseActions.setCourseFaqs(faqs);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    addCourseFaq: useCallback(
      (faqId: string) => {
        const action = courseActions.addCourseFaq(faqId);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    updateCourseFaq: useCallback(
      (faqIndex: number, updates: any) => {
        const action = courseActions.updateCourseFaq(faqIndex, updates);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    deleteCourseFaq: useCallback(
      (faqIndex: number) => {
        const action = courseActions.deleteCourseFaq(faqIndex);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    reorderCourseFaqs: useCallback(
      (faqs: any[]) => {
        const action = courseActions.reorderCourseFaqs(faqs);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    // Quiz Management
    setCourseScholarshipQuiz: useCallback(
      (quiz: any[]) => {
        const action = courseActions.setCourseScholarshipQuiz(quiz);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    addCourseQuiz: useCallback(
      (quiz: any) => {
        const action = courseActions.addCourseQuiz(quiz);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    updateCourseQuiz: useCallback(
      (quizId: string, updates: any) => {
        const action = courseActions.updateCourseQuiz(quizId, updates);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    deleteCourseQuiz: useCallback(
      (quizId: string) => {
        const action = courseActions.deleteCourseQuiz(quizId);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    // SEO Management
    setCourseMetaTitle: useCallback(
      (metaTitle: string) => {
        const action = courseActions.setCourseMetaTitle(metaTitle);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseMetaDescription: useCallback(
      (metaDescription: string) => {
        const action = courseActions.setCourseMetaDescription(metaDescription);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseKeywords: useCallback(
      (keywords: string[]) => {
        const action = courseActions.setCourseKeywords(keywords);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    // Pricing & Discount

    setCourseDiscount: useCallback(
      (discount: Discount | null) => {
        const action = courseActions.setCourseDiscount(discount);
        dispatch(action);
      },
      [dispatch]
    ),

    setCoursePlans: useCallback(
      (plans: any) => {
        const action = courseActions.setCoursePlans(plans);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    updateCoursePlan: useCallback(
      (planType: "elite" | "essential", plan: any) => {
        const action = courseActions.updateCoursePlan(planType, plan);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    // Error Handling
    setCourseError: useCallback(
      (error: string) => {
        const action = courseActions.setCourseError(error);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    clearCourseError: useCallback(() => {
      const action = courseActions.clearCourseError();
      return enhancedDispatch(action);
    }, [enhancedDispatch]),

    // Loading States
    setCourseLoading: useCallback(
      (isLoading: boolean) => {
        const action = courseActions.setCourseLoading(isLoading);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseSaving: useCallback(
      (isSaving: boolean) => {
        const action = courseActions.setCourseSaving(isSaving);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    // Validation
    setCourseValidationErrors: useCallback(
      (validationErrors: Record<string, string[]>) => {
        const action =
          courseActions.setCourseValidationErrors(validationErrors);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    clearCourseValidationErrors: useCallback(() => {
      const action = courseActions.clearCourseValidationErrors();
      return enhancedDispatch(action);
    }, [enhancedDispatch]),

    // Timestamps
    setCourseCreatedAt: useCallback(
      (createdAt: Date) => {
        const action = courseActions.setCourseCreatedAt(createdAt);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseUpdatedAt: useCallback(
      (updatedAt: Date) => {
        const action = courseActions.setCourseUpdatedAt(updatedAt);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseCreatedBy: useCallback(
      (createdBy: string) => {
        const action = courseActions.setCourseCreatedBy(createdBy);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    // Metrics
    setCourseEnrolledCount: useCallback(
      (enrolledCount: number) => {
        const action = courseActions.setCourseEnrolledCount(enrolledCount);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseTotalRatings: useCallback(
      (totalRatings: number) => {
        const action = courseActions.setCourseTotalRatings(totalRatings);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    setCourseTotalLectures: useCallback(
      (totalLectures: number) => {
        const action = courseActions.setCourseTotalLectures(totalLectures);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    // Testimonials Management
    setCourseTestimonials: useCallback(
      (testimonials: string[]) => {
        const action = courseActions.setCourseTestimonials(testimonials);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    addCourseTestimonial: useCallback(
      (testimonialId: string) => {
        const action = courseActions.addCourseTestimonial(testimonialId);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    updateCourseTestimonial: useCallback(
      (testimonialIndex: number, updates: any) => {
        const action = courseActions.updateCourseTestimonial(testimonialIndex, updates);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),

    deleteCourseTestimonial: useCallback(
      (testimonialIndex: number) => {
        const action = courseActions.deleteCourseTestimonial(testimonialIndex);
        return enhancedDispatch(action);
      },
      [enhancedDispatch]
    ),
  };

  // Utility functions
  const utils = {
    // Get error log
    getErrorLog: useCallback(() => [...errorLogRef.current], []),

    // Clear error log
    clearErrorLog: useCallback(() => {
      errorLogRef.current = [];
    }, []),

    // Check if there are any errors
    hasErrors: useCallback(() => errorLogRef.current.length > 0, []),

    // Get the last error
    getLastError: useCallback(() => {
      return errorLogRef.current[errorLogRef.current.length - 1] || null;
    }, []),
  };

  return {
    state,
    actions,
    utils,
    dispatch: enhancedDispatch,
  };
};
