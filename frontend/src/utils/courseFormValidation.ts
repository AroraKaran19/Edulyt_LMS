import {
  CourseFormData,
  ScreenValidationResult,
  ValidationResult,
  SCREEN_CONFIG,
} from "@/types/courseForm";
import { getTextFromHtml } from './courseFormUtils';

// ===================
// Field Validation Functions
// ===================

export const validateTitle = (title: string): string[] => {
  const errors: string[] = [];

  if (!title || title.trim().length === 0) {
    errors.push("Title is required");
  } else if (title.trim().length < 5) {
    errors.push("Title must be at least 5 characters long");
  } else if (title.trim().length > 100) {
    errors.push("Title must be less than 100 characters");
  }

  return errors;
};

export const validateDescription = (description: string): string[] => {
  const errors: string[] = [];
  const textContent = getTextFromHtml(description);

  if (!description || textContent.length === 0) {
    errors.push("Description is required");
  } else if (textContent.length < 25) {
    errors.push("Description must be at least 25 characters long");
  } else if (textContent.length > 1000) {
    errors.push("Description must be less than 1000 characters");
  }

  return errors;
};

export const validateShortDescription = (
  shortDescription: string
): string[] => {
  const errors: string[] = [];
  const textContent = getTextFromHtml(shortDescription);

  if (!shortDescription || textContent.length === 0) {
    errors.push("Short description is required");
  } else if (textContent.length < 10) {
    errors.push("Short description must be at least 10 characters");
  } else if (textContent.length > 100) {
    errors.push("Short description must be less than 100 characters");
  }

  return errors;
};

export const validateCategory = (category: string): string[] => {
  const errors: string[] = [];

  if (!category || category.trim().length === 0) {
    errors.push("Category is required");
  }

  return errors;
};

export const validateThumbnail = (thumbnail: string): string[] => {
  const errors: string[] = [];

  if (!thumbnail || thumbnail.trim().length === 0) {
    errors.push("Thumbnail is required");
  } else if (!isValidUrl(thumbnail)) {
    errors.push("Thumbnail must be a valid URL");
  }

  return errors;
};

export const validateSlug = (slug: string): string[] => {
  const errors: string[] = [];

  if (!slug || slug.trim().length === 0) {
    errors.push("Slug is required");
  } else if (!/^[a-z0-9-]+$/.test(slug)) {
    errors.push(
      "Slug can only contain lowercase letters, numbers, and hyphens"
    );
  } else if (slug.length < 3) {
    errors.push("Slug must be at least 3 characters long");
  } else if (slug.length > 50) {
    errors.push("Slug must be less than 50 characters");
  }

  return errors;
};

export const validateMetaTitle = (metaTitle: string): string[] => {
  const errors: string[] = [];

  if (!metaTitle || metaTitle.trim().length === 0) {
    errors.push("Meta title is required");
  } else if (metaTitle.trim().length > 60) {
    errors.push("Meta title should be less than 60 characters for SEO");
  }

  return errors;
};

export const validateMetaDescription = (metaDescription: string): string[] => {
  const errors: string[] = [];

  if (!metaDescription || metaDescription.trim().length === 0) {
    errors.push("Meta description is required");
  } else if (metaDescription.trim().length < 120) {
    errors.push("Meta description should be at least 120 characters for SEO");
  } else if (metaDescription.trim().length > 160) {
    errors.push("Meta description should be less than 160 characters for SEO");
  }

  return errors;
};

export const validateSkills = (skills: string[]): string[] => {
  const errors: string[] = [];

  if (!skills || skills.length === 0) {
    errors.push("At least one skill is required");
  } else if (skills.length > 20) {
    errors.push("Maximum 20 skills allowed");
  }

  return errors;
};

export const validateInstructor = (instructor: any[]): string[] => {
  const errors: string[] = [];

  if (!instructor || instructor.length === 0) {
    errors.push("At least one instructor is required");
  }

  return errors;
};

export const validatePlans = (plans: any): string[] => {
  const errors: string[] = [];

  if (!plans || (!plans.essential && !plans.elite)) {
    errors.push("At least one pricing plan is required");
  }

  // Validate essential plan if present
  if (plans?.essential) {
    if (!plans.essential.title || plans.essential.title.trim().length === 0) {
      errors.push("Essential plan title is required");
    }
    if (!plans.essential.price || plans.essential.price <= 0) {
      errors.push("Essential plan price must be greater than 0");
    }
    if (!plans.essential.features || plans.essential.features.length === 0) {
      errors.push("Essential plan must have at least one feature");
    } else {
      // Validate each feature
      plans.essential.features.forEach((feature: any, index: number) => {
        if (!feature.title || feature.title.trim().length === 0) {
          errors.push(`Essential plan feature ${index + 1} title is required`);
        }
      });
    }
  }

  // Validate elite plan if present
  if (plans?.elite) {
    if (!plans.elite.title || plans.elite.title.trim().length === 0) {
      errors.push("Elite plan title is required");
    }
    if (!plans.elite.price || plans.elite.price <= 0) {
      errors.push("Elite plan price must be greater than 0");
    }
    if (!plans.elite.features || plans.elite.features.length === 0) {
      errors.push("Elite plan must have at least one feature");
    } else {
      // Validate each feature
      plans.elite.features.forEach((feature: any, index: number) => {
        if (!feature.title || feature.title.trim().length === 0) {
          errors.push(`Elite plan feature ${index + 1} title is required`);
        }
      });
    }
  }

  return errors;
};

