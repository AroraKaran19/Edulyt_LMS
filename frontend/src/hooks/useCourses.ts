import { useState, useCallback } from 'react';
import { Course } from '@/types/course';

// Response types
export interface CourseResponse {
  success: boolean;
  message: string;
  data?: Course;
  error?: string;
}

export interface CourseListResponse {
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

export const useCourses = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  // Get all courses
  const getAllCourses = useCallback(async (
    page: number = 1,
    limit: number = 10,
    search: string = '',
    category?: string
  ): Promise<CourseListResponse> => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search
      });
      
      if (category) {
        params.append('category', category);
      }

      const response = await fetch(`${baseUrl}/api/courses?${params}`);
      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || result.message);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch courses';
      setError(errorMessage);
      return {
        success: false,
        message: 'Failed to fetch courses',
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  // Get course by slug
  const getCourseBySlug = useCallback(async (slug: string): Promise<CourseResponse> => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${baseUrl}/api/courses/${slug}`);
      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || result.message);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch course';
      setError(errorMessage);
      return {
        success: false,
        message: 'Failed to fetch course',
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  // Get course by ID
  const getCourseById = useCallback(async (courseId: string): Promise<CourseResponse> => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${baseUrl}/api/courses/id/${courseId}`);
      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || result.message);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch course';
      setError(errorMessage);
      return {
        success: false,
        message: 'Failed to fetch course',
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  // Create course
  const createCourse = useCallback(async (courseData: any): Promise<CourseResponse> => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${baseUrl}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || result.message);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create course';
      setError(errorMessage);
      return {
        success: false,
        message: 'Failed to create course',
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  // Update course
  const updateCourse = useCallback(async (courseId: string, courseData: any): Promise<CourseResponse> => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${baseUrl}/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || result.message);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update course';
      setError(errorMessage);
      return {
        success: false,
        message: 'Failed to update course',
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  // Delete course
  const deleteCourse = useCallback(async (courseId: string): Promise<CourseResponse> => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${baseUrl}/api/courses/${courseId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || result.message);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete course';
      setError(errorMessage);
      return {
        success: false,
        message: 'Failed to delete course',
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  return {
    // State
    isLoading,
    error,
    
    // Methods
    getAllCourses,
    getCourseBySlug,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    
    // Reset error
    clearError: () => setError('')
  };
};