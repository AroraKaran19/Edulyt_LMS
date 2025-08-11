import { CourseModule, Review, FAQ, Quiz, CourseInstructor } from "@/types"

// ===================
// Validation Error Types
// ===================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ===================
// Validation Utilities
// ===================

export const validationUtils = {
  // Check if value exists and is not empty
  isRequired: (value: any, fieldName: string): ValidationError | null => {
    if (value === null || value === undefined || value === "") {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
        code: "REQUIRED_FIELD"
      };
    }
    return null;
  },

  // Check if string is not empty after trimming
  isNonEmptyString: (value: any, fieldName: string): ValidationError | null => {
    if (typeof value !== "string" || value.trim() === "") {
      return {
        field: fieldName,
        message: `${fieldName} must be a non-empty string`,
        code: "EMPTY_STRING"
      };
    }
    return null;
  },

  // Check if array is not empty
  isNonEmptyArray: (value: any, fieldName: string): ValidationError | null => {
    if (!Array.isArray(value) || value.length === 0) {
      return {
        field: fieldName,
        message: `${fieldName} must be a non-empty array`,
        code: "EMPTY_ARRAY"
      };
    }
    return null;
  },

  // Check if value is a valid ID
  isValidId: (value: any, fieldName: string): ValidationError | null => {
    if (!value || typeof value !== "string" || value.trim() === "") {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid ID`,
        code: "INVALID_ID"
      };
    }
    return null;
  },

  // Check if value is a valid URL
  isValidUrl: (value: any, fieldName: string): ValidationError | null => {
    if (!value || typeof value !== "string") {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid URL`,
        code: "INVALID_URL"
      };
    }
    
    try {
      new URL(value);
      return null;
    } catch {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid URL`,
        code: "INVALID_URL"
      };
    }
  },

  // Check if value is a valid number
  isValidNumber: (value: any, fieldName: string, min?: number, max?: number): ValidationError | null => {
    if (typeof value !== "number" || isNaN(value)) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid number`,
        code: "INVALID_NUMBER"
      };
    }

    if (min !== undefined && value < min) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${min}`,
        code: "MIN_VALUE"
      };
    }

    if (max !== undefined && value > max) {
      return {
        field: fieldName,
        message: `${fieldName} must be at most ${max}`,
        code: "MAX_VALUE"
      };
    }

    return null;
  },

  // Check if value is a valid boolean
  isValidBoolean: (value: any, fieldName: string): ValidationError | null => {
    if (typeof value !== "boolean") {
      return {
        field: fieldName,
        message: `${fieldName} must be a boolean`,
        code: "INVALID_BOOLEAN"
      };
    }
    return null;
  },

  // Check if value is a valid date
  isValidDate: (value: any, fieldName: string): ValidationError | null => {
    if (!value || !(value instanceof Date) || isNaN(value.getTime())) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid date`,
        code: "INVALID_DATE"
      };
    }
    return null;
  },

  // Check if array contains valid objects
  isValidObjectArray: (value: any, fieldName: string, validator: (item: any) => ValidationError[]): ValidationError[] => {
    if (!Array.isArray(value)) {
      return [{
        field: fieldName,
        message: `${fieldName} must be an array`,
        code: "NOT_ARRAY"
      }];
    }

    const errors: ValidationError[] = [];
    value.forEach((item, index) => {
      const itemErrors = validator(item);
      itemErrors.forEach(error => {
        errors.push({
          ...error,
          field: `${fieldName}[${index}].${error.field}`
        });
      });
    });

    return errors;
  }
};

// ===================
// Entity Validators
// ===================

