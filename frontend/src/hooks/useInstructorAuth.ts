import { useState, useCallback } from 'react';

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
  previousExperience?: string[];
  address?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  linkedinUrl?: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const registerInstructor = useCallback(async (data: InstructorRegistrationData): Promise<InstructorAuthResponse> => {
    setIsLoading(true);
    setError('');

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
      
      if (!result.success) {
        setError(result.message || 'Failed to register instructor');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register instructor';
      setError(errorMessage);
      return {
        success: false,
        message: 'Failed to register instructor',
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  return {
    registerInstructor,
    isLoading,
    error,
    clearError: () => setError('')
  };
};
