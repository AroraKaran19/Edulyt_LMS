import { NextFunction, Request, Response } from "express";
import { AppError } from "./error.middleware";

export const verifyAdminOrInstructor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  // Check if user is authenticated (verifyUser should be called first)
  if (!user) {
    return next(new AppError("Authentication required", 401));
  }

  // Check if user is admin or instructor
  if (user.userType !== "admin" && user.userType !== "instructor") {
    return next(new AppError("Admin or Instructor access required", 403));
  }

  next();
};