// ===================
// Screen Validation Functions
// ===================

export const validateScreen1 = (
  data: CourseFormData
): ScreenValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];

  // Required fields
  const titleErrors = validateTitle(data.title);
  if (titleErrors.length > 0) {
    errors.push(...titleErrors);
    missingFields.push("title");
  }

  const descriptionErrors = validateDescription(data.description);
  if (descriptionErrors.length > 0) {
    errors.push(...descriptionErrors);
    missingFields.push("description");
  }

  const categoryErrors = validateCategory(data.category);
  if (categoryErrors.length > 0) {
    errors.push(...categoryErrors);
    missingFields.push("category");
  }

  // Required fields
  const shortDescriptionErrors = validateShortDescription(
    data.shortDescription
  );
  if (shortDescriptionErrors.length > 0) {
    errors.push(...shortDescriptionErrors);
    missingFields.push("shortDescription");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missingFields,
  };
};

export const validateScreen2 = (
  data: CourseFormData
): ScreenValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];

  // Required fields
  const whatYouWillLearnText = getTextFromHtml(data.whatYouWillLearn || '');
  if (!data.whatYouWillLearn || whatYouWillLearnText.length === 0) {
    errors.push("What you will learn is required");
    missingFields.push("whatYouWillLearn");
  } else if (whatYouWillLearnText.length < 25) {
    errors.push("What you will learn must be at least 25 characters");
    missingFields.push("whatYouWillLearn");
  }

  const skillsErrors = validateSkills(data.skills);
  if (skillsErrors.length > 0) {
    errors.push(...skillsErrors);
    missingFields.push("skills");
  }

  // Career paths validation
  if (!data.careerPaths || data.careerPaths.length === 0) {
    errors.push("At least one career path is required");
    missingFields.push("careerPaths");
  }

  // Skill level validation
  if (!data.skillLevel || data.skillLevel.trim().length === 0) {
    errors.push("Skill level is required");
    missingFields.push("skillLevel");
  }

  // Duration validation
  if (!data.duration || data.duration.trim().length === 0) {
    errors.push("Course duration is required");
    missingFields.push("duration");
  }

  // Who should join validation
  const whoShouldJoinText = getTextFromHtml(data.whoShouldJoin || '');
  if (!data.whoShouldJoin || whoShouldJoinText.length === 0) {
    errors.push("Who should join this course is required");
    missingFields.push("whoShouldJoin");
  } else if (whoShouldJoinText.length < 25) {
    errors.push("Who should join this course must be at least 25 characters");
    missingFields.push("whoShouldJoin");
  }

  // Prerequisites validation (optional)
  // No validation needed as prerequisites are optional

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missingFields,
  };
};

export const validateScreen3 = (
  data: CourseFormData
): ScreenValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];

  // Required fields
  if (!data.thumbnail || data.thumbnail.trim().length === 0) {
    errors.push("Course thumbnail is required");
    missingFields.push("thumbnail");
  } else if (data.thumbnail.startsWith("http")) {
    try {
      new URL(data.thumbnail);
    } catch {
      errors.push("Thumbnail must be a valid URL");
      missingFields.push("thumbnail");
    }
  }

  // Optional fields warnings
  if (!data.previewVideoUrl || data.previewVideoUrl.trim().length === 0) {
    warnings.push("Preview video is recommended for better course presentation");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missingFields,
  };
};

export const validateScreen4 = (
  data: CourseFormData
): ScreenValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];

  // Required fields
  if (!data.highlights || data.highlights.length === 0) {
    errors.push("At least one highlight is required");
    missingFields.push("highlights");
  } else {
    // Validate each highlight
    data.highlights.forEach((highlight, index) => {
      if (!highlight.title || highlight.title.trim().length === 0) {
        errors.push(`Highlight ${index + 1} title is required`);
        missingFields.push(`highlights.${index}.title`);
      } else if (highlight.title.length < 3) {
        errors.push(`Highlight ${index + 1} title must be at least 3 characters`);
        missingFields.push(`highlights.${index}.title`);
      }
      
      if (!highlight.description || highlight.description.trim().length === 0) {
        errors.push(`Highlight ${index + 1} description is required`);
        missingFields.push(`highlights.${index}.description`);
      } else if (highlight.description.length < 10) {
        errors.push(`Highlight ${index + 1} description must be at least 10 characters`);
        missingFields.push(`highlights.${index}.description`);
      }
    });
  }

  // Optional fields warnings
  if (!data.features || data.features.length === 0) {
    warnings.push("Course features are recommended to showcase additional benefits");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missingFields,
  };
};

