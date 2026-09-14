import { useState, useCallback } from "react";
import apiClient from "@/configs/apiConfig";
import { Course, CourseModule, CourseLesson, Content } from "@/types";
import type { Brand } from "@/constants/brands";

// ===================
// Filter Interfaces
// ===================

export interface CourseFilters {
  page?: number;
  limit?: number;
  search?: string;
  searchTitleOnly?: boolean;
  categories?: string;
  instructors?: string;
  audience?: "college-students" | "professionals";
  brand?: Brand;
  isActive?: boolean;
  skillLevel?: string;
  isFeatured?: boolean;
  isCertified?: boolean;
  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "title"
    | "averageRating"
    | "totalEnrollments";
  sortOrder?: "asc" | "desc";
}

export interface CourseResponse {
  courses: Course[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminCourseOption {
  _id: string;
  title: string;
  /** Included for admin pickers (trials, gifts, collaborations) without loading full course documents */
  plans?: Course["plans"];
}

export interface AdminCourseOptionsResponse {
  courses: AdminCourseOption[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SingleCourseResponse {
  course: Course;
}

// ===================
// Course Creation/Update Interfaces
// ===================

export interface CreateCourseData {
  title: string;
  description: string;
  shortDescription: string;
  category: string[];
  thumbnail: string;
  previewVideoUrl?: string;
  whatYouWillLearn: string;
  skills: string[];
  highlights: {
    title: string;
    description: string;
  }[];
  features?: string[];
  careerPaths: string[];
  skillLevel: string;
  whoShouldJoin: string;
  prerequisites?: string[];
  duration: string;
  instructor: string[];
  plans: {
    elite?: {
      title: string;
      type: "elite";
      price: number;
      features: {
        title: string;
        provided: boolean;
      }[];
      discount?: {
        discount: "percentage" | "fixed";
        startDate?: Date;
        endDate?: Date;
        value: number;
        isActive?: boolean;
      };
      isPopular?: boolean;
      isActive?: boolean;
    };
    essential?: {
      title: string;
      type: "essential";
      price: number;
      features: {
        title: string;
        provided: boolean;
      }[];
      discount?: {
        discount: "percentage" | "fixed";
        startDate?: Date;
        endDate?: Date;
        value: number;
        isActive?: boolean;
      };
      isPopular?: boolean;
      isActive?: boolean;
    };
  };
  discount?: {
    discount: "percentage" | "fixed";
    startTime?: string;
    endTime?: string;
    value: number;
    isActive?: boolean;
  };
  reviews: string[];
  testimonials: string[];
  faqs: string[];
  isActive: boolean;
  tags?: string[];
  audience: "college-students" | "professionals";
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  scholarship?: boolean;
  scholarshipDescription?: string;
  scholarshipRef?: string;
  language: string;
  curriculum?: string;
  brochure?: string;
}

export interface UpdateCourseData extends Partial<CreateCourseData> {
  _id: string;
}

// ===================
// Module Management Interfaces
// ===================

export interface CreateModuleData {
  courseId: string;
  title: string;
  thumbnailUrl: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateModuleData extends Partial<CreateModuleData> {
  _id: string;
}

// ===================
// Lesson Management Interfaces
// ===================

export interface CreateLessonData {
  moduleId: string;
  title: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateLessonData extends Partial<CreateLessonData> {
  _id: string;
}

// ===================
// Content Management Interfaces
// ===================

export interface CreateContentData {
  lessonId: string;
  title: string;
  description?: string;
  type: "video" | "quiz" | "document";
  // Video specific
  sources?: {
    quality: "1080p" | "720p" | "480p" | "360p";
    videoUrl: string;
  }[];
  thumbnailUrl?: string;
  duration?: number;
  // Quiz specific
  questions?: {
    question: string;
    options: string[];
    correctAnswer: string[];
    timeLimit?: number;
  }[];
  passingScore?: number;
  maxAttempts?: number;
  // Document specific
  documentUrl?: string;
  // Reading materials
  readingMaterials?: {
    content: "pdf" | "docx";
    estimatedReadTime: number;
    downloadUrl?: string;
  }[];
}

export interface UpdateContentData extends Partial<CreateContentData> {
  _id: string;
}

// ===================
// Main Hook
// ===================

export const useCourse = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleRequest = useCallback(
    async <T>(
      requestFn: () => Promise<T>,
      errorMessage: string
    ): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await requestFn();
        return response;
      } catch (err: any) {
        const msg =
          err?.response?.data?.error?.message || err?.message || errorMessage;
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ===================
  // Public Course Methods
  // ===================

  const getCourses = useCallback(
    async (filters: CourseFilters = {}): Promise<CourseResponse | null> => {
      return handleRequest(async () => {
        const params = new URLSearchParams();
        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.search) params.append("search", filters.search);
        if (filters.categories) params.append("categories", filters.categories);
        if (filters.audience) params.append("audience", filters.audience);
        if (filters.skillLevel) params.append("skillLevel", filters.skillLevel);
        if (filters.isFeatured !== undefined)
          params.append("isFeatured", filters.isFeatured.toString());
        if (filters.isCertified !== undefined)
          params.append("isCertified", filters.isCertified.toString());
        if (filters.sortBy) params.append("sortBy", filters.sortBy);
        if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

        const response = await apiClient.get(`/courses?${params.toString()}`);
        return response.data.data;
      }, "Failed to fetch courses");
    },
    [handleRequest]
  );

  const getFeaturedCourses =
    useCallback(async (): Promise<CourseResponse | null> => {
      return handleRequest(async () => {
        const response = await apiClient.get("/courses/featured");
        return response.data.data;
      }, "Failed to fetch featured courses");
    }, [handleRequest]);

  const getCourseById = useCallback(
    async (id: string): Promise<Course | null> => {
      return handleRequest(async () => {
        const response = await apiClient.get(`/courses/id/${id}`);
        return response.data.data;
      }, "Failed to fetch course");
    },
    [handleRequest]
  );

  const getCourseBySlug = useCallback(
    async (slug: string): Promise<Course | null> => {
      return handleRequest(async () => {
        const response = await apiClient.get(`/courses/slug/${slug}`);
        return response.data.data;
      }, "Failed to fetch course");
    },
    [handleRequest]
  );

  const getCoursesByCategory = useCallback(
    async (
      category: string,
      filters: Omit<CourseFilters, "categories"> = {}
    ): Promise<CourseResponse | null> => {
      return handleRequest(async () => {
        const params = new URLSearchParams();
        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.search) params.append("search", filters.search);
        if (filters.audience) params.append("audience", filters.audience);
        if (filters.skillLevel) params.append("skillLevel", filters.skillLevel);
        if (filters.isFeatured !== undefined)
          params.append("isFeatured", filters.isFeatured.toString());
        if (filters.isCertified !== undefined)
          params.append("isCertified", filters.isCertified.toString());
        if (filters.sortBy) params.append("sortBy", filters.sortBy);
        if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

        const response = await apiClient.get(
          `/courses/category/${category}?${params.toString()}`
        );
        return response.data.data;
      }, "Failed to fetch courses by category");
    },
    [handleRequest]
  );

  const getCoursesByAudience = useCallback(
    async (
      audience: "college-students" | "professionals",
      filters: Omit<CourseFilters, "audience"> = {}
    ): Promise<CourseResponse | null> => {
      return handleRequest(async () => {
        const params = new URLSearchParams();
        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.search) params.append("search", filters.search);
        if (filters.categories) params.append("categories", filters.categories);
        if (filters.skillLevel) params.append("skillLevel", filters.skillLevel);
        if (filters.isFeatured !== undefined)
          params.append("isFeatured", filters.isFeatured.toString());
        if (filters.isCertified !== undefined)
          params.append("isCertified", filters.isCertified.toString());
        if (filters.sortBy) params.append("sortBy", filters.sortBy);
        if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

        const response = await apiClient.get(
          `/courses/audience/${audience}?${params.toString()}`
        );
        return response.data.data;
      }, "Failed to fetch courses by audience");
    },
    [handleRequest]
  );

  // ===================
  // Admin Course Methods
  // ===================

  const getAdminCourses = useCallback(
    async (filters: CourseFilters = {}): Promise<CourseResponse | null> => {
      return handleRequest(async () => {
        const params = new URLSearchParams();
        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.search) params.append("search", filters.search);
        if (filters.searchTitleOnly) params.append("searchTitleOnly", "true");
        if (filters.categories) params.append("categories", filters.categories);
        if (filters.instructors) params.append("instructors", filters.instructors);
        if (filters.audience) params.append("audience", filters.audience);
        if (filters.isActive !== undefined)
          params.append("isActive", filters.isActive.toString());
        if (filters.skillLevel) params.append("skillLevel", filters.skillLevel);
        if (filters.isFeatured !== undefined)
          params.append("isFeatured", filters.isFeatured.toString());
        if (filters.isCertified !== undefined)
          params.append("isCertified", filters.isCertified.toString());
        if (filters.sortBy) params.append("sortBy", filters.sortBy);
        if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

        if (filters.brand) params.append("brand", filters.brand);

        const response = await apiClient.get(
          `/courses/admin?${params.toString()}`
        );
        return response.data.data;
      }, "Failed to fetch admin courses");
    },
    [handleRequest]
  );

  const getAdminCourseOptions = useCallback(
    async (
      filters: CourseFilters = {}
    ): Promise<AdminCourseOptionsResponse | null> => {
      return handleRequest(async () => {
        const params = new URLSearchParams();
        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.search) params.append("search", filters.search);
        if (filters.searchTitleOnly) params.append("searchTitleOnly", "true");
        if (filters.categories) params.append("categories", filters.categories);
        if (filters.instructors) params.append("instructors", filters.instructors);
        if (filters.audience) params.append("audience", filters.audience);
        if (filters.isActive !== undefined)
          params.append("isActive", filters.isActive.toString());
        if (filters.sortBy) params.append("sortBy", filters.sortBy);
        if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

        if (filters.brand) params.append("brand", filters.brand);

        const response = await apiClient.get(
          `/courses/admin/options?${params.toString()}`
        );
        return response.data.data;
      }, "Failed to fetch admin course options");
    },
    [handleRequest]
  );

  const getAdminCourseById = useCallback(
    async (id: string): Promise<Course | null> => {
      return handleRequest(async () => {
        const response = await apiClient.get(`/courses/admin/id/${id}`);
        return response.data.data;
      }, "Failed to fetch admin course");
    },
    [handleRequest]
  );

  const getAdminCourseBySlug = useCallback(
    async (slug: string): Promise<Course | null> => {
      return handleRequest(async () => {
        const response = await apiClient.get(`/courses/admin/slug/${slug}`);
        return response.data.data;
      }, "Failed to fetch admin course");
    },
    [handleRequest]
  );

  const createCourse = useCallback(
    async (data: CreateCourseData): Promise<Course | null> => {
      return handleRequest(async () => {
        const response = await apiClient.post("/courses", data);
        return response.data.data;
      }, "Failed to create course");
    },
    [handleRequest]
  );

  const updateCourse = useCallback(
    async (
      id: string,
      data: Partial<CreateCourseData>
    ): Promise<Course | null> => {
      return handleRequest(async () => {
        const response = await apiClient.put(`/courses/${id}`, data);
        return response.data.data;
      }, "Failed to update course");
    },
    [handleRequest]
  );

  const updateCourseStatus = useCallback(
    async (id: string, isActive: boolean): Promise<Course | null> => {
      return handleRequest(async () => {
        const response = await apiClient.put(`/courses/${id}/status`, {
          status: isActive,
        });
        return response.data.data;
      }, "Failed to update course status");
    },
    [handleRequest]
  );

  const deleteCourse = useCallback(
    async (id: string): Promise<boolean | null> => {
      return handleRequest(async () => {
        const response = await apiClient.delete(`/courses/${id}`);
        return response.data.success;
      }, "Failed to delete course");
    },
    [handleRequest]
  );

  const duplicateCourse = useCallback(
    async (
      id: string,
      target?: { brand: Brand; category: string[] }
    ): Promise<Course | null> => {
      return handleRequest(async () => {
        const response = await apiClient.post(
          `/courses/admin/duplicate-metadata/${id}`,
          target ?? {}
        );
        return response.data.data;
      }, "Failed to duplicate course");
    },
    [handleRequest]
  );

  const duplicateCourseWithModules = useCallback(
    async (
      id: string,
      target?: { brand: Brand; category: string[] }
    ): Promise<Course | null> => {
      return handleRequest(async () => {
        const response = await apiClient.post(
          `/courses/admin/duplicate-with-modules/${id}`,
          target ?? {}
        );
        return response.data.data;
      }, "Failed to duplicate course with modules");
    },
    [handleRequest]
  );

  // ===================
  // Module Management Methods
  // ===================

  const createModule = useCallback(
    async (data: CreateModuleData): Promise<CourseModule | null> => {
      return handleRequest(async () => {
        const response = await apiClient.post(
          `/courses/${data.courseId}/modules`,
          data
        );
        return response.data.data;
      }, "Failed to create module");
    },
    [handleRequest]
  );

  const updateModule = useCallback(
    async (
      id: string,
      data: Partial<CreateModuleData>
    ): Promise<CourseModule | null> => {
      return handleRequest(async () => {
        const response = await apiClient.put(
          `/courses/${data.courseId}/modules/${id}`,
          data
        );
        return response.data.data;
      }, "Failed to update module");
    },
    [handleRequest]
  );

  const deleteModule = useCallback(
    async (courseId: string, moduleId: string): Promise<boolean | null> => {
      return handleRequest(async () => {
        const response = await apiClient.delete(
          `/courses/${courseId}/modules/${moduleId}`
        );
        return response.data.success;
      }, "Failed to delete module");
    },
    [handleRequest]
  );

  // ===================
  // Lesson Management Methods
  // ===================

  const createLesson = useCallback(
    async (
      courseId: string,
      data: CreateLessonData
    ): Promise<CourseLesson | null> => {
      return handleRequest(async () => {
        const response = await apiClient.post(
          `/courses/${courseId}/modules/${data.moduleId}/lessons`,
          data
        );
        return response.data.data;
      }, "Failed to create lesson");
    },
    [handleRequest]
  );

  const updateLesson = useCallback(
    async (
      courseId: string,
      moduleId: string,
      lessonId: string,
      data: Partial<CreateLessonData>
    ): Promise<CourseLesson | null> => {
      return handleRequest(async () => {
        const response = await apiClient.put(
          `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
          data
        );
        return response.data.data;
      }, "Failed to update lesson");
    },
    [handleRequest]
  );

  const deleteLesson = useCallback(
    async (
      courseId: string,
      moduleId: string,
      lessonId: string
    ): Promise<boolean | null> => {
      return handleRequest(async () => {
        const response = await apiClient.delete(
          `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
        );
        return response.data.success;
      }, "Failed to delete lesson");
    },
    [handleRequest]
  );

  // ===================
  // Content Management Methods
  // ===================

  const createContent = useCallback(
    async (
      courseId: string,
      moduleId: string,
      data: CreateContentData
    ): Promise<Content | null> => {
      return handleRequest(async () => {
        const response = await apiClient.post(
          `/courses/${courseId}/modules/${moduleId}/lessons/${data.lessonId}/contents`,
          data
        );
        return response.data.data;
      }, "Failed to create content");
    },
    [handleRequest]
  );

  const updateContent = useCallback(
    async (
      courseId: string,
      moduleId: string,
      lessonId: string,
      contentId: string,
      data: Partial<CreateContentData>
    ): Promise<Content | null> => {
      return handleRequest(async () => {
        const response = await apiClient.put(
          `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/contents/${contentId}`,
          data
        );
        return response.data.data;
      }, "Failed to update content");
    },
    [handleRequest]
  );

  const deleteContent = useCallback(
    async (
      courseId: string,
      moduleId: string,
      lessonId: string,
      contentId: string
    ): Promise<boolean | null> => {
      return handleRequest(async () => {
        const response = await apiClient.delete(
          `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/contents/${contentId}`
        );
        return response.data.success;
      }, "Failed to delete content");
    },
    [handleRequest]
  );

  // ===================
  // Utility Methods
  // ===================

  const validateCourse = useCallback(
    (data: Partial<CreateCourseData>): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (!data.title?.trim()) errors.push("Title is required");
      if (!data.description?.trim()) errors.push("Description is required");
      if (!data.shortDescription?.trim())
        errors.push("Short description is required");
      if (!Array.isArray(data.category) || data.category.length === 0) errors.push("At least one category is required");
      if (!data.thumbnail?.trim()) errors.push("Thumbnail is required");
      if (!data.whatYouWillLearn?.trim())
        errors.push("What you will learn is required");
      if (!data.skills?.length) errors.push("At least one skill is required");
      if (!data.careerPaths?.length)
        errors.push("At least one career path is required");
      if (!data.skillLevel?.trim()) errors.push("Skill level is required");
      if (!data.whoShouldJoin?.trim())
        errors.push("Who should join is required");
      if (!data.duration?.trim()) errors.push("Duration is required");
      if (!data.instructor?.length)
        errors.push("At least one instructor is required");
      if (!data.audience) errors.push("Audience is required");
      if (!data.slug?.trim()) errors.push("Slug is required");
      if (!data.language?.trim()) errors.push("Language is required");

      // Validate plans
      if (!data.plans?.elite && !data.plans?.essential) {
        errors.push("At least one plan (elite or essential) is required");
      }

      if (data.plans?.elite) {
        if (!data.plans.elite.title?.trim())
          errors.push("Elite plan title is required");
        if (!data.plans.elite.price || data.plans.elite.price <= 0)
          errors.push("Elite plan price must be greater than 0");
        if (!data.plans.elite.features?.length)
          errors.push("Elite plan must have at least one feature");
      }

      if (data.plans?.essential) {
        if (!data.plans.essential.title?.trim())
          errors.push("Essential plan title is required");
        if (!data.plans.essential.price || data.plans.essential.price <= 0)
          errors.push("Essential plan price must be greater than 0");
        if (!data.plans.essential.features?.length)
          errors.push("Essential plan must have at least one feature");
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },
    []
  );

  return {
    // State
    isLoading,
    error,
    clearError,

    // Public Course Methods
    getCourses,
    getFeaturedCourses,
    getCourseById,
    getCourseBySlug,
    getCoursesByCategory,
    getCoursesByAudience,

    // Admin Course Methods
    getAdminCourses,
    getAdminCourseOptions,
    getAdminCourseById,
    getAdminCourseBySlug,
    createCourse,
    updateCourse,
    updateCourseStatus,
    deleteCourse,
    duplicateCourse,
    duplicateCourseWithModules,

    // Module Management
    createModule,
    updateModule,
    deleteModule,

    // Lesson Management
    createLesson,
    updateLesson,
    deleteLesson,

    // Content Management
    createContent,
    updateContent,
    deleteContent,

    // Reorder Management
    reorderModules: useCallback(
      async (courseId: string, moduleIds: string[]): Promise<CourseModule[] | null> => {
        return handleRequest(async () => {
          const response = await apiClient.put(`/courses/${courseId}/modules/reorder`, {
            moduleIds,
          });
          return response.data.data;
        }, "Failed to reorder modules");
      },
      [handleRequest]
    ),

    reorderLessons: useCallback(
      async (moduleId: string, lessonIds: string[]): Promise<CourseLesson[] | null> => {
        return handleRequest(async () => {
          const response = await apiClient.put(`/courses/modules/${moduleId}/lessons/reorder`, {
            lessonIds,
          });
          return response.data.data;
        }, "Failed to reorder lessons");
      },
      [handleRequest]
    ),

    reorderContent: useCallback(
      async (lessonId: string, contentIds: string[]): Promise<Content[] | null> => {
        return handleRequest(async () => {
          const response = await apiClient.put(`/courses/lessons/${lessonId}/contents/reorder`, {
            contentIds,
          });
          return response.data.data;
        }, "Failed to reorder content");
      },
      [handleRequest]
    ),

    // Utilities
    validateCourse,
  };
};
