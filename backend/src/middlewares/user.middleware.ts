import { Request, Response, NextFunction } from "express";
import { AppError } from "./error.middleware";
import { UserModel } from "../models";
import jwt from "jsonwebtoken";

export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
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

    // Verify access token
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET) as {
      userId: string;
      userType: string;
    };

    const user = await UserModel.findById(decoded.userId).select(
      "-password"
    );

    if (!user) {
      return next(new AppError("User not found", 401));
    }

    // Check if user is active
    if (user.status !== "active") {
      return next(new AppError("Account is not active", 401));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError("Invalid access token", 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError("Access token expired", 401));
    }
    next(error);
  }
};
