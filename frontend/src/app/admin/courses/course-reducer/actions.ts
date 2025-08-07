import { Course, CourseModule, Plan, Review, FAQ, Quiz, CourseInstructor } from "../../../../types";

// ===================
// Action Types
// ===================

export enum CourseActionType {
  // Basic Course Management
  SET_COURSE = "SET_COURSE",
  RESET_COURSE = "RESET_COURSE",
  UPDATE_COURSE_FIELD = "UPDATE_COURSE_FIELD",
  
  // Basic Information
  SET_COURSE_TITLE = "SET_COURSE_TITLE",
  SET_COURSE_DESCRIPTION = "SET_COURSE_DESCRIPTION",
  SET_COURSE_SHORT_DESCRIPTION = "SET_COURSE_SHORT_DESCRIPTION",
  SET_COURSE_CATEGORY = "SET_COURSE_CATEGORY",
  SET_COURSE_SUBCATEGORY = "SET_COURSE_SUBCATEGORY",
  SET_COURSE_THUMBNAIL = "SET_COURSE_THUMBNAIL",
  SET_COURSE_PREVIEW_VIDEO_URL = "SET_COURSE_PREVIEW_VIDEO_URL",
  SET_COURSE_SLUG = "SET_COURSE_SLUG",
  SET_COURSE_LANGUAGE = "SET_COURSE_LANGUAGE",
  
  // Status & Features
  SET_COURSE_IS_FEATURED = "SET_COURSE_IS_FEATURED",
  SET_COURSE_IS_CERTIFIED = "SET_COURSE_IS_CERTIFIED",
  SET_COURSE_IS_ACTIVE = "SET_COURSE_IS_ACTIVE",
  SET_COURSE_SCHOLARSHIP = "SET_COURSE_SCHOLARSHIP",
  SET_COURSE_SCHOLARSHIP_DESCRIPTION = "SET_COURSE_SCHOLARSHIP_DESCRIPTION",
  
  // Metrics
  SET_COURSE_ENROLLED_COUNT = "SET_COURSE_ENROLLED_COUNT",
  SET_COURSE_TOTAL_RATINGS = "SET_COURSE_TOTAL_RATINGS",
  SET_COURSE_TOTAL_LECTURES = "SET_COURSE_TOTAL_LECTURES",
  
  // Learning Information
  SET_COURSE_WHAT_YOU_WILL_LEARN = "SET_COURSE_WHAT_YOU_WILL_LEARN",
  SET_COURSE_SKILLS = "SET_COURSE_SKILLS",
  SET_COURSE_KEY_FEATURES = "SET_COURSE_KEY_FEATURES",
  SET_COURSE_FEATURES = "SET_COURSE_FEATURES",
  SET_COURSE_CAREER_PATHS = "SET_COURSE_CAREER_PATHS",
  SET_COURSE_SKILL_LEVEL = "SET_COURSE_SKILL_LEVEL",
  SET_COURSE_WHO_SHOULD_JOIN = "SET_COURSE_WHO_SHOULD_JOIN",
  SET_COURSE_PREREQUISITES = "SET_COURSE_PREREQUISITES",
  SET_COURSE_AUDIENCE = "SET_COURSE_AUDIENCE",
  SET_COURSE_DURATION = "SET_COURSE_DURATION",
  SET_COURSE_TAGS = "SET_COURSE_TAGS",
  
  // Pricing & Discount
  SET_COURSE_FAKE_DISCOUNT = "SET_COURSE_FAKE_DISCOUNT",
  SET_COURSE_PLANS = "SET_COURSE_PLANS",
  UPDATE_COURSE_PLAN = "UPDATE_COURSE_PLAN",
  
  // Content Management
  SET_COURSE_MODULES = "SET_COURSE_MODULES",
  ADD_COURSE_MODULE = "ADD_COURSE_MODULE",
  UPDATE_COURSE_MODULE = "UPDATE_COURSE_MODULE",
  DELETE_COURSE_MODULE = "DELETE_COURSE_MODULE",
  REORDER_COURSE_MODULES = "REORDER_COURSE_MODULES",
  
