import { useCallback } from 'react';

export interface InstructorRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsappNumber?: string;
  password: string;
  profilePicture?: string;
  bio: string;
  currentPosition: string;
  currentCompany: string;
  previousExperience?: {
    companyName: string;
    position: string;
    duration: {
      from: Date;
      to: Date;
    };
    description: string;
  }[];
  address?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  linkedinUrl?: string;
  dob?: Date;
  userType: "instructor";
  provider: "credentials";
  permissions: string[];
}

export interface InstructorAuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: any;
    accessToken: string;
    refreshToken: string;
  };
  error?: string;
}

export const useInstructorAuth = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const registerInstructor = useCallback(async (data: InstructorRegistrationData): Promise<InstructorAuthResponse> => {
    try {
      const response = await fetch(`${baseUrl}/instructor/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      // Handle different HTTP status codes
      if (!response.ok) {
        // Handle specific error cases based on backend patterns
        if (response.status === 400) {
          // Validation errors or missing required fields
          if (result.message?.includes('Email and password are required')) {
            return {
              success: false,
              message: 'Email and password are required fields',
              error: 'VALIDATION_ERROR'
            };
          }
          if (result.message?.includes('validation failed')) {
            return {
              success: false,
              message: 'Please check all required fields and try again',
              error: 'VALIDATION_ERROR'
            };
          }
          return {
            success: false,
            message: result.message || 'Invalid data provided',
            error: 'BAD_REQUEST'
          };
        }
        
        if (response.status === 409) {
          // Duplicate email error
          return {
            success: false,
            message: 'An instructor with this email already exists',
            error: 'DUPLICATE_EMAIL'
          };
        }
        
        if (response.status === 401) {
          return {
            success: false,
            message: 'You are not authorized to create instructors',
            error: 'UNAUTHORIZED'
          };
        }
        
        if (response.status === 500) {
          return {
            success: false,
            message: 'Server error occurred. Please try again later',
            error: 'SERVER_ERROR'
          };
        }

        // Generic error for other status codes
        return {
          success: false,
          message: result.message || 'Failed to create instructor',
          error: 'API_ERROR'
        };
      }

      // Success case
      if (result.success) {
        return {
          success: true,
          message: result.message || 'Instructor created successfully',
          data: result.data
        };
      }

      // Handle unexpected response format
      return {
        success: false,
        message: result.message || 'Unexpected response from server',
        error: 'UNEXPECTED_RESPONSE'
      };

    } catch (err) {
      // Network errors or other exceptions
      if (err instanceof TypeError && err.message.includes('fetch')) {
        return {
          success: false,
          message: 'Network error. Please check your connection and try again',
          error: 'NETWORK_ERROR'
        };
      }
      
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      return {
        success: false,
        message: 'Failed to create instructor. Please try again',
        error: errorMessage
      };
    }
  }, [baseUrl]);

  return {
    registerInstructor
  };
};
