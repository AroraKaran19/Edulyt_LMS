import { CourseState } from "./state";

// ===================
// Selectors
// ===================

export const courseSelectors = {
  // Basic selectors
  getCourse: (state: CourseState) => state.course,
  getCourseId: (state: CourseState) => state.course._id,
  getCourseTitle: (state: CourseState) => state.course.title,
  getCourseDescription: (state: CourseState) => state.course.description,
  
  // Status selectors
  getIsLoading: (state: CourseState) => state.isLoading,
  getIsSaving: (state: CourseState) => state.isSaving,
  getError: (state: CourseState) => state.error,
  getValidationErrors: (state: CourseState) => state.validationErrors,
  
  // Form state selectors
  getIsDirty: (state: CourseState) => state.isDirty,
  getHasUnsavedChanges: (state: CourseState) => state.hasUnsavedChanges,
  
  // Metadata selectors
  getLastSaved: (state: CourseState) => state.lastSaved,
  getVersion: (state: CourseState) => state.version,
  
  // Computed selectors
  getIsValid: (state: CourseState) => {
    const { course, validationErrors } = state;
    return (
      course.title.trim() !== "" &&
      course.description.trim() !== "" &&
      course.category.trim() !== "" &&
      course.thumbnail.trim() !== "" &&
      Object.keys(validationErrors).length === 0
    );
  },
  
  getIsComplete: (state: CourseState) => {
    const { course } = state;
    return (
      course.title.trim() !== "" &&
      course.description.trim() !== "" &&
      course.category.trim() !== "" &&
      course.thumbnail.trim() !== "" &&
      course.modules.length > 0 &&
      course.instructor.length > 0 &&
      Object.keys(course.plans).length > 0
    );
  },
  
  getCourseStats: (state: CourseState) => {
    const { course } = state;
    return {
      totalModules: course.modules.length,
      totalLessons: course.modules.reduce((acc, module) => acc + module.lessons.length, 0),
      totalContent: course.modules.reduce((acc, module) => 
        acc + module.lessons.reduce((lessonAcc, lesson) => lessonAcc + lesson.content.length, 0), 0
      ),
      totalReviews: course.reviews.length,
      totalFaqs: course.faqs.length,
    };
  },
  
  // Specific field selectors
  getCourseCategory: (state: CourseState) => state.course.category,
  getCourseSubcategory: (state: CourseState) => state.course.subcategory,
  getCourseThumbnail: (state: CourseState) => state.course.thumbnail,
  getCourseSlug: (state: CourseState) => state.course.slug,
  getCourseLanguage: (state: CourseState) => state.course.language,
  
  // Status selectors
  getCourseIsFeatured: (state: CourseState) => state.course.isFeatured,
  getCourseIsCertified: (state: CourseState) => state.course.isCertified,
  getCourseIsActive: (state: CourseState) => state.course.isActive,
  getCourseScholarship: (state: CourseState) => state.course.scholarship,
  
  // Learning info selectors
  getCourseSkills: (state: CourseState) => state.course.skills,
  getCourseKeyFeatures: (state: CourseState) => state.course.keyFeatures,
  getCourseCareerPaths: (state: CourseState) => state.course.careerPaths,
  getCourseSkillLevel: (state: CourseState) => state.course.skillLevel,
  getCourseTags: (state: CourseState) => state.course.tags,
  
  // Content selectors
  getCourseModules: (state: CourseState) => state.course.modules,
  getCourseInstructor: (state: CourseState) => state.course.instructor,
  getCoursePlans: (state: CourseState) => state.course.plans,
  
  // Reviews & FAQs selectors
  getCourseReviews: (state: CourseState) => state.course.reviews,
  getCourseFeaturedReviews: (state: CourseState) => state.course.featuredReviews,
  getCourseFaqs: (state: CourseState) => state.course.faqs,
  
  // Quiz selectors
  getCourseScholarshipQuiz: (state: CourseState) => state.course.scholarshipQuiz,
  
  // SEO selectors
  getCourseMetaTitle: (state: CourseState) => state.course.metaTitle,
  getCourseMetaDescription: (state: CourseState) => state.course.metaDescription,
  getCourseKeywords: (state: CourseState) => state.course.keywords,
  
  // Pricing selectors
  getCourseDiscount: (state: CourseState) => state.course.discount,
  getCoursePlans: (state: CourseState) => state.course.plans,
  
  // Metrics selectors
  getCourseEnrolledCount: (state: CourseState) => state.course.enrolledCount,
  getCourseTotalRatings: (state: CourseState) => state.course.totalRatings,
  getCourseTotalLectures: (state: CourseState) => state.course.totalLectures,
  
  // Timestamp selectors
  getCourseCreatedAt: (state: CourseState) => state.course.createdAt,
  getCourseUpdatedAt: (state: CourseState) => state.course.updatedAt,
  getCourseCreatedBy: (state: CourseState) => state.course.createdBy,
}; 