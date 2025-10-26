import { useSession } from 'next-auth/react';

export const useAccessToken = () => {
  const { data: session, status } = useSession();
  
  return {
    accessToken: session?.accessToken,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    error: session?.error,
  };
};
