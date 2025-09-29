import { UserModel } from "../models/user.schema";
import { User } from "../types";
import { createErrorResponse, errorMessages } from "../utils/error.message";
import { NextFunction, Request, Response } from "express";
import jwt, {
  JwtPayload,
  TokenExpiredError,
  JsonWebTokenError,
} from "jsonwebtoken";

// Extend Express Request interface with typed user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

interface CustomJwtPayload extends JwtPayload {
  id: string;
  iat: number; // Issued-at timestamp for revocation check
}

// Constants for reusability
const AUTH_HEADER_REGEX = /^Bearer\s+([^\s]+)$/;

/**
 * Extracts and validates the JWT token from the Authorization header.
 * @param header Authorization header value
 * @returns Extracted token or null if invalid
 */
const extractToken = (header: string | undefined): string | null => {
  if (!header) return null;
  const match = header.match(AUTH_HEADER_REGEX);
  return match ? match[1] : null;
};

/**
 * Verifies the JWT token and returns the decoded payload.
 * @param token JWT token
 * @throws Error if verification fails
 * @returns Decoded payload
 */
const verifyToken = (token: string): CustomJwtPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(errorMessages.auth.MISSING_JWT_SECRET.message);
  }
  return jwt.verify(token, secret) as CustomJwtPayload;
};

/**
 * Checks if the token is revoked based on user's last logout timestamp.
 * @param payload Decoded JWT payload
 * @param user User document
 * @returns True if token is revoked
 */
const isTokenRevoked = (payload: CustomJwtPayload, user: User): boolean => {
  // TODO: Uncomment this when we have a proper logout system
  // if (!user.lastLogout) return false;
  // return user.lastLogout.getTime() / 1000 > payload.iat;
  return false;
};

/**
 * Middleware to verify JWT token and authenticate user.
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract and validate token
    const token = extractToken(req.headers.authorization);
    if (!token) {
      console.warn("Missing token in request");
      return createErrorResponse(res, errorMessages.auth.MISSING_TOKEN);
    }

    // Verify token
    let decoded: CustomJwtPayload;
    try {
      decoded = verifyToken(token);
    } catch (jwtError) {
      if (jwtError instanceof TokenExpiredError) {
        console.warn("Token expired");
        return createErrorResponse(res, errorMessages.auth.EXPIRED_TOKEN);
      } else if (jwtError instanceof JsonWebTokenError) {
        console.warn("Invalid token");
        return createErrorResponse(res, errorMessages.auth.INVALID_TOKEN);
      } else {
        console.error("Token verification failed:", jwtError);
        return createErrorResponse(
          res,
          errorMessages.auth.TOKEN_VERIFICATION_FAILED
        );
      }
    }

    // Validate payload
    if (!decoded.id) {
      console.warn("Invalid token payload");
      return createErrorResponse(res, errorMessages.auth.INVALID_TOKEN_PAYLOAD);
    }

    // Fetch user with timeout
    const user = (await Promise.race([
      UserModel.findById(decoded.id).lean(),
      //   new Promise((_, reject) =>
      //     setTimeout(() => reject(new Error("Database query timeout")), 5000)
      //   ),
    ])) as User | null;

    if (!user) {
      console.warn(`User not found: ${decoded.id}`);
      return createErrorResponse(res, errorMessages.user.USER_NOT_FOUND);
    }

    // Check token revocation
    if (isTokenRevoked(decoded, user)) {
      console.warn(`Revoked token used for user ${decoded.id}`);
      return createErrorResponse(res, errorMessages.auth.TOKEN_REVOKED);
    }

    req.user = user;
    console.info(`User authenticated: ${user._id}`);
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return createErrorResponse(res, errorMessages.general.INTERNAL_ERROR);
  }
};
