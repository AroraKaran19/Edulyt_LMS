// Course service for handling course-related API calls

import { Course, CourseModule, Content, CourseLesson, Plan } from "@/types/course";
import { Instructor } from "@/types/instructor";
import { CourseFormState } from "@/app/(pages)/admin/courses/manage-courses/create/hooks/useCourseForm";
import instructorService, { InstructorResponse } from "./instructorService";

// Types for API responses
export interface CourseCreationResponse {
  success: boolean;
  message: string;
  data?: Course;
  error?: string;
}

interface CourseListResponse {
  success: boolean;
  data?: {
    courses: Course[];
    pagination: {
      totalPages: number;
      total: number;
    };
  };
  message?: string;
  error?: string;
}

interface ValidationError {
  field: string;
  message: string;
  required: boolean;
}

interface ValidationSection {
  section: string;
  sectionTitle: string;
  errors: ValidationError[];
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  errorsBySection: ValidationSection[];
}

// Extended CourseFormState with additional properties that might exist during editing
interface ExtendedCourseFormState extends CourseFormState {
  _id?: string;
  id?: string;
}

// Form data types for modules and lessons with optional form-specific properties
interface FormDataModule extends CourseModule {
  id?: string;
}

interface FormDataLesson extends CourseLesson {
  id?: string;
  completed?: boolean;
  isForCollegeStudent?: boolean;
}

interface FormDataContent extends Content {
  description?: string;
}

// Feature interface for keyFeatures mapping
interface KeyFeature {
  title: string;
  description: string;
}

// Plan feature interface for form data
interface FormPlanFeature {
  title: string;
  provided: boolean;
}

// Instructor validation types
interface InstructorValidationItem {
  _id: string;
  name?: string;
  profileImage?: string;
  experience?: string;
  rating?: number;
  totalStudents?: number;
  totalCourses?: number;
  bio?: string;
  currentPosition?: string;
  currentCompany?: string;
  previousExperience?: string[];
  education?: string[];
  linkedinUrl?: string;
}

// Module and lesson form data types for validation
interface ModuleFormData {
  title?: string;
  lessons?: LessonFormData[];
}

interface LessonFormData {
  title?: string;
}

// Draft response interface
interface DraftSaveResponse {
  success: boolean;
  message: string;
  data?: {
    course: ExtendedCourseFormState;
    courseId: string;
    slug: string;
  };
  error?: string;
}

