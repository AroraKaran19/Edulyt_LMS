// Course service for handling course-related API calls

export interface CourseCreationResponse {
  success: boolean;
  message: string;
  data?: {
    course: any;
    courseId: string;
    slug: string;
  };
  error?: string;
}

export interface CourseListResponse {
  success: boolean;
  message: string;
  data?: {
    courses: any[];
    pagination: {
      total: number;
      page: number;
      totalPages: number;
      limit: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  error?: string;
}

class CourseService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }

  /**
   * Create a new course
   * @param courseData - Course data to create
   * @returns Promise with creation result
   */
  async createCourse(courseData: any): Promise<CourseCreationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating course:', error);
      return {
        success: false,
        message: 'Failed to create course',
        error: error instanceof Error ? error.message : 'Unknown error'
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
        params.append('search', search);
      }

      if (filters && filters.length > 0) {
        filters.forEach(filter => params.append('filter', filter));
      }

      const response = await fetch(`${this.baseUrl}/admin/courses?${params}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching courses:', error);
      return {
        success: false,
        message: 'Failed to fetch courses',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update course status
   * @param courseId - Course ID
   * @param isActive - New status
   * @returns Promise with update result
   */
  async updateCourseStatus(courseId: string, isActive: boolean): Promise<CourseCreationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/courses/${courseId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating course status:', error);
      return {
        success: false,
        message: 'Failed to update course status',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Transform frontend form data to backend format
   * @param formData - Frontend form state
   * @returns Transformed data for backend
   */
  transformFormDataToBackend(formData: any): any {
    return {
      basicInfo: {
        courseTitle: formData.title,
        subtitle: formData.subtitle,
        courseDescription: formData.description,
        shortDescription: formData.shortDescription,
      },
      courseDetails: {
        category: formData.category,
        subcategory: formData.subcategory,
        skillLevel: formData.skillLevel,
        courseDuration: formData.duration,
        totalLectures: formData.totalLectures || 0,
      },
      media: {
        courseThumbnailUrl: formData.thumbnail,
        promotionalVideoUrl: formData.previewVideoUrl,
      },
      learningOutcomes: {
        whatYoullLearn: formData.whatYouWillLearn,
        targetAudience: formData.whoShouldJoin,
        prerequisites: formData.prerequisites?.join(', ') || '',
      },
      courseFeatures: {
        keyFeatures: formData.features?.join(', ') || '',
        courseTags: formData.tags?.join(', ') || '',
        careerPaths: formData.careerPaths?.join(', ') || '',
      },
      pricing: {
        professionals: {
          elite: formData.plans?.elite?.[0] || { price: 0, features: [] },
          essential: formData.plans?.essential?.[0] || { price: 0, features: [] },
        },
      },
      settings: {
        courseStatus: {
          featuredCourse: formData.isFeatured || false,
          certifiedCourse: formData.isCertified || false,
        },
        administrativeDetails: {
          courseCreator: 'admin',
        },
      },
      seoSettings: {
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        focusKeywords: formData.keywords?.join(', ') || '',
      },
      courseModules: formData.modules || [],
      instructor: formData.instructor || [],
      faqs: formData.faqs || [],
      reviews: formData.reviews || [],
      featuredReviews: formData.featuredReviews || [],
    };
  }

  /**
   * Validate course data before submission
   * @param formData - Course form data
   * @returns Validation result
   */
  validateCourseData(formData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!formData.title?.trim()) {
      errors.push('Course title is required');
    }

    if (!formData.description?.trim()) {
      errors.push('Course description is required');
    }

    if (!formData.category?.trim()) {
      errors.push('Course category is required');
    }

    if (!formData.thumbnail?.trim()) {
      errors.push('Course thumbnail is required');
    }

    if (!formData.skillLevel?.trim()) {
      errors.push('Skill level is required');
    }

    if (!formData.audience?.trim()) {
      errors.push('Target audience is required');
    }

    // At least one instructor
    if (!formData.instructor || formData.instructor.length === 0) {
      errors.push('At least one instructor is required');
    }

    // Valid instructor data
    if (formData.instructor && formData.instructor.length > 0) {
      formData.instructor.forEach((instructor: any, index: number) => {
        if (!instructor.name?.trim()) {
          errors.push(`Instructor ${index + 1} name is required`);
        }
        if (!instructor.bio?.trim()) {
          errors.push(`Instructor ${index + 1} bio is required`);
        }
        if (!instructor.linkedinUrl?.trim()) {
          errors.push(`Instructor ${index + 1} LinkedIn URL is required`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Save course as draft
   * @param formData - Course form data
   * @returns Promise with save result
   */
  async saveDraft(formData: any): Promise<CourseCreationResponse> {
    try {
      // For now, just save to localStorage
      // In future, this could be an API call to save draft to backend
      const draftKey = `course-draft-${Date.now()}`;
      localStorage.setItem(draftKey, JSON.stringify(formData));
      
      return {
        success: true,
        message: 'Draft saved successfully',
        data: {
          course: formData,
          courseId: draftKey,
          slug: formData.slug || ''
        }
      };
    } catch (error) {
      console.error('Error saving draft:', error);
      return {
        success: false,
        message: 'Failed to save draft',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all drafts
   * @returns Array of draft courses
   */
  getAllDrafts(): any[] {
    const drafts: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('course-draft-')) {
        try {
          const draft = JSON.parse(localStorage.getItem(key) || '{}');
          drafts.push({ ...draft, draftId: key });
        } catch (error) {
          console.warn('Failed to parse draft:', error);
        }
      }
    }
    return drafts.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
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