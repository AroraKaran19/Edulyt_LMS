import { useState, useCallback } from 'react';
import { Instructor } from '@/types';

// Response types
export interface InstructorResponse {
  success: boolean;
  message: string;
  data?: Instructor;
  error?: string;
}

export interface InstructorListResponse {
  success: boolean;
  message: string;
  data?: {
    instructors: Instructor[];
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

export const useInstructors = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  // Get all instructors
  const getAllInstructors = useCallback(async (
    page: number = 1,
    limit: number = 10,
    search: string = ""
  ): Promise<InstructorListResponse> => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search
      });

      const response = await fetch(`${baseUrl}/api/instructors?${params}`);
      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || result.message);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch instructors';
      setError(errorMessage);
      return {
        success: false,
        message: 'Failed to fetch instructors',
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  // Get instructor by ID
  const getInstructorById = useCallback(async (instructorId: string): Promise<InstructorResponse> => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${baseUrl}/api/instructors/${instructorId}`);
      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || result.message);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch instructor';
      setError(errorMessage);
      return {
        success: false,
        message: 'Failed to fetch instructor',
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  // Create instructor
  const createInstructor = useCallback(async (instructorData: Partial<Instructor>): Promise<InstructorResponse> => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${baseUrl}/api/instructors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(instructorData),
      });

      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || result.message);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create instructor';
      setError(errorMessage);
      return {
        success: false,
        message: 'Failed to create instructor',
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  // Update instructor
  const updateInstructor = useCallback(async (instructorId: string, instructorData: Partial<Instructor>): Promise<InstructorResponse> => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${baseUrl}/api/instructors/${instructorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(instructorData),
      });

      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || result.message);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update instructor';
      setError(errorMessage);
      return {
        success: false,
        message: 'Failed to update instructor',
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  // Delete instructor
  const deleteInstructor = useCallback(async (instructorId: string): Promise<InstructorResponse> => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${baseUrl}/api/instructors/${instructorId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || result.message);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete instructor';
      setError(errorMessage);
      return {
        success: false,
        message: 'Failed to delete instructor',
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
    getAllInstructors,
    getInstructorById,
    createInstructor,
    updateInstructor,
    deleteInstructor,
    
    // Reset error
    clearError: () => setError('')
  };
};