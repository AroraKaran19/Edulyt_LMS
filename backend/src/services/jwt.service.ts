import jwt, { SignOptions } from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate access and refresh token pair
 */
export const generateTokens = (
  userId: string, 
  role: string, 
  accessTokenExpiry?: string
): TokenPair => {
  const accessTokenSecret = process.env.JWT_ACCESS_SECRET;
  const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
  
  if (!accessTokenSecret || !refreshTokenSecret) {
    throw new Error('JWT secrets are not configured');
  }

  // Access token payload
  const accessPayload: TokenPayload = {
    userId,
    role
  };

  // Refresh token payload
  const refreshPayload: TokenPayload = {
    userId,
    role
  };

  // Generate access token
  const accessToken = (jwt.sign as any)(
    accessPayload,
    accessTokenSecret,
    {
      expiresIn: accessTokenExpiry || process.env.JWT_ACCESS_EXPIRES_IN || '15m',
      issuer: process.env.JWT_ISSUER || 'edulyt-lms',
      audience: process.env.JWT_AUDIENCE || 'edulyt-users'
    }
  );

  // Generate refresh token
  const refreshToken = (jwt.sign as any)(
    refreshPayload,
    refreshTokenSecret,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: process.env.JWT_ISSUER || 'edulyt-lms',
      audience: process.env.JWT_AUDIENCE || 'edulyt-users'
    }
  );

  return {
    accessToken,
    refreshToken
  };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    const accessTokenSecret = process.env.JWT_ACCESS_SECRET;
    
    if (!accessTokenSecret) {
      throw new Error('JWT access secret is not configured');
    }

    const decoded = jwt.verify(token, accessTokenSecret, {
      issuer: process.env.JWT_ISSUER || 'edulyt-lms',
      audience: process.env.JWT_AUDIENCE || 'edulyt-users'
    }) as TokenPayload;

    return decoded;
  } catch (error) {
    console.error('Access token verification failed:', error);
    return null;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
    
    if (!refreshTokenSecret) {
      throw new Error('JWT refresh secret is not configured');
    }

    const decoded = jwt.verify(token, refreshTokenSecret, {
      issuer: process.env.JWT_ISSUER || 'edulyt-lms',
      audience: process.env.JWT_AUDIENCE || 'edulyt-users'
    }) as TokenPayload;

    return decoded;
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Token decode failed:', error);
    return null;
  }
};

/**
 * Generate a temporary token for specific actions (email verification, password reset)
 */
export const generateTemporaryToken = (
  userId: string, 
  purpose: string, 
  expiresIn: string = '1h'
): string => {
  const tempSecret = process.env.JWT_TEMP_SECRET || process.env.JWT_ACCESS_SECRET;
  
  if (!tempSecret) {
    throw new Error('JWT temporary secret is not configured');
  }

  return (jwt.sign as any)(
    { userId, purpose },
    tempSecret,
    {
      expiresIn,
      issuer: process.env.JWT_ISSUER || 'edulyt-lms',
      audience: process.env.JWT_AUDIENCE || 'edulyt-users'
    }
  );
};

/**
 * Verify temporary token
 */
export const verifyTemporaryToken = (
  token: string, 
  expectedPurpose?: string
): { userId: string; purpose: string } | null => {
  try {
    const tempSecret = process.env.JWT_TEMP_SECRET || process.env.JWT_ACCESS_SECRET;
    
    if (!tempSecret) {
      throw new Error('JWT temporary secret is not configured');
    }

    const decoded = jwt.verify(token, tempSecret, {
      issuer: process.env.JWT_ISSUER || 'edulyt-lms',
      audience: process.env.JWT_AUDIENCE || 'edulyt-users'
    }) as { userId: string; purpose: string };

    // Check if purpose matches if provided
    if (expectedPurpose && decoded.purpose !== expectedPurpose) {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Temporary token verification failed:', error);
    return null;
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  // Check for Bearer token format
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  // Return as-is if not in Bearer format (for backward compatibility)
  return authHeader;
};

/**
 * Get token expiration time
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch (error) {
    console.error('Failed to get token expiration:', error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const expiration = getTokenExpiration(token);
    if (!expiration) {
      return true;
    }
    return expiration.getTime() < Date.now();
  } catch (error) {
    return true;
  }
};

/**
 * Refresh token if it's about to expire
 */
export const refreshTokenIfNeeded = (
  accessToken: string,
  refreshToken: string,
  bufferMinutes: number = 5
): { shouldRefresh: boolean; timeUntilExpiry?: number } => {
  try {
    const expiration = getTokenExpiration(accessToken);
    if (!expiration) {
      return { shouldRefresh: true };
    }

    const timeUntilExpiry = expiration.getTime() - Date.now();
    const bufferTime = bufferMinutes * 60 * 1000; // Convert to milliseconds

    return {
      shouldRefresh: timeUntilExpiry <= bufferTime,
      timeUntilExpiry: timeUntilExpiry > 0 ? timeUntilExpiry : 0
    };
  } catch (error) {
    return { shouldRefresh: true };
  }
}; 