export const entityValidators = {
  // Validate CourseModule (strict validation for form submission)
  validateCourseModule: (module: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Required fields
    const requiredChecks = [
      validationUtils.isNonEmptyString(module.title, "title"),
      validationUtils.isValidId(module._id, "_id")
    ];

    requiredChecks.forEach(check => {
      if (check) errors.push(check);
    });

    // Optional fields validation
    if (module.description && typeof module.description !== "string") {
      errors.push({
        field: "description",
        message: "Description must be a string",
        code: "INVALID_TYPE"
      });
    }

    if (module.thumbnailUrl && !validationUtils.isValidUrl(module.thumbnailUrl, "thumbnailUrl")) {
      errors.push({
        field: "thumbnailUrl",
        message: "Thumbnail URL must be a valid URL",
        code: "INVALID_URL"
      });
    }

    // Validate lessons if present
    if (module.lessons && Array.isArray(module.lessons)) {
      const lessonErrors = validationUtils.isValidObjectArray(
        module.lessons,
        "lessons",
        entityValidators.validateCourseLesson
      );
      errors.push(...lessonErrors);
    }

    return errors;
  },

  // Validate CourseModule Lenient (allows empty fields during creation/editing)
  validateCourseModuleLenient: (module: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Validate ID if present
    if (module._id) {
      const idError = validationUtils.isValidId(module._id, "_id");
      if (idError) errors.push(idError);
    }

    // Allow empty title during input - only check type if provided
    if (module.title !== undefined && module.title !== null && typeof module.title !== "string") {
      errors.push({
        field: "title",
        message: "Title must be a string",
        code: "INVALID_TYPE"
      });
    }

    // Optional fields validation
    if (module.description !== undefined && module.description !== null && typeof module.description !== "string") {
      errors.push({
        field: "description",
        message: "Description must be a string",
        code: "INVALID_TYPE"
      });
    }

    if (module.thumbnailUrl && typeof module.thumbnailUrl === "string" && module.thumbnailUrl.trim() !== "") {
      try {
        new URL(module.thumbnailUrl);
      } catch {
        errors.push({
          field: "thumbnailUrl",
          message: "Thumbnail URL must be a valid URL",
          code: "INVALID_URL"
        });
      }
    }

    // Validate lessons if present (with lenient validation)
    if (module.lessons && Array.isArray(module.lessons)) {
      const lessonErrors = validationUtils.isValidObjectArray(
        module.lessons,
        "lessons",
        entityValidators.validateCourseLessonLenient
      );
      errors.push(...lessonErrors);
    }

    return errors;
  },

  // Validate CourseLesson (strict validation)
  validateCourseLesson: (lesson: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Required fields
    const requiredChecks = [
      validationUtils.isNonEmptyString(lesson.title, "title"),
      validationUtils.isValidId(lesson._id, "_id")
    ];

    requiredChecks.forEach(check => {
      if (check) errors.push(check);
    });

    // Validate content if present
    if (lesson.content && Array.isArray(lesson.content)) {
      const contentErrors = validationUtils.isValidObjectArray(
        lesson.content,
        "content",
        entityValidators.validateContent
      );
      errors.push(...contentErrors);
    }

    return errors;
  },

  // Validate CourseLesson Lenient (allows empty fields during creation/editing)
  validateCourseLessonLenient: (lesson: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Validate ID if present
    if (lesson._id) {
      const idError = validationUtils.isValidId(lesson._id, "_id");
      if (idError) errors.push(idError);
    }

    // Allow empty title during input - only check type if provided
    if (lesson.title !== undefined && lesson.title !== null && typeof lesson.title !== "string") {
      errors.push({
        field: "title",
        message: "Title must be a string",
        code: "INVALID_TYPE"
      });
    }

    // Validate content if present (with lenient validation)
    if (lesson.content && Array.isArray(lesson.content)) {
      const contentErrors = validationUtils.isValidObjectArray(
        lesson.content,
        "content",
        entityValidators.validateContentLenient
      );
      errors.push(...contentErrors);
    }

    // Validate contents if present (with lenient validation)
    if (lesson.contents && Array.isArray(lesson.contents)) {
      const contentErrors = validationUtils.isValidObjectArray(
        lesson.contents,
        "contents",
        entityValidators.validateContentLenient
      );
      errors.push(...contentErrors);
    }

    return errors;
  },

  // Validate Content (strict validation)
  validateContent: (content: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Required fields
    const requiredChecks = [
      validationUtils.isNonEmptyString(content.title, "title"),
      validationUtils.isValidId(content._id, "_id"),
      validationUtils.isNonEmptyString(content.type, "type")
    ];

    requiredChecks.forEach(check => {
      if (check) errors.push(check);
    });

    // Validate content type
    if (content.type && !["video", "quiz"].includes(content.type)) {
      errors.push({
        field: "type",
        message: "Content type must be 'video' or 'quiz'",
        code: "INVALID_CONTENT_TYPE"
      });
    }

    return errors;
  },

  // Validate Content Lenient (allows empty fields during creation/editing, but title is required)
  validateContentLenient: (content: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Validate ID if present
    if (content._id) {
      const idError = validationUtils.isValidId(content._id, "_id");
      if (idError) errors.push(idError);
    }

    // Content title is now required even in lenient mode
    const titleError = validationUtils.isNonEmptyString(content.title, "title");
    if (titleError) errors.push(titleError);

    // Validate content type if provided
    if (content.type && !["video", "quiz"].includes(content.type)) {
      errors.push({
        field: "type",
        message: "Content type must be 'video' or 'quiz'",
        code: "INVALID_CONTENT_TYPE"
      });
    }

    return errors;
  },

  // Validate Instructor
  validateInstructor: (instructor: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Required fields
    const requiredChecks = [
      validationUtils.isNonEmptyString(instructor.name, "name"),
      validationUtils.isValidId(instructor._id, "_id")
    ];

    requiredChecks.forEach(check => {
      if (check) errors.push(check);
    });

    // Validate email if present
    if (instructor.email && !instructor.email.includes("@")) {
      errors.push({
        field: "email",
        message: "Email must be a valid email address",
        code: "INVALID_EMAIL"
      });
    }

    return errors;
  },

  // Validate Review
  validateReview: (review: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Required fields
    const requiredChecks = [
      validationUtils.isNonEmptyString(review.name, "name"),
      validationUtils.isValidNumber(review.rating, "rating", 1, 5),
      validationUtils.isNonEmptyString(review.comment, "comment")
    ];

    requiredChecks.forEach(check => {
      if (check) errors.push(check);
    });

    // Validate date if present
    if (review.date && !validationUtils.isValidDate(review.date, "date")) {
      errors.push({
        field: "date",
        message: "Date must be a valid date",
        code: "INVALID_DATE"
      });
    }

    return errors;
  },

  // Validate FAQ
  validateFAQ: (faq: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Required fields
    const requiredChecks = [
      validationUtils.isNonEmptyString(faq.question, "question"),
      validationUtils.isNonEmptyString(faq.answer, "answer"),
      validationUtils.isValidId(faq._id, "_id")
    ];

    requiredChecks.forEach(check => {
      if (check) errors.push(check);
    });

    return errors;
  },

  // Validate Quiz
  validateQuiz: (quiz: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Required fields
    const requiredChecks = [
      validationUtils.isNonEmptyString(quiz.title, "title"),
      validationUtils.isValidId(quiz._id, "_id"),
      validationUtils.isNonEmptyArray(quiz.questions, "questions")
    ];

    requiredChecks.forEach(check => {
      if (check) errors.push(check);
    });

    // Validate questions
    if (quiz.questions && Array.isArray(quiz.questions)) {
      const questionErrors = validationUtils.isValidObjectArray(
        quiz.questions,
        "questions",
        entityValidators.validateQuizQuestion
      );
      errors.push(...questionErrors);
    }

    return errors;
  },

  // Validate QuizQuestion
  validateQuizQuestion: (question: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Required fields
    const requiredChecks = [
      validationUtils.isNonEmptyString(question.question, "question"),
      validationUtils.isValidId(question._id, "_id"),
      validationUtils.isNonEmptyArray(question.options, "options"),
      validationUtils.isNonEmptyArray(question.correctAnswer, "correctAnswer")
    ];

    requiredChecks.forEach(check => {
      if (check) errors.push(check);
    });

    return errors;
  },

  // Validate Plan (strict validation for form submission)
  validatePlan: (plan: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Required fields
    const requiredChecks = [
      validationUtils.isNonEmptyString(plan.title, "title"),
      validationUtils.isNonEmptyString(plan.type, "type"),
      validationUtils.isValidNumber(plan.price, "price", 0)
    ];

    requiredChecks.forEach(check => {
      if (check) errors.push(check);
    });

    // Validate plan type
    if (plan.type && !["elite", "essential"].includes(plan.type)) {
      errors.push({
        field: "type",
        message: "Plan type must be 'elite' or 'essential'",
        code: "INVALID_PLAN_TYPE"
      });
    }

    // Validate features array
    if (plan.features && Array.isArray(plan.features)) {
      const featureErrors = validationUtils.isValidObjectArray(
        plan.features,
        "features",
        entityValidators.validatePlanFeature
      );
      errors.push(...featureErrors);
    }

    return errors;
  },

  // Validate Plan Lenient (allows empty strings during input changes)
  validatePlanLenient: (plan: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Only validate if values are provided (allow empty during input)
    if (plan.title !== undefined && plan.title !== null && typeof plan.title === "string" && plan.title.trim() === "") {
      // Allow empty title during input - no error
    } else if (plan.title !== undefined && typeof plan.title !== "string") {
      errors.push({
        field: "title",
        message: "Title must be a string",
        code: "INVALID_TYPE"
      });
    }

    if (plan.type !== undefined && plan.type !== null && typeof plan.type === "string" && plan.type.trim() === "") {
      // Allow empty type during input - no error
    } else if (plan.type && !["elite", "essential"].includes(plan.type)) {
      errors.push({
        field: "type",
        message: "Plan type must be 'elite' or 'essential'",
        code: "INVALID_PLAN_TYPE"
      });
    }

    // Validate price if provided
    if (plan.price !== undefined && plan.price !== null) {
      const priceError = validationUtils.isValidNumber(plan.price, "price", 0);
      if (priceError) errors.push(priceError);
    }

    // Validate features array if provided
    if (plan.features && Array.isArray(plan.features)) {
      const featureErrors = validationUtils.isValidObjectArray(
        plan.features,
        "features",
        entityValidators.validatePlanFeatureLenient
      );
      errors.push(...featureErrors);
    }

    return errors;
  },

  // Validate PlanFeature (strict)
  validatePlanFeature: (feature: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Required fields
    const requiredChecks = [
      validationUtils.isNonEmptyString(feature.title, "title"),
      validationUtils.isValidBoolean(feature.provided, "provided")
    ];

    requiredChecks.forEach(check => {
      if (check) errors.push(check);
    });

    return errors;
  },

  // Validate PlanFeature Lenient (allows empty during input)
  validatePlanFeatureLenient: (feature: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Only validate if values are provided
    if (feature.title !== undefined && feature.title !== null && typeof feature.title === "string" && feature.title.trim() === "") {
      // Allow empty title during input - no error
    } else if (feature.title !== undefined && typeof feature.title !== "string") {
      errors.push({
        field: "title",
        message: "Feature title must be a string",
        code: "INVALID_TYPE"
      });
    }

    if (feature.provided !== undefined && feature.provided !== null) {
      const providedError = validationUtils.isValidBoolean(feature.provided, "provided");
      if (providedError) errors.push(providedError);
    }

    return errors;
  },

  // Validate Discount
  validateDiscount: (discount: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Required fields
    const requiredChecks = [
      validationUtils.isNonEmptyString(discount.discount, "discount"),
      validationUtils.isValidNumber(discount.value, "value", 0, 100)
    ];

    requiredChecks.forEach(check => {
      if (check) errors.push(check);
    });

    // Validate discount type
    if (discount.discount && !["percentage", "fixed"].includes(discount.discount)) {
      errors.push({
        field: "discount",
        message: "Discount type must be 'percentage' or 'fixed'",
        code: "INVALID_DISCOUNT_TYPE"
      });
    }

    return errors;
  },

  // Validate Discount Lenient (allows partial/incomplete data during updates)
  validateDiscountLenient: (discount: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Only validate if values are provided
    if (discount.discount !== undefined && discount.discount !== null) {
      if (typeof discount.discount !== "string" || discount.discount.trim() === "") {
        errors.push({
          field: "discount",
          message: "Discount type must be a non-empty string",
          code: "INVALID_DISCOUNT_TYPE"
        });
      } else if (!["percentage", "fixed"].includes(discount.discount)) {
        errors.push({
          field: "discount",
          message: "Discount type must be 'percentage' or 'fixed'",
          code: "INVALID_DISCOUNT_TYPE"
        });
      }
    }

    if (discount.value !== undefined && discount.value !== null) {
      const valueError = validationUtils.isValidNumber(discount.value, "value", 0, 100);
      if (valueError) errors.push(valueError);
    }

    return errors;
  }
};