class CourseService {
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  /**
   * Create a new course
   * @param courseData - Course data to create
   * @returns Promise with creation result
   */
  async createCourse(formData: CourseFormState): Promise<CourseCreationResponse> {
    try {
      // Transform form data to backend format (now async)
      const courseData = await this.transformFormDataToBackend(formData, false);

      // Filter out undefined values before sending
      const filteredCourseData = Object.fromEntries(
        Object.entries(courseData as Record<string, unknown>).filter(([, value]) => value !== undefined)
      );

      const response = await fetch(`${this.baseUrl}/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filteredCourseData),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: "Failed to create course",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get all courses (admin)
   * @param page - Page number
   * @param limit - Items per page
   * @param search - Search term
   * @param filters - Filter array
   * @returns Promise with courses list
   */
  async getAllCoursesAdmin(
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters?: string[]
  ): Promise<CourseListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) {
        params.append("search", search);
      }

      if (filters && filters.length > 0) {
        filters.forEach((filter) => params.append("filter", filter));
      }

      const response = await fetch(`${this.baseUrl}/admin/courses?${params}`);
      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: "Failed to fetch courses",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get course by ID (admin)
   * @param courseId - Course ID
   * @returns Promise with course data
   */
  async getCourseById(courseId: string): Promise<CourseCreationResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/admin/courses/${courseId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();
      
      // Check if the request was successful
      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Failed to fetch course",
          error: result.error || "Unknown error",
        };
      }
      
      return {
        success: result.success || true,
        message: result.message || "Course fetched successfully",
        data: result.data as Course  // Backend returns course in 'data' field
      };
    } catch (error) {
      console.error("Error fetching course:", error);
      return {
        success: false,
        message: "Failed to fetch course",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update existing course
   * @param courseId - Course ID
   * @param formData - Course form data (raw form state)
   * @returns Promise with update result
   */
  async updateCourse(
    courseId: string,
    formData: CourseFormState
  ): Promise<CourseCreationResponse> {
    try {
      console.log("Updating course with form data:", {
        courseId,
        title: formData.title,
        description: formData.description,
        hasTitle: !!formData.title,
        hasDescription: !!formData.description,
        instructorIds: formData.instructor,
      });

      // Transform form data to backend format for updates
      const courseData = await this.transformFormDataToBackend(formData, true) as Record<string, unknown>;
      
      console.log("Transformed course data being sent to backend:", {
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        transformedDataKeys: Object.keys(courseData)
      });

      // Ensure the course ID is preserved
      courseData._id = courseId;

      console.log("Transformed update data:", {
        _id: courseData._id,
        title: courseData.title,
        createdBy: courseData.createdBy,
        language: courseData.language,
      });

      const response = await fetch(
        `${this.baseUrl}/admin/courses/${courseId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(courseData),
        }
      );

      const result = await response.json();
      console.log("Course update response:", result);
      return result;
    } catch (error) {
      console.error("Error updating course:", error);
      return {
        success: false,
        message: "Failed to update course",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update course status
   * @param courseId - Course ID
   * @param isActive - New status
   * @returns Promise with update result
   */
  async updateCourseStatus(
    courseId: string,
    isActive: boolean
  ): Promise<CourseCreationResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/admin/courses/${courseId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive }),
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error updating course status:", error);
      return {
        success: false,
        message: "Failed to update course status",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Delete course by ID (Admin only)
   * @param courseId - Course ID
   * @returns Promise with deletion result
   */
  async deleteCourse(courseId: string): Promise<CourseCreationResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/admin/courses/${courseId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error deleting course:", error);
      return {
        success: false,
        message: "Failed to delete course",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Transform frontend form data to backend Course schema format
   * @param formData - Frontend form state
   * @param isUpdate - Whether this is an update operation (preserves empty fields)
   * @returns Promise with transformed data for backend
   */
  async transformFormDataToBackend(
    formData: CourseFormState,
    isUpdate: boolean = false
  ): Promise<Record<string, unknown>> {
    console.log("=== TRANSFORM DEBUG ===");
    console.log("Input form data:", {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      isUpdate: isUpdate,
      fullKeys: Object.keys(formData)
    });
    console.log("=== END TRANSFORM DEBUG ===");
    // Generate unique ID and slug
    const generateId = (): string => {
      return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    };

    const generateSlug = (title: string): string => {
      return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-"); // Replace multiple hyphens with single
    };

    // For updates, preserve existing ID and slug if available
    const extendedFormData = formData as ExtendedCourseFormState;
    const courseId = isUpdate
      ? extendedFormData._id || extendedFormData.id || generateId()
      : generateId();
    const slug = isUpdate
      ? extendedFormData.slug || generateSlug(formData.title || "")
      : generateSlug(formData.title || "");

    // Transform plans to correct format
    const transformPlans = (): Record<string, Plan> => {
      const plans: Record<string, Plan> = {};

      if (formData.plans?.elite) {
        const elitePlan = formData.plans.elite;
        plans.elite = {
          _id: elitePlan._id || generateId(),
          title: elitePlan.title || "Elite Plan",
          type: "elite" as const,
          price: elitePlan.price || 0,
          features: (elitePlan.features || []).map(
            (feature: FormPlanFeature) => ({
              title: feature.title || "",
              provided: feature.provided !== undefined ? feature.provided : true,
            })
          ),
          billingPeriod: elitePlan.billingPeriod || "lifetime",
          isActive:
            elitePlan.isActive !== undefined ? elitePlan.isActive : true,
          createdAt: elitePlan.createdAt || new Date(),
          updatedAt: new Date(),
        };
      }

      if (formData.plans?.essential) {
        const essentialPlan = formData.plans.essential;
        plans.essential = {
          _id: essentialPlan._id || generateId(),
          title: essentialPlan.title || "Essential Plan",
          type: "essential" as const,
          price: essentialPlan.price || 0,
          features: (essentialPlan.features || []).map(
            (feature: FormPlanFeature) => ({
              title: feature.title || "",
              provided: feature.provided !== undefined ? feature.provided : true,
            })
          ),
          billingPeriod: essentialPlan.billingPeriod || "lifetime",
          isActive:
            essentialPlan.isActive !== undefined
              ? essentialPlan.isActive
              : true,
          createdAt: essentialPlan.createdAt || new Date(),
          updatedAt: new Date(),
        };
      }

      return plans;
    };

    // Transform modules to correct format
    const transformModules = (modules: FormDataModule[]): CourseModule[] => {
      return (modules || []).map((module) => ({
        _id: module.id || generateId(),
        title: module.title || "",
        thumbnailUrl: module.thumbnailUrl,
        description: module.description || "",
        lessons: (module.lessons || []).map(
          (lesson: FormDataLesson): CourseLesson => ({
            _id: lesson.id || generateId(),
            title: lesson.title || "",
            description: lesson.description || "",
            content: (lesson.content || []).map(
              (contentItem: FormDataContent): Content => ({
                _id: contentItem._id || generateId(),
                title: contentItem.title || "",
                description: contentItem.description || "",
                content: contentItem.content || null,
                type: contentItem.type || "video",
                isCompleted: contentItem.isCompleted || false,
                isLocked: contentItem.isLocked || false,
                createdAt: contentItem.createdAt || new Date(),
                updatedAt: new Date(),
              })
            ),
            isCompleted: lesson.completed || false,
            isLocked: lesson.isForCollegeStudent || false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        ),
        isCompleted: false,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    };

    // For updates, ensure required fields have valid values (don't send empty strings)
    const getFieldValue = (
      value: unknown,
      defaultValue: unknown = "",
      isRequired: boolean = false
    ): unknown => {
      // Handle string values with trimming
      const trimmedValue = typeof value === 'string' && value.trim ? value.trim() : value;

      if (isUpdate) {
        // For updates of required fields, never send empty values - use existing or default
        if (isRequired && !trimmedValue && !value) {
          return defaultValue || undefined;
        }
        // For optional fields in updates, undefined means "don't change"
        if (!trimmedValue && !value) {
          return undefined;
        }
      }

      // For create operations or when we have a value, handle empty strings properly
      return trimmedValue || value || defaultValue;
    };

    // Direct mapping to Course schema format - EXACTLY matching @course.ts
    const transformedData: Record<string, unknown> = {
      // Required fields per @course.ts
      _id: courseId,
      title: getFieldValue(formData.title, "", true) || "",
      description: getFieldValue(formData.description, "", true) || "",
      category: getFieldValue(formData.category, "", true) || "",
      thumbnail: getFieldValue(formData.thumbnail, "", true) || "",
      previewVideoUrl: getFieldValue(formData.previewVideoUrl, "", true) || "",
      enrolledCount: formData.enrolledCount || 0,
      totalRatings: formData.totalRatings || 0,
      totalLectures: formData.totalLectures || 0,
      whatYouWillLearn:
        getFieldValue(formData.whatYouWillLearn, "", true) || "",
      skills: formData.skills || [],
      keyFeatures: (formData.keyFeatures || []).map((feature: KeyFeature) => ({
        title: feature.title || "",
        description: feature.description || "",
      })),
      careerPaths: formData.careerPaths || [],
      skillLevel: getFieldValue(formData.skillLevel, "Beginner", true),
      whoShouldJoin: getFieldValue(formData.whoShouldJoin, "", true) || "",
      duration: getFieldValue(formData.duration, "1 month"),
      modules: transformModules(formData.modules),
      instructor: await this.fetchAndTransformInstructors(
        formData.instructor || []
      ),
      plans: transformPlans(),
      reviews: formData.reviews || [],
      faqs: formData.faqs || [],
      isActive: formData.isActive !== undefined ? formData.isActive : true,
      createdAt: formData.createdAt || new Date(),
      updatedAt: new Date(),
      createdBy: (formData.createdBy && formData.createdBy.trim()) || "admin",
      audience: formData.audience || "college-students",
      slug: getFieldValue(formData.slug, slug),
      language: (formData.language && formData.language.trim()) || "English",

      // Optional fields per @course.ts
      shortDescription: formData.shortDescription || undefined,
      subcategory: formData.subcategory || undefined,
      isFeatured: formData.isFeatured || undefined,
      isCertified: formData.isCertified || undefined,
      features: formData.features || undefined,
      prerequisites: formData.prerequisites || undefined,
      featuredReviews: formData.featuredReviews || undefined,
      tags: formData.tags || undefined,
      metaTitle: formData.metaTitle || undefined,
      metaDescription: formData.metaDescription || undefined,
      keywords: formData.keywords || undefined,
      scholarship: formData.scholarship || undefined,
      scholarshipDescription: formData.scholarshipDescription || undefined,
      scholarshipQuiz: undefined, // Not implemented yet

      // Discount - ensure correct Discount object format
      discount: (() => {
        // Handle discount field transformation carefully
        if (!formData.discount) {
          return undefined;
        }

        // If it's already a proper Discount object
        if (
          typeof formData.discount === "object" &&
          formData.discount.discount &&
          formData.discount.value
        ) {
          return {
            discount: formData.discount.discount,
            value: Number(formData.discount.value),
            startDate: formData.discount.startDate,
            endDate: formData.discount.endDate,
            isActive: Boolean(formData.discount.isActive ?? true),
          };
        }

        // If it's a number (legacy support)
        if (typeof formData.discount === "number") {
          if (formData.discount > 0 && formData.discount <= 100) {
            return {
              discount: "percentage",
              value: formData.discount,
              isActive: true,
            };
          } else {
            // For 0 or invalid numbers, return undefined
            return undefined;
          }
        }

        // For any other invalid type, return undefined
        return undefined;
      })(),
    };

    // Filter out undefined values for updates
    if (isUpdate) {
      const filtered: Record<string, unknown> = {};
      Object.keys(transformedData).forEach((key) => {
        if (transformedData[key] !== undefined) {
          filtered[key] = transformedData[key];
        }
      });
      return filtered;
    }

    return transformedData;
  }

  /**
   * Transform instructor data - handles both IDs and full objects
   * @param instructorData - Array of instructor IDs or instructor objects
   * @returns Promise with transformed instructor objects
   */
  private async fetchAndTransformInstructors(
    instructorData: (string | InstructorValidationItem)[]
  ): Promise<Instructor[]> {
    const instructors: Instructor[] = [];

    console.log("fetchAndTransformInstructors called with:", {
      instructorData,
      types: instructorData.map((item) => typeof item),
      hasObjects: instructorData.some(item => typeof item === 'object' && item !== null && '_id' in item),
    });

    for (const item of instructorData) {
      try {
        // If it's already a full instructor object, use it directly
        if (typeof item === "object" && item && '_id' in item && 'name' in item) {
          console.log(`✅ Using existing instructor object: ${item.name}`);
          
          // Transform to ensure it matches the expected schema format
          const transformedInstructor: Instructor = {
            _id: item._id,
            name: item.name || "",
            profileImage: item.profileImage || "",
            experience: item.experience || "0 years",
            rating: item.rating || 0,
            totalStudents: item.totalStudents || 0,
            totalCourses: item.totalCourses || 0,
            bio: item.bio || "",
            currentPosition: item.currentPosition || "",
            currentCompany: item.currentCompany || "",
            previousExperience: item.previousExperience || [],
            education: item.education || [],
            linkedinUrl: item.linkedinUrl || "https://linkedin.com",
          };

          instructors.push(transformedInstructor);
          continue;
        }

        // Otherwise, treat it as an ID and fetch from API
        const idString = typeof item === "string" ? item : String(item);

        console.log(`🔄 Fetching instructor by ID: ${idString}`);

        const response: InstructorResponse =
          await instructorService.getInstructorById(idString);

        if (response.success) {
          // Handle different response data structures from backend
          const instructor = response.data;

          if (instructor && instructor._id) {
            // Transform to embedded instructor format expected by course schema
            const transformedInstructor: Instructor = {
              _id: instructor._id || idString,
              name: instructor.name || "",
              profileImage: instructor.profileImage || "",
              experience: instructor.experience || "0 years",
              rating: instructor.rating || 0,
              totalStudents: instructor.totalStudents || 0,
              totalCourses: instructor.totalCourses || 0,
              bio: instructor.bio || "",
              currentPosition: instructor.currentPosition || "",
              currentCompany: instructor.currentCompany || "",
              previousExperience: instructor.previousExperience || [],
              education: instructor.education || [],
              linkedinUrl: instructor.linkedinUrl || "https://linkedin.com",
            };

            instructors.push(transformedInstructor);
            console.log(
              `✅ Successfully fetched instructor: ${instructor.name}`
            );
          } else {
            console.error(
              `Failed to extract instructor data from response for ${idString}:`,
              response
            );
            // Add a minimal instructor object with just required fields
            instructors.push({
              _id: idString,
              name: "Unknown Instructor",
              experience: "0 years",
              rating: 0,
              totalStudents: 0,
              totalCourses: 0,
              bio: "Instructor information not available",
              currentPosition: "",
              currentCompany: "",
              linkedinUrl: "https://linkedin.com",
            });
          }
        } else {
          console.error(
            `Failed to fetch instructor ${idString}:`,
            response.message
          );
          // Add a minimal instructor object with just required fields
          instructors.push({
            _id: idString,
            name: "Unknown Instructor",
            experience: "0 years",
            rating: 0,
            totalStudents: 0,
            totalCourses: 0,
            bio: "Instructor information not available",
            currentPosition: "",
            currentCompany: "",
            linkedinUrl: "https://linkedin.com",
          });
        }
      } catch (error) {
        const idString = typeof item === "string" ? item : String(item);
        console.error(`Error processing instructor ${idString}:`, error);
        // Add a fallback instructor object
        instructors.push({
          _id: idString,
          name: "Unknown Instructor",
          experience: "0 years",
          rating: 0,
          totalStudents: 0,
          totalCourses: 0,
          bio: "Instructor information not available",
          currentPosition: "",
          currentCompany: "",
          linkedinUrl: "https://linkedin.com",
        });
      }
    }

    return instructors;
  }

  /**
   * Validate course data before submission
   * @param formData - Course form data
   * @returns Validation result with categorized errors
   */
  validateCourseData(formData: CourseFormState): ValidationResult {
    const errors: string[] = [];
    const errorsBySection: ValidationSection[] = [];

    // Debug logging
    console.log("validateCourseData called with formData:", {
      title: formData.title,
      description: formData.description,
      titleType: typeof formData.title,
      descriptionType: typeof formData.description,
      titleTrimmed: formData.title?.trim(),
      descriptionTrimmed: formData.description?.trim(),
    });

    // Helper function to add error to section
    const addSectionError = (
      section: string,
      sectionTitle: string,
      field: string,
      message: string,
      required: boolean = true
    ) => {
      errors.push(message);

      let sectionErrors = errorsBySection.find((s) => s.section === section);
      if (!sectionErrors) {
        sectionErrors = { section, sectionTitle, errors: [] };
        errorsBySection.push(sectionErrors);
      }

      sectionErrors.errors.push({ field, message, required });
    };

    // Ensure formData is an object and has the expected structure
    if (!formData || typeof formData !== "object") {
      console.error("Invalid formData passed to validateCourseData:", formData);
      addSectionError(
        "basic",
        "Basic Information",
        "general",
        "Invalid form data structure"
      );
      return { valid: false, errors, errorsBySection };
    }

    // === BASIC INFORMATION VALIDATION ===
    if (!formData.title?.trim()) {
      console.log("Title validation failed - value:", formData.title);
      addSectionError(
        "basic",
        "Basic Information",
        "title",
        "Course title is required"
      );
    } else if (formData.title.trim().length < 5) {
      console.log(
        "Title validation failed - too short:",
        formData.title.trim().length
      );
      addSectionError(
        "basic",
        "Basic Information",
        "title",
        "Course title must be at least 5 characters long"
      );
    }

    if (!formData.description?.trim()) {
      console.log(
        "Description validation failed - value:",
        formData.description
      );
      addSectionError(
        "basic",
        "Basic Information",
        "description",
        "Course description is required"
      );
    } else if (formData.description.trim().length < 50) {
      console.log(
        "Description validation failed - too short:",
        formData.description.trim().length
      );
      addSectionError(
        "basic",
        "Basic Information",
        "description",
        "Course description must be at least 50 characters long"
      );
    }

    if (!formData.category?.trim()) {
      addSectionError(
        "basic",
        "Basic Information",
        "category",
        "Course category is required"
      );
    }

    if (!formData.thumbnail?.trim()) {
      addSectionError(
        "basic",
        "Basic Information",
        "thumbnail",
        "Course thumbnail image is required"
      );
    }

    if (!formData.skillLevel?.trim()) {
      addSectionError(
        "basic",
        "Basic Information",
        "skillLevel",
        "Skill level selection is required"
      );
    } else if (
      !["Beginner", "Intermediate", "Advanced"].includes(formData.skillLevel)
    ) {
      addSectionError(
        "basic",
        "Basic Information",
        "skillLevel",
        "Invalid skill level selected"
      );
    }

    if (!formData.audience?.trim()) {
      addSectionError(
        "basic",
        "Basic Information",
        "audience",
        "Target audience selection is required"
      );
    } else if (
      !["college-students", "professionals"].includes(formData.audience)
    ) {
      addSectionError(
        "basic",
        "Basic Information",
        "audience",
        "Invalid target audience selected"
      );
    }

    // Optional field warnings
    if (
      !formData.shortDescription ||
      (typeof formData.shortDescription === "string" &&
        !formData.shortDescription.trim())
    ) {
      addSectionError(
        "basic",
        "Basic Information",
        "shortDescription",
        "Short description recommended for better course previews",
        false
      );
    }

    if (
      !formData.duration ||
      (typeof formData.duration === "string" && !formData.duration.trim())
    ) {
      addSectionError(
        "basic",
        "Basic Information",
        "duration",
        "Course duration recommended for student planning",
        false
      );
    }

    // === LEARNING OUTCOMES VALIDATION ===
    if (
      !formData.whatYouWillLearn ||
      (typeof formData.whatYouWillLearn === "string" &&
        !formData.whatYouWillLearn.trim())
    ) {
      addSectionError(
        "learning",
        "Learning Outcomes",
        "whatYouWillLearn",
        "What students will learn is required"
      );
    } else if (
      typeof formData.whatYouWillLearn === "string" &&
      formData.whatYouWillLearn.trim().length < 20
    ) {
      addSectionError(
        "learning",
        "Learning Outcomes",
        "whatYouWillLearn",
        "Learning outcomes description should be more detailed (at least 20 characters)"
      );
    }

    if (
      !formData.whoShouldJoin ||
      (typeof formData.whoShouldJoin === "string" &&
        !formData.whoShouldJoin.trim())
    ) {
      addSectionError(
        "learning",
        "Learning Outcomes",
        "whoShouldJoin",
        "Target learner description is required"
      );
    }

    // Optional but recommended
    if (!formData.skills || formData.skills.length === 0) {
      addSectionError(
        "learning",
        "Learning Outcomes",
        "skills",
        "Adding skills helps students understand what they'll develop",
        false
      );
    }

    if (!formData.keyFeatures || formData.keyFeatures.length === 0) {
      addSectionError(
        "learning",
        "Learning Outcomes",
        "keyFeatures",
        "Key features help highlight course value",
        false
      );
    }

    // === INSTRUCTOR VALIDATION ===
    if (!formData.instructor || formData.instructor.length === 0) {
      addSectionError(
        "instructors",
        "Instructors",
        "instructor",
        "At least one instructor is required"
      );
    } else {
      // Validate instructor IDs and filter out any invalid entries
      const validInstructorIds: string[] = [];
      formData.instructor.forEach((instructorItem: Instructor | string, index: number) => {
        if (typeof instructorItem === "string" && instructorItem.trim()) {
          validInstructorIds.push(instructorItem);
        } else if (
          typeof instructorItem === "object" &&
          instructorItem &&
          instructorItem._id
        ) {
          // Handle case where object was stored instead of ID
          console.warn(
            `Converting instructor object to ID at index ${index}:`,
            instructorItem
          );
          validInstructorIds.push(instructorItem._id);
        } else {
          console.error(`Invalid instructor at index ${index}:`, instructorItem);
          addSectionError(
            "instructors",
            "Instructors",
            "instructor",
            `Instructor ${index + 1} selection is invalid`
          );
        }
      });

      // Update the formData with cleaned instructor IDs - but we need to cast to bypass type checking
      (formData as ExtendedCourseFormState).instructor = validInstructorIds as unknown as Instructor[];
    }

    // === CONTENT VALIDATION ===
    if (!formData.modules || formData.modules.length === 0) {
      addSectionError(
        "content",
        "Course Content",
        "modules",
        "At least one course module is required"
      );
    } else {
      // Validate each module
      formData.modules.forEach((module: ModuleFormData, moduleIndex: number) => {
        if (
          !module.title ||
          (typeof module.title === "string" && !module.title.trim())
        ) {
          addSectionError(
            "content",
            "Course Content",
            "modules",
            `Module ${moduleIndex + 1} title is required`
          );
        }

        if (!module.lessons || module.lessons.length === 0) {
          addSectionError(
            "content",
            "Course Content",
            "modules",
            `Module ${moduleIndex + 1} must have at least one lesson`
          );
        } else {
          // Validate lessons
          module.lessons.forEach((lesson: LessonFormData, lessonIndex: number) => {
            if (
              !lesson.title ||
              (typeof lesson.title === "string" && !lesson.title.trim())
            ) {
              addSectionError(
                "content",
                "Course Content",
                "modules",
                `Module ${moduleIndex + 1}, Lesson ${
                  lessonIndex + 1
                } title is required`
              );
            }
          });
        }
      });
    }

    // === PRICING VALIDATION ===
    const hasElitePlan = formData.plans?.elite?.title?.trim();
    const hasEssentialPlan = formData.plans?.essential?.title?.trim();

    if (!hasElitePlan && !hasEssentialPlan) {
      addSectionError(
        "pricing",
        "Pricing Plans",
        "plans",
        "At least one pricing plan (Elite or Essential) is required"
      );
    }

    // Validate elite plan if it exists
    if (formData.plans?.elite) {
      const elitePlan = formData.plans.elite;

      if (!elitePlan.title?.trim()) {
        addSectionError(
          "pricing",
          "Pricing Plans",
          "plans",
          "Elite plan title is required"
        );
      }

      if (typeof elitePlan.price !== "number" || elitePlan.price < 0) {
        addSectionError(
          "pricing",
          "Pricing Plans",
          "plans",
          "Elite plan price must be a valid number (0 or greater)"
        );
      }

      if (!elitePlan.features || elitePlan.features.length === 0) {
        addSectionError(
          "pricing",
          "Pricing Plans",
          "plans",
          "Elite plan should include at least one feature",
          false
        );
      }
    }

    // Validate essential plan if it exists
    if (formData.plans?.essential) {
      const essentialPlan = formData.plans.essential;

      if (!essentialPlan.title?.trim()) {
        addSectionError(
          "pricing",
          "Pricing Plans",
          "plans",
          "Essential plan title is required"
        );
      }

      if (typeof essentialPlan.price !== "number" || essentialPlan.price < 0) {
        addSectionError(
          "pricing",
          "Pricing Plans",
          "plans",
          "Essential plan price must be a valid number (0 or greater)"
        );
      }

      if (!essentialPlan.features || essentialPlan.features.length === 0) {
        addSectionError(
          "pricing",
          "Pricing Plans",
          "plans",
          "Essential plan should include at least one feature",
          false
        );
      }
    }

    // === SEO VALIDATION (Warnings) ===
    if (
      !formData.metaTitle ||
      (typeof formData.metaTitle === "string" && !formData.metaTitle.trim())
    ) {
      addSectionError(
        "seo",
        "SEO Settings",
        "metaTitle",
        "Meta title recommended for better search visibility",
        false
      );
    }

    if (
      !formData.metaDescription ||
      (typeof formData.metaDescription === "string" &&
        !formData.metaDescription.trim())
    ) {
      addSectionError(
        "seo",
        "SEO Settings",
        "metaDescription",
        "Meta description recommended for search results",
        false
      );
    }

    if (
      !formData.slug ||
      (typeof formData.slug === "string" && !formData.slug.trim())
    ) {
      addSectionError(
        "seo",
        "SEO Settings",
        "slug",
        "URL slug will be auto-generated from title",
        false
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      errorsBySection,
    };
  }

  /**
   * Save course as draft
   * @param formData - Course form data
   * @returns Promise with save result
   */
  async saveDraft(formData: CourseFormState): Promise<DraftSaveResponse> {
    try {
      // For now, just save to localStorage
      // In future, this could be an API call to save draft to backend
      const draftKey = `course-draft-${Date.now()}`;
      localStorage.setItem(draftKey, JSON.stringify(formData));

      return {
        success: true,
        message: "Draft saved successfully",
        data: {
          course: formData,
          courseId: draftKey,
          slug: formData.slug || "",
        },
      };
    } catch (error) {
      console.error("Error saving draft:", error);
      return {
        success: false,
        message: "Failed to save draft",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get all drafts
   * @returns Array of draft courses
   */
  getAllDrafts(): ExtendedCourseFormState[] {
    const drafts: ExtendedCourseFormState[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("course-draft-")) {
        try {
          const draft = JSON.parse(localStorage.getItem(key) || "{}");
          drafts.push({ ...draft, draftId: key });
        } catch (error) {
          console.warn("Failed to parse draft:", error);
        }
      }
    }
    return drafts.sort(
      (a, b) =>
        new Date(b.updatedAt || 0).getTime() -
        new Date(a.updatedAt || 0).getTime()
    );
  }

  /**
   * Delete draft
   * @param draftId - Draft ID
   */
  deleteDraft(draftId: string): void {
    localStorage.removeItem(draftId);
  }
}

// Export singleton instance
export const courseService = new CourseService();
export default courseService;
