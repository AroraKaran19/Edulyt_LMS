// Instructor service for handling instructor-related API calls

import { Instructor } from "@/types/instructor";

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

class InstructorService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    if (!this.baseUrl) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
    }
  }

  /**
   * Get all instructors with pagination and search
   * @param page - Page number
   * @param limit - Items per page
   * @param search - Search term
   * @returns Promise with instructors list
   */
  async getAllInstructors(
    page: number = 1,
    limit: number = 10,
    search: string = ""
  ): Promise<InstructorListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });

      const response = await fetch(`${this.baseUrl}/instructors?${params}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching instructors:', error);
      return {
        success: false,
        message: 'Failed to fetch instructors',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get instructor by ID
   * @param instructorId - Instructor ID
   * @returns Promise with instructor data
   */
  async getInstructorById(instructorId: string): Promise<InstructorResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/instructors/${instructorId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching instructor:', error);
      return {
        success: false,
        message: 'Failed to fetch instructor',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create new instructor
   * @param instructorData - Instructor data
   * @returns Promise with creation result
   */
  async createInstructor(instructorData: Omit<Instructor, '_id'>): Promise<InstructorResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/instructors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(instructorData),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating instructor:', error);
      return {
        success: false,
        message: 'Failed to create instructor',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update instructor
   * @param instructorId - Instructor ID
   * @param instructorData - Updated instructor data
   * @returns Promise with update result
   */
  async updateInstructor(instructorId: string, instructorData: Omit<Instructor, '_id'>): Promise<InstructorResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/instructors/${instructorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(instructorData),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating instructor:', error);
      return {
        success: false,
        message: 'Failed to update instructor',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete instructor
   * @param instructorId - Instructor ID
   * @returns Promise with deletion result
   */
  async deleteInstructor(instructorId: string): Promise<InstructorResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/instructors/${instructorId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting instructor:', error);
      return {
        success: false,
        message: 'Failed to delete instructor',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get top rated instructors
   * @param limit - Number of instructors to return
   * @returns Promise with top instructors
   */
  async getTopInstructors(limit: number = 10): Promise<InstructorResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/instructors/top?limit=${limit}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching top instructors:', error);
      return {
        success: false,
        message: 'Failed to fetch top instructors',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

const instructorService = new InstructorService();
export default instructorService; 