  // Lessons Management
  ADD_COURSE_LESSON = "ADD_COURSE_LESSON",
  UPDATE_COURSE_LESSON = "UPDATE_COURSE_LESSON",
  DELETE_COURSE_LESSON = "DELETE_COURSE_LESSON",
  REORDER_COURSE_LESSONS = "REORDER_COURSE_LESSONS",
  
  // Content Management
  ADD_COURSE_CONTENT = "ADD_COURSE_CONTENT",
  UPDATE_COURSE_CONTENT = "UPDATE_COURSE_CONTENT",
  DELETE_COURSE_CONTENT = "DELETE_COURSE_CONTENT",
  REORDER_COURSE_CONTENT = "REORDER_COURSE_CONTENT",
  
  // Instructor Management
  SET_COURSE_INSTRUCTOR = "SET_COURSE_INSTRUCTOR",
  ADD_COURSE_INSTRUCTOR = "ADD_COURSE_INSTRUCTOR",
  REMOVE_COURSE_INSTRUCTOR = "REMOVE_COURSE_INSTRUCTOR",
  
  // Reviews Management
  SET_COURSE_REVIEWS = "SET_COURSE_REVIEWS",
  ADD_COURSE_REVIEW = "ADD_COURSE_REVIEW",
  UPDATE_COURSE_REVIEW = "UPDATE_COURSE_REVIEW",
  DELETE_COURSE_REVIEW = "DELETE_COURSE_REVIEW",
  SET_FEATURED_REVIEWS = "SET_FEATURED_REVIEWS",
  
  // FAQ Management
  SET_COURSE_FAQS = "SET_COURSE_FAQS",
  ADD_COURSE_FAQ = "ADD_COURSE_FAQ",
  UPDATE_COURSE_FAQ = "UPDATE_COURSE_FAQ",
  DELETE_COURSE_FAQ = "DELETE_COURSE_FAQ",
  REORDER_COURSE_FAQS = "REORDER_COURSE_FAQS",
  
  // Quiz Management
  SET_COURSE_SCHOLARSHIP_QUIZ = "SET_COURSE_SCHOLARSHIP_QUIZ",
  ADD_COURSE_QUIZ = "ADD_COURSE_QUIZ",
  UPDATE_COURSE_QUIZ = "UPDATE_COURSE_QUIZ",
  DELETE_COURSE_QUIZ = "DELETE_COURSE_QUIZ",
  
  // SEO Management
  SET_COURSE_META_TITLE = "SET_COURSE_META_TITLE",
  SET_COURSE_META_DESCRIPTION = "SET_COURSE_META_DESCRIPTION",
  SET_COURSE_KEYWORDS = "SET_COURSE_KEYWORDS",
  
  // Timestamps
  SET_COURSE_CREATED_AT = "SET_COURSE_CREATED_AT",
  SET_COURSE_UPDATED_AT = "SET_COURSE_UPDATED_AT",
  SET_COURSE_CREATED_BY = "SET_COURSE_CREATED_BY",
  
  // Error Handling
  SET_COURSE_ERROR = "SET_COURSE_ERROR",
  CLEAR_COURSE_ERROR = "CLEAR_COURSE_ERROR",
  
  // Loading States
  SET_COURSE_LOADING = "SET_COURSE_LOADING",
  SET_COURSE_SAVING = "SET_COURSE_SAVING",
  
  // Validation
  SET_COURSE_VALIDATION_ERRORS = "SET_COURSE_VALIDATION_ERRORS",
  CLEAR_COURSE_VALIDATION_ERRORS = "CLEAR_COURSE_VALIDATION_ERRORS",
}

// ===================
// Action Interface
// ===================

export interface CourseAction {
  type: CourseActionType;
  payload: any;
}

// ===================
// Action Creators
// ===================

