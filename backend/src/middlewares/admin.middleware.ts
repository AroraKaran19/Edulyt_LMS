import { NextFunction, Request, Response } from "express";
import { AppError } from "./error.middleware";

export const verifyAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  // Check if user is authenticated (verifyUser should be called first)
  if (!user) {
    return next(new AppError("Authentication required", 401));
  }

  // Check if user is admin
  if (user.userType !== "admin") {
    return next(new AppError("Admin access required", 403));
  }

  next();
};
