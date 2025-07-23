import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '../services/jwt.service';
import { UserModel } from '../models/user.schema';

// Extend Express Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        email?: string;
        name?: string;
      };
    }
  }
}

/**
 * Middleware to authenticate users using JWT
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
      return;
    }

    // Verify the token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired access token'
      });
      return;
    }

    // Check if user exists and is active
    const user = await UserModel.findById(decoded.userId);
    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User not found or account is deactivated'
      });
      return;
    }

    // Attach user info to request
    req.user = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Middleware to authorize users based on roles
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization failed'
      });
    }
  };
};

/**
 * Middleware for optional authentication (doesn't fail if no token)
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        const user = await UserModel.findById(decoded.userId);
        if (user && user.isActive) {
          req.user = {
            userId: user._id.toString(),
            role: user.role,
            email: user.email,
            name: user.name
          };
        }
      }
    }

    next();
  } catch (error) {
    // Don't fail the request for optional auth
    console.warn('Optional authentication failed:', error);
    next();
  }
};

/**
 * Middleware to check if user is verified
 */
export const requireEmailVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const user = await UserModel.findById(req.user.userId);
    if (!user || !user.isEmailVerified) {
      res.status(403).json({
        success: false,
        message: 'Email verification required',
        code: 'EMAIL_NOT_VERIFIED'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Email verification check error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification check failed'
    });
  }
};

/**
 * Middleware to check if user owns the resource or has admin privileges
 */
export const authorizeOwnerOrAdmin = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
      const currentUserId = req.user.userId;
      const userRole = req.user.role;

      // Allow if user owns the resource or is admin/superadmin
      if (resourceUserId === currentUserId || ['admin', 'superadmin'].includes(userRole)) {
        next();
        return;
      }

      res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    } catch (error) {
      console.error('Owner/Admin authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization failed'
      });
    }
  };
};

/**
 * Middleware to check rate limiting (basic implementation)
 */
interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (options: RateLimitOptions) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const identifier = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      const windowMs = options.windowMs || 15 * 60 * 1000; // Default 15 minutes
      const maxRequests = options.maxRequests || 100; // Default 100 requests
      
      // Clean up expired entries
      for (const [key, value] of rateLimitStore.entries()) {
        if (now > value.resetTime) {
          rateLimitStore.delete(key);
        }
      }

      const current = rateLimitStore.get(identifier);
      
      if (!current || now > current.resetTime) {
        // First request or window expired
        rateLimitStore.set(identifier, {
          count: 1,
          resetTime: now + windowMs
        });
        next();
        return;
      }

      if (current.count >= maxRequests) {
        res.status(429).json({
          success: false,
          message: options.message || 'Too many requests, please try again later',
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        });
        return;
      }

      // Increment counter
      current.count++;
      rateLimitStore.set(identifier, current);
      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next(); // Don't block request on rate limit error
    }
  };
};

/**
 * Middleware to validate request body against schema
 */
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { error } = schema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail: any) => detail.message)
        });
        return;
      }
      next();
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Validation failed'
      });
    }
  };
};

/**
 * Middleware to log requests
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';

  // Log request
  console.log(`📝 ${method} ${url} - ${ip} - ${userAgent}`);

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const statusColor = statusCode >= 400 ? '🔴' : statusCode >= 300 ? '🟡' : '🟢';
    
    console.log(`${statusColor} ${method} ${url} - ${statusCode} - ${duration}ms`);
    
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Middleware to handle CORS for authentication routes
 */
export const authCors = (req: Request, res: Response, next: NextFunction): void => {
  // Set CORS headers for authentication routes
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
}; 