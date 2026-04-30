import { Request, Response, NextFunction } from "express";
import { AppError } from "./error.middleware";
import { UserModel } from "../models";
import jwt from "jsonwebtoken";

export const verifyTokenForRefresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get access token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Access token required", 401));
    }

    const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!process.env.JWT_SECRET) {
      return next(new AppError("JWT_SECRET is not set", 500));
    }

    try {
      // Decode the token to get userId (even if expired)
      const decoded = jwt.decode(accessToken) as {
        userId: string;
        iat?: number;
        exp?: number;
      };

      if (!decoded || !decoded.userId) {
        return next(new AppError("Invalid token format", 401));
      }

      // Find user by userId
      let user;
      try {
        // Try to find user by ObjectId
        user = await UserModel.findById(decoded.userId).select(
          "-password -successPointsHistory",
        );

        // If not found, try to find by string ID
        if (!user) {
          user = await UserModel.findOne({ _id: decoded.userId }).select(
            "-password -successPointsHistory",
          );
        }
      } catch (dbError) {
        return next(new AppError("Database error", 500));
      }

      if (!user) {
        // User not found - token is invalid or user was deleted
        return next(new AppError("Invalid token - user not found", 401));
      }

      // Check if user is active
      if (user.status !== "active") {
        return next(new AppError("Account is not active", 401));
      }

      // Check if the accessToken exists in user's refreshTokens array
      const tokenExists = user.refreshTokens.some(
        (refreshToken) => refreshToken.token === accessToken,
      );

      if (!tokenExists) {
        return next(new AppError("Token not found in refresh tokens", 401));
      }

      // Set user and proceed (regardless of token expiration)
      req.user = user;
      return next();
    } catch (jwtError) {
      return next(new AppError("Invalid token", 401));
    }
  } catch (error) {
    return next(new AppError("Authentication failed", 401));
  }
};