export const courseActions = {
  // Basic Course Management
  setCourse: (course: Course) => ({
    type: CourseActionType.SET_COURSE,
    payload: course,
  }),
  
  resetCourse: (course?: Partial<Course>) => ({
    type: CourseActionType.RESET_COURSE,
    payload: course || {},
  }),
  
  updateCourseField: (field: string, value: any) => ({
    type: CourseActionType.UPDATE_COURSE_FIELD,
    payload: { field, value },
  }),
  
  // Basic Information
  setCourseTitle: (title: string) => ({
    type: CourseActionType.SET_COURSE_TITLE,
    payload: title,
  }),
  
  setCourseDescription: (description: string) => ({
    type: CourseActionType.SET_COURSE_DESCRIPTION,
    payload: description,
  }),
  
  setCourseShortDescription: (shortDescription: string) => ({
    type: CourseActionType.SET_COURSE_SHORT_DESCRIPTION,
    payload: shortDescription,
  }),
  
  setCourseCategory: (category: string) => ({
    type: CourseActionType.SET_COURSE_CATEGORY,
    payload: category,
  }),
  
  setCourseSubcategory: (subcategory: string) => ({
    type: CourseActionType.SET_COURSE_SUBCATEGORY,
    payload: subcategory,
  }),
  
  setCourseThumbnail: (thumbnail: string) => ({
    type: CourseActionType.SET_COURSE_THUMBNAIL,
    payload: thumbnail,
  }),
  
  setCoursePreviewVideoUrl: (previewVideoUrl: string) => ({
    type: CourseActionType.SET_COURSE_PREVIEW_VIDEO_URL,
    payload: previewVideoUrl,
  }),
  
  setCourseSlug: (slug: string) => ({
    type: CourseActionType.SET_COURSE_SLUG,
    payload: slug,
  }),
  
  setCourseLanguage: (language: string) => ({
    type: CourseActionType.SET_COURSE_LANGUAGE,
    payload: language,
  }),
  
  // Status & Features
  setCourseIsFeatured: (isFeatured: boolean) => ({
    type: CourseActionType.SET_COURSE_IS_FEATURED,
    payload: isFeatured,
  }),
  
  setCourseIsCertified: (isCertified: boolean) => ({
    type: CourseActionType.SET_COURSE_IS_CERTIFIED,
    payload: isCertified,
  }),
  
  setCourseIsActive: (isActive: boolean) => ({
    type: CourseActionType.SET_COURSE_IS_ACTIVE,
    payload: isActive,
  }),
  
  setCourseScholarship: (scholarship: boolean) => ({
    type: CourseActionType.SET_COURSE_SCHOLARSHIP,
    payload: scholarship,
  }),
  
  setCourseScholarshipDescription: (scholarshipDescription: string) => ({
    type: CourseActionType.SET_COURSE_SCHOLARSHIP_DESCRIPTION,
    payload: scholarshipDescription,
  }),
  
  // Learning Information
  setCourseWhatYouWillLearn: (whatYouWillLearn: string) => ({
    type: CourseActionType.SET_COURSE_WHAT_YOU_WILL_LEARN,
    payload: whatYouWillLearn,
  }),
  
  setCourseSkills: (skills: string[]) => ({
    type: CourseActionType.SET_COURSE_SKILLS,
    payload: skills,
  }),
  
  setCourseKeyFeatures: (keyFeatures: { title: string; description: string }[]) => ({
    type: CourseActionType.SET_COURSE_KEY_FEATURES,
    payload: keyFeatures,
  }),
  
  setCourseFeatures: (features: string[]) => ({
    type: CourseActionType.SET_COURSE_FEATURES,
    payload: features,
  }),
  
  setCourseCareerPaths: (careerPaths: string[]) => ({
    type: CourseActionType.SET_COURSE_CAREER_PATHS,
    payload: careerPaths,
  }),
  
  setCourseSkillLevel: (skillLevel: string) => ({
    type: CourseActionType.SET_COURSE_SKILL_LEVEL,
    payload: skillLevel,
  }),
  
  setCourseWhoShouldJoin: (whoShouldJoin: string) => ({
    type: CourseActionType.SET_COURSE_WHO_SHOULD_JOIN,
    payload: whoShouldJoin,
  }),
  
  setCoursePrerequisites: (prerequisites: string[]) => ({
    type: CourseActionType.SET_COURSE_PREREQUISITES,
    payload: prerequisites,
  }),
  
  setCourseAudience: (audience: "college-students" | "professionals") => ({
    type: CourseActionType.SET_COURSE_AUDIENCE,
    payload: audience,
  }),
  
  setCourseDuration: (duration: string) => ({
    type: CourseActionType.SET_COURSE_DURATION,
    payload: duration,
  }),
  
  setCourseTags: (tags: string[]) => ({
    type: CourseActionType.SET_COURSE_TAGS,
    payload: tags,
  }),
  
  // Content Management
  setCourseModules: (modules: CourseModule[]) => ({
    type: CourseActionType.SET_COURSE_MODULES,
    payload: modules,
  }),
  
  addCourseModule: (module: CourseModule) => ({
    type: CourseActionType.ADD_COURSE_MODULE,
    payload: module,
  }),
  
  updateCourseModule: (moduleId: string, updates: Partial<CourseModule>) => ({
    type: CourseActionType.UPDATE_COURSE_MODULE,
    payload: { moduleId, updates },
  }),
  
  deleteCourseModule: (moduleId: string) => ({
    type: CourseActionType.DELETE_COURSE_MODULE,
    payload: moduleId,
  }),
  
  reorderCourseModules: (modules: CourseModule[]) => ({
    type: CourseActionType.REORDER_COURSE_MODULES,
    payload: modules,
  }),
  
  // Instructor Management
  setCourseInstructor: (instructor: CourseInstructor[]) => ({
    type: CourseActionType.SET_COURSE_INSTRUCTOR,
    payload: instructor,
  }),
  
  addCourseInstructor: (instructor: CourseInstructor) => ({
    type: CourseActionType.ADD_COURSE_INSTRUCTOR,
    payload: instructor,
  }),
  
  removeCourseInstructor: (instructorId: string) => ({
    type: CourseActionType.REMOVE_COURSE_INSTRUCTOR,
    payload: instructorId,
  }),
  
  // Reviews Management
  setCourseReviews: (reviews: Review[]) => ({
    type: CourseActionType.SET_COURSE_REVIEWS,
    payload: reviews,
  }),
  
  addCourseReview: (review: Review) => ({
    type: CourseActionType.ADD_COURSE_REVIEW,
    payload: review,
  }),
  
  updateCourseReview: (reviewId: string, updates: Partial<Review>) => ({
    type: CourseActionType.UPDATE_COURSE_REVIEW,
    payload: { reviewId, updates },
  }),
  
  deleteCourseReview: (reviewId: string) => ({
    type: CourseActionType.DELETE_COURSE_REVIEW,
    payload: reviewId,
  }),
  
  setFeaturedReviews: (featuredReviews: Review[]) => ({
    type: CourseActionType.SET_FEATURED_REVIEWS,
    payload: featuredReviews,
  }),
  
  // FAQ Management
  setCourseFaqs: (faqs: FAQ[]) => ({
    type: CourseActionType.SET_COURSE_FAQS,
    payload: faqs,
  }),
  
  addCourseFaq: (faq: FAQ) => ({
    type: CourseActionType.ADD_COURSE_FAQ,
    payload: faq,
  }),
  
  updateCourseFaq: (faqId: string, updates: Partial<FAQ>) => ({
    type: CourseActionType.UPDATE_COURSE_FAQ,
    payload: { faqId, updates },
  }),
  
  deleteCourseFaq: (faqId: string) => ({
    type: CourseActionType.DELETE_COURSE_FAQ,
    payload: faqId,
  }),
  
  reorderCourseFaqs: (faqs: FAQ[]) => ({
    type: CourseActionType.REORDER_COURSE_FAQS,
    payload: faqs,
  }),
  
  // Quiz Management
  setCourseScholarshipQuiz: (quiz: Quiz[]) => ({
    type: CourseActionType.SET_COURSE_SCHOLARSHIP_QUIZ,
    payload: quiz,
  }),
  
  addCourseQuiz: (quiz: Quiz) => ({
    type: CourseActionType.ADD_COURSE_QUIZ,
    payload: quiz,
  }),
  
  updateCourseQuiz: (quizId: string, updates: Partial<Quiz>) => ({
    type: CourseActionType.UPDATE_COURSE_QUIZ,
    payload: { quizId, updates },
  }),
  
  deleteCourseQuiz: (quizId: string) => ({
    type: CourseActionType.DELETE_COURSE_QUIZ,
    payload: quizId,
  }),
  
  // SEO Management
  setCourseMetaTitle: (metaTitle: string) => ({
    type: CourseActionType.SET_COURSE_META_TITLE,
    payload: metaTitle,
  }),
  
  setCourseMetaDescription: (metaDescription: string) => ({
    type: CourseActionType.SET_COURSE_META_DESCRIPTION,
    payload: metaDescription,
  }),
  
  setCourseKeywords: (keywords: string[]) => ({
    type: CourseActionType.SET_COURSE_KEYWORDS,
    payload: keywords,
  }),
  
  // Pricing & Discount
  setCourseFakeDiscount: (fakeDiscount: number) => ({
    type: CourseActionType.SET_COURSE_FAKE_DISCOUNT,
    payload: fakeDiscount,
  }),
  
  setCoursePlans: (plans: { elite?: Plan; essential?: Plan }) => ({
    type: CourseActionType.SET_COURSE_PLANS,
    payload: plans,
  }),
  
  updateCoursePlan: (planType: "elite" | "essential", plan: Plan) => ({
    type: CourseActionType.UPDATE_COURSE_PLAN,
    payload: { planType, plan },
  }),
  
  // Error Handling
  setCourseError: (error: string) => ({
    type: CourseActionType.SET_COURSE_ERROR,
    payload: error,
  }),
  
  clearCourseError: () => ({
    type: CourseActionType.CLEAR_COURSE_ERROR,
    payload: null,
  }),
  
  // Loading States
  setCourseLoading: (isLoading: boolean) => ({
    type: CourseActionType.SET_COURSE_LOADING,
    payload: isLoading,
  }),
  
  setCourseSaving: (isSaving: boolean) => ({
    type: CourseActionType.SET_COURSE_SAVING,
    payload: isSaving,
  }),
  
  // Validation
  setCourseValidationErrors: (validationErrors: Record<string, string[]>) => ({
    type: CourseActionType.SET_COURSE_VALIDATION_ERRORS,
    payload: validationErrors,
  }),
  
  clearCourseValidationErrors: () => ({
    type: CourseActionType.CLEAR_COURSE_VALIDATION_ERRORS,
    payload: null,
  }),
  
  // Timestamps
  setCourseCreatedAt: (createdAt: Date) => ({
    type: CourseActionType.SET_COURSE_CREATED_AT,
    payload: createdAt,
  }),
  
  setCourseUpdatedAt: (updatedAt: Date) => ({
    type: CourseActionType.SET_COURSE_UPDATED_AT,
    payload: updatedAt,
  }),
  
  setCourseCreatedBy: (createdBy: string) => ({
    type: CourseActionType.SET_COURSE_CREATED_BY,
    payload: createdBy,
  }),
  
  // Metrics
  setCourseEnrolledCount: (enrolledCount: number) => ({
    type: CourseActionType.SET_COURSE_ENROLLED_COUNT,
    payload: enrolledCount,
  }),
  
  setCourseTotalRatings: (totalRatings: number) => ({
    type: CourseActionType.SET_COURSE_TOTAL_RATINGS,
    payload: totalRatings,
  }),
  
  setCourseTotalLectures: (totalLectures: number) => ({
    type: CourseActionType.SET_COURSE_TOTAL_LECTURES,
    payload: totalLectures,
  }),
}; 