export const validateScreen5 = (
  data: CourseFormData
): ScreenValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];

  const plansErrors = validatePlans(data.plans);
  if (plansErrors.length > 0) {
    errors.push(...plansErrors);
    missingFields.push("plans");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missingFields,
  };
};

export const validateScreen8 = (
  data: CourseFormData
): ScreenValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];

  const slugErrors = validateSlug(data.slug);
  if (slugErrors.length > 0) {
    errors.push(...slugErrors);
    missingFields.push("slug");
  }

  const metaTitleErrors = validateMetaTitle(data.metaTitle || "");
  if (metaTitleErrors.length > 0) {
    errors.push(...metaTitleErrors);
    missingFields.push("metaTitle");
  }

  const metaDescriptionErrors = validateMetaDescription(
    data.metaDescription || ""
  );
  if (metaDescriptionErrors.length > 0) {
    errors.push(...metaDescriptionErrors);
    missingFields.push("metaDescription");
  }

  // Keywords validation
  if (!data.keywords || !Array.isArray(data.keywords) || data.keywords.length === 0) {
    errors.push("At least one keyword is required");
    missingFields.push("keywords");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missingFields,
  };
};

// ===================
// Screen Validation Map
// ===================

export const SCREEN_VALIDATORS: Record<
  number,
  (data: CourseFormData) => ScreenValidationResult
> = {
  1: validateScreen1,
  2: validateScreen2,
  3: validateScreen3,
  4: validateScreen4,
  5: validateScreen5,
  6: () => ({ isValid: true, errors: [], warnings: [], missingFields: [] }), // Modules screen
  7: () => ({ isValid: true, errors: [], warnings: [], missingFields: [] }), // Testimonials screen
  8: validateScreen8,
  9: () => ({ isValid: true, errors: [], warnings: [], missingFields: [] }), // Review screen
};

// ===================
// Main Validation Functions
// ===================

export const validateScreen = (
  screen: number,
  data: CourseFormData
): ScreenValidationResult => {
  const validator = SCREEN_VALIDATORS[screen];
  if (!validator) {
    return {
      isValid: true,
      errors: [],
      warnings: [],
      missingFields: [],
    };
  }

  return validator(data);
};

export const validateAllScreens = (data: CourseFormData): ValidationResult => {
  const allErrors: Record<string, string[]> = {};
  const allWarnings: Record<string, string[]> = {};
  let isValid = true;

  Object.keys(SCREEN_VALIDATORS).forEach((screenNumber) => {
    const screen = parseInt(screenNumber);
    const result = validateScreen(screen, data);

    if (!result.isValid) {
      isValid = false;
      allErrors[`screen_${screen}`] = result.errors;
    }

    if (result.warnings.length > 0) {
      allWarnings[`screen_${screen}`] = result.warnings;
    }
  });

  return {
    isValid,
    errors: allErrors,
    warnings: allWarnings,
  };
};

export const getRequiredScreens = (): number[] => {
  return Object.keys(SCREEN_VALIDATORS)
    .map(Number)
    .filter((screen) => {
      const config = SCREEN_CONFIG[screen];
      return config && config.requiredFields.length > 0;
    });
};

// ===================
// Utility Functions
// ===================

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
};

export const sanitizeSlug = (input: string): string => {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

export const generateSlugFromTitle = (title: string): string => {
  return sanitizeSlug(title);
};

// ===================
// Form Data Validation
// ===================

export const validateFormData = (
  data: Partial<CourseFormData>
): ValidationResult => {
  const errors: Record<string, string[]> = {};
  const warnings: Record<string, string[]> = {};

  // Validate required fields
  if (!data.title) {
    errors.title = ["Title is required"];
  }

  if (!data.description) {
    errors.description = ["Description is required"];
  }

  if (!data.category) {
    errors.category = ["Category is required"];
  }

  if (!data.thumbnail) {
    errors.thumbnail = ["Thumbnail is required"];
  }

  // Validate data types
  if (data.skills && !Array.isArray(data.skills)) {
    errors.skills = ["Skills must be an array"];
  }

  if (data.instructor && !Array.isArray(data.instructor)) {
    errors.instructor = ["Instructor must be an array"];
  }

  if (data.keywords && !Array.isArray(data.keywords)) {
    errors.keywords = ["Keywords must be an array"];
  }

  if (data.tags && !Array.isArray(data.tags)) {
    errors.tags = ["Tags must be an array"];
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
};
