import { useState, useCallback } from 'react';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'student' | 'instructor' | 'collaborator';
  status: string;
  profilePicture?: string;
  provider: 'credentials' | 'google' | 'linkedin';
  permissions: string[];
  orders: any[];
  createdAt: string;
}

interface UsersResponse {
  success: boolean;
  message: string;
  data: {
    users: User[];
    total: number;
    totalPages: number;
  };
}

export const useUsers = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchUsers = useCallback(async (
    page: number = 1,
    limit: number = 10,
    search: string = ''
  ): Promise<UsersResponse | null> => {
    setIsLoading(true);
    setError('');

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });

      const response = await fetch(`${baseUrl}/admin/users/show?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUserById = useCallback(async (userId: string): Promise<User | null> => {
    setIsLoading(true);
    setError('');

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${baseUrl}/admin/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user');
      }

      return data.data.user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchUsers,
    fetchUserById,
    isLoading,
    error,
    clearError: () => setError('')
  };
};
