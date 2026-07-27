import { NextFunction, Request, Response } from "express";
import { AppError } from "./error.middleware";

/** Only users with role instructor (not admin). */
export const verifyInstructor = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  if (!user) {
    return next(new AppError("Authentication required", 401));
  }
  if (user.userType !== "instructor") {
    return next(new AppError("Instructor access required", 403));
  }
  next();
};

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

  // Admin roles must stay in step with `verifyAdmin` — super-admin was missing
  // here, so a super-admin passed every `verifyAdmin` route but was rejected
  // from the ones behind this guard.
  if (
    user.userType !== "admin" &&
    user.userType !== "super-admin" &&
    user.userType !== "instructor"
  ) {
    return next(new AppError("Admin or Instructor access required", 403));
  }

  next();
};