// ===================
// Action Validators
// ===================

export const actionValidators = {
  // Validate UPDATE_COURSE_MODULE action
  validateUpdateCourseModule: (payload: any, state: any): ValidationResult => {
    const errors: ValidationError[] = [];

    // Validate payload structure
    if (!payload || typeof payload !== "object") {
      return {
        isValid: false,
        errors: [{
          field: "payload",
          message: "Payload must be an object",
          code: "INVALID_PAYLOAD"
        }]
      };
    }

    // Validate moduleId
    const moduleIdError = validationUtils.isValidId(payload.moduleId, "moduleId");
    if (moduleIdError) errors.push(moduleIdError);

    // Check if module exists
    if (payload.moduleId && state.course.modules) {
      const moduleExists = state.course.modules.some((m: CourseModule) => m._id === payload.moduleId);
      if (!moduleExists) {
        errors.push({
          field: "moduleId",
          message: `Module with ID '${payload.moduleId}' not found`,
          code: "MODULE_NOT_FOUND"
        });
      }
    }

    // Validate updates object - use lenient validation for updates to allow partial/incomplete data
    if (payload.updates && typeof payload.updates === "object") {
      const updateErrors = entityValidators.validateCourseModuleLenient(payload.updates);
      errors.push(...updateErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate ADD_COURSE_MODULE action
  validateAddCourseModule: (payload: any): ValidationResult => {
    const errors: ValidationError[] = [];

    if (!payload) {
      return {
        isValid: false,
        errors: [{
          field: "payload",
          message: "Module payload is required",
          code: "MISSING_PAYLOAD"
        }]
      };
    }

    // Use lenient validation for ADD actions to allow empty titles during creation
    const moduleErrors = entityValidators.validateCourseModuleLenient(payload);
    errors.push(...moduleErrors);

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate ADD_COURSE_INSTRUCTOR action
  validateAddCourseInstructor: (payload: any): ValidationResult => {
    const errors: ValidationError[] = [];

    if (!payload) {
      return {
        isValid: false,
        errors: [{
          field: "payload",
          message: "Instructor payload is required",
          code: "MISSING_PAYLOAD"
        }]
      };
    }

    // Validate instructor object
    const instructorErrors = entityValidators.validateInstructor(payload);
    errors.push(...instructorErrors);

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate UPDATE_COURSE_REVIEW action
  validateUpdateCourseReview: (payload: any, state: any): ValidationResult => {
    const errors: ValidationError[] = [];

    // Validate payload structure
    if (!payload || typeof payload !== "object") {
      return {
        isValid: false,
        errors: [{
          field: "payload",
          message: "Payload must be an object",
          code: "INVALID_PAYLOAD"
        }]
      };
    }

    // Validate reviewId
    const reviewIdError = validationUtils.isValidId(payload.reviewId, "reviewId");
    if (reviewIdError) errors.push(reviewIdError);

    // Check if review exists
    if (payload.reviewId && state.course.reviews) {
      const reviewExists = state.course.reviews.some((r: Review) => r._id === payload.reviewId);
      if (!reviewExists) {
        errors.push({
          field: "reviewId",
          message: `Review with ID '${payload.reviewId}' not found`,
          code: "REVIEW_NOT_FOUND"
        });
      }
    }

    // Validate updates object
    if (payload.updates && typeof payload.updates === "object") {
      const updateErrors = entityValidators.validateReview(payload.updates);
      errors.push(...updateErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate ADD_COURSE_REVIEW action
  validateAddCourseReview: (payload: any): ValidationResult => {
    const errors: ValidationError[] = [];

    if (!payload) {
      return {
        isValid: false,
        errors: [{
          field: "payload",
          message: "Review payload is required",
          code: "MISSING_PAYLOAD"
        }]
      };
    }

    // Validate review object
    const reviewErrors = entityValidators.validateReview(payload);
    errors.push(...reviewErrors);

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate UPDATE_COURSE_FAQ action
  validateUpdateCourseFAQ: (payload: any, state: any): ValidationResult => {
    const errors: ValidationError[] = [];

    // Validate payload structure
    if (!payload || typeof payload !== "object") {
      return {
        isValid: false,
        errors: [{
          field: "payload",
          message: "Payload must be an object",
          code: "INVALID_PAYLOAD"
        }]
      };
    }

    // Validate faqIndex
    if (payload.faqIndex !== undefined && typeof payload.faqIndex !== "number") {
      errors.push({
        field: "faqIndex",
        message: "FAQ index must be a number",
        code: "INVALID_FAQ_INDEX"
      });
    }

    // Check if FAQ exists (using array index since FAQs don't have IDs)
    if (payload.faqIndex !== undefined && state.course.faqs) {
      const faqExists = state.course.faqs[payload.faqIndex] !== undefined;
      if (!faqExists) {
        errors.push({
          field: "faqIndex",
          message: `FAQ at index '${payload.faqIndex}' not found`,
          code: "FAQ_NOT_FOUND"
        });
      }
    }

    // Validate updates object
    if (payload.updates && typeof payload.updates === "object") {
      const updateErrors = entityValidators.validateFAQ(payload.updates);
      errors.push(...updateErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate ADD_COURSE_FAQ action
  validateAddCourseFAQ: (payload: any): ValidationResult => {
    const errors: ValidationError[] = [];

    if (!payload) {
      return {
        isValid: false,
        errors: [{
          field: "payload",
          message: "FAQ payload is required",
          code: "MISSING_PAYLOAD"
        }]
      };
    }

    // Validate FAQ object
    const faqErrors = entityValidators.validateFAQ(payload);
    errors.push(...faqErrors);

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate UPDATE_COURSE_QUIZ action
  validateUpdateCourseQuiz: (payload: any, state: any): ValidationResult => {
    const errors: ValidationError[] = [];

    // Validate payload structure
    if (!payload || typeof payload !== "object") {
      return {
        isValid: false,
        errors: [{
          field: "payload",
          message: "Payload must be an object",
          code: "INVALID_PAYLOAD"
        }]
      };
    }

    // Validate quizId
    const quizIdError = validationUtils.isValidId(payload.quizId, "quizId");
    if (quizIdError) errors.push(quizIdError);

    // Check if quiz exists
    if (payload.quizId && state.course.scholarshipQuiz) {
      const quizExists = state.course.scholarshipQuiz.some((q: Quiz) => q._id === payload.quizId);
      if (!quizExists) {
        errors.push({
          field: "quizId",
          message: `Quiz with ID '${payload.quizId}' not found`,
          code: "QUIZ_NOT_FOUND"
        });
      }
    }

    // Validate updates object
    if (payload.updates && typeof payload.updates === "object") {
      const updateErrors = entityValidators.validateQuiz(payload.updates);
      errors.push(...updateErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate ADD_COURSE_QUIZ action
  validateAddCourseQuiz: (payload: any): ValidationResult => {
    const errors: ValidationError[] = [];

    if (!payload) {
      return {
        isValid: false,
        errors: [{
          field: "payload",
          message: "Quiz payload is required",
          code: "MISSING_PAYLOAD"
        }]
      };
    }

    // Validate quiz object
    const quizErrors = entityValidators.validateQuiz(payload);
    errors.push(...quizErrors);

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate UPDATE_COURSE_PLAN action (lenient for input changes)
  validateUpdateCoursePlan: (payload: any): ValidationResult => {
    const errors: ValidationError[] = [];

    // Validate payload structure
    if (!payload || typeof payload !== "object") {
      return {
        isValid: false,
        errors: [{
          field: "payload",
          message: "Payload must be an object",
          code: "INVALID_PAYLOAD"
        }]
      };
    }

    // Validate planType
    if (!payload.planType || !["elite", "essential"].includes(payload.planType)) {
      errors.push({
        field: "planType",
        message: "Plan type must be 'elite' or 'essential'",
        code: "INVALID_PLAN_TYPE"
      });
    }

    // Validate plan object with lenient validation for input changes
    if (payload.plan) {
      const planErrors = entityValidators.validatePlanLenient(payload.plan);
      errors.push(...planErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate SET_COURSE_DISCOUNT action
  validateSetCourseDiscount: (payload: any): ValidationResult => {
    const errors: ValidationError[] = [];

    // Allow null for clearing discount
    if (payload === null) {
      return {
        isValid: true,
        errors: []
      };
    }

    // Validate discount object
    if (payload && typeof payload === "object") {
      const discountErrors = entityValidators.validateDiscountLenient(payload);
      errors.push(...discountErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate DELETE actions (check if ID exists)
  validateDeleteAction: (payload: any, state: any, entityType: string): ValidationResult => {
    const errors: ValidationError[] = [];

    // Validate ID
    const idError = validationUtils.isValidId(payload, "id");
    if (idError) errors.push(idError);

    // Check if entity exists based on type
    if (payload && state.course) {
      let entityExists = false;
      
      switch (entityType) {
        case "module":
          entityExists = state.course.modules?.some((m: CourseModule) => m._id === payload);
          break;
        case "review":
          entityExists = state.course.reviews?.some((r: Review) => r._id === payload);
          break;
        case "faq":
          // FAQs don't have IDs, use array index instead
          entityExists = typeof payload === "number" && 
                        state.course.faqs && 
                        state.course.faqs[payload] !== undefined;
          break;
        case "quiz":
          entityExists = state.course.scholarshipQuiz?.some((q: Quiz) => q._id === payload);
          break;
        case "instructor":
          entityExists = state.course.instructor?.some((i: CourseInstructor) => i._id === payload);
          break;
      }

      if (!entityExists) {
        errors.push({
          field: "id",
          message: `${entityType} with ID '${payload}' not found`,
          code: `${entityType.toUpperCase()}_NOT_FOUND`
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// ===================
// Main Validation Function
// ===================

export const validateAction = (action: any, state: any): ValidationResult => {
  const errors: ValidationError[] = [];

  // Basic action validation
  if (!action || typeof action !== "object") {
    return {
      isValid: false,
      errors: [{
        field: "action",
        message: "Action must be a valid object",
        code: "INVALID_ACTION"
      }]
    };
  }

  if (!action.type) {
    return {
      isValid: false,
      errors: [{
        field: "type",
        message: "Action type is required",
        code: "MISSING_ACTION_TYPE"
      }]
    };
  }

  // Validate specific actions based on type
  switch (action.type) {
    case "UPDATE_COURSE_MODULE":
      return actionValidators.validateUpdateCourseModule(action.payload, state);
    
    case "ADD_COURSE_MODULE":
      return actionValidators.validateAddCourseModule(action.payload);
    
    case "ADD_COURSE_INSTRUCTOR":
      return actionValidators.validateAddCourseInstructor(action.payload);
    
    case "UPDATE_COURSE_REVIEW":
      return actionValidators.validateUpdateCourseReview(action.payload, state);
    
    case "ADD_COURSE_REVIEW":
      return actionValidators.validateAddCourseReview(action.payload);
    
    case "UPDATE_COURSE_FAQ":
      return actionValidators.validateUpdateCourseFAQ(action.payload, state);
    
    case "ADD_COURSE_FAQ":
      return actionValidators.validateAddCourseFAQ(action.payload);
    
    case "UPDATE_COURSE_QUIZ":
      return actionValidators.validateUpdateCourseQuiz(action.payload, state);
    
    case "ADD_COURSE_QUIZ":
      return actionValidators.validateAddCourseQuiz(action.payload);
    
    case "UPDATE_COURSE_PLAN":
      return actionValidators.validateUpdateCoursePlan(action.payload);
    
    case "SET_COURSE_DISCOUNT":
      return actionValidators.validateSetCourseDiscount(action.payload);
    
    case "DELETE_COURSE_MODULE":
      return actionValidators.validateDeleteAction(action.payload, state, "module");
    
    case "DELETE_COURSE_REVIEW":
      return actionValidators.validateDeleteAction(action.payload, state, "review");
    
    case "DELETE_COURSE_FAQ":
      return actionValidators.validateDeleteAction(action.payload, state, "faq");
    
    case "DELETE_COURSE_QUIZ":
      return actionValidators.validateDeleteAction(action.payload, state, "quiz");
    
    case "REMOVE_COURSE_INSTRUCTOR":
      return actionValidators.validateDeleteAction(action.payload, state, "instructor");
    
    default:
      // For other actions, just validate basic structure
      return {
        isValid: true,
        errors: []
      };
  }
